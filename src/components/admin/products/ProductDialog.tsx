import React, { useEffect, useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { useToast } from "@/components/ui/use-toast";
import { getProductImages } from "@/services/admin";
import { checkSKUExists, checkSlugExists } from "@/services/admin";
import useProductForm from "@/hooks/useProductForm";
import type { OpticalProduct } from "@/types";
import type { DbProductImage as ProductImage } from "@/types";
import type { ProductFormData } from "@/types/product-forms";

import {
  BasicInfoSection,
  PricingStockSection,
  ProductAttributesSection,
  FeaturesTogglesSection,
} from "./form";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProduct: OpticalProduct | null;
  onSaved: () => void; // called after successful create/update
  createProduct?: (data: Partial<OpticalProduct>) => Promise<OpticalProduct>;
  updateProduct?: (id: string, data: Partial<OpticalProduct>) => Promise<OpticalProduct>;
}

export const ProductDialog: React.FC<Props> = ({ open, onOpenChange, editingProduct, onSaved, createProduct, updateProduct }) => {
  const { formData, setFormData, productImages, setProductImages, pendingFiles, setPendingFiles, generateSlug, generateSKU, submit } =
    useProductForm({ onSaved: onSaved });
  const lastImagesRef = useRef<string>("");
  const [generatingSKU, setGeneratingSKU] = useState(false);
  const [generatingSlug, setGeneratingSlug] = useState(false);
  const { toast } = useToast();

  // generateSlug / generateSKU provided by hook

  const handleGenerateSKU = async () => {
    if (formData.name) {
      setGeneratingSKU(true);
      try {
        let newSKU = generateSKU(formData.name, formData.frame_style, formData.frame_size);
        let attempts = 0;
        while (attempts < 5) {
          const exists = await checkSKUExists(newSKU, editingProduct?.id);
          if (!exists) break;
          attempts++;
          newSKU = generateSKU(formData.name, formData.frame_style, formData.frame_size);
        }
        if (attempts >= 5) {
          toast({ title: "Error", description: "No se pudo generar un SKU único.", variant: "destructive" });
          return;
        }
        setFormData({ ...formData, sku: newSKU });
        toast({ title: "SKU generado", description: `Nuevo SKU: ${newSKU}` });
      } finally {
        setGeneratingSKU(false);
      }
    }
  };

  const handleGenerateSlug = async () => {
    if (formData.name) {
      setGeneratingSlug(true);
      try {
        let newSlug = generateSlug(formData.name as string);
        let attempts = 0;
        while (attempts < 5) {
          const exists = await checkSlugExists(newSlug, editingProduct?.id);
          if (!exists) break;
          attempts++;
          newSlug = generateSlug(formData.name as string) + `-${attempts}`;
        }
        if (attempts >= 5) {
          toast({ title: "Error", description: "No se pudo generar una URL única.", variant: "destructive" });
          return;
        }
        setFormData({ ...formData, slug: newSlug });
        toast({ title: "URL generada", description: `Nueva URL: /productos/${newSlug}` });
      } finally {
        setGeneratingSlug(false);
      }
    }
  };

  const handleImagesChange = useCallback((images: ProductImage[]) => {
    const imagesKey = JSON.stringify(
      images
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .map((img) => ({ url: img.url, s3_key: img.s3_key, is_primary: img.is_primary, sort_order: img.sort_order })),
    );
    if (lastImagesRef.current !== imagesKey) {
      lastImagesRef.current = imagesKey;
      setProductImages(images);
    }
  }, [setProductImages]);

  const loadProductImages = useCallback(async (productId: string) => {
    try {
      const images = await getProductImages(productId);
      const imagesKey = JSON.stringify(
        images
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          .map((img) => ({ url: img.url, s3_key: img.s3_key, is_primary: img.is_primary, sort_order: img.sort_order })),
      );
      lastImagesRef.current = imagesKey;
      setProductImages(images);
      return images;
    } catch (err) {
      console.error(err);
      lastImagesRef.current = "";
      setProductImages([]);
      return [];
    }
  }, [setProductImages]);

  useEffect(() => {
    // When editingProduct changes, populate form and load images
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        description: editingProduct.description || "",
        slug: editingProduct.slug,
        base_price: editingProduct.base_price,
        discount_percentage: editingProduct.discount_percentage ?? 0,
        is_active: editingProduct.is_active ?? true,
        stock_quantity: editingProduct.stock_quantity ?? 0,
        min_stock_level: editingProduct.min_stock_level ?? 5,
        sku: editingProduct.sku ?? "",
        frame_material: editingProduct.frame_material ?? "",
        lens_type: editingProduct.lens_type ?? "",
        frame_style: editingProduct.frame_style ?? "",
        frame_size: editingProduct.frame_size ?? "",
        lens_color: editingProduct.lens_color ?? "",
        frame_color: editingProduct.frame_color ?? "",
        gender: editingProduct.gender ?? "unisex",
        has_uv_protection: editingProduct.has_uv_protection ?? false,
        has_blue_filter: editingProduct.has_blue_filter ?? false,
        is_photochromic: editingProduct.is_photochromic ?? false,
        has_anti_reflective: editingProduct.has_anti_reflective ?? false,
        is_featured: editingProduct.is_featured ?? false,
        is_bestseller: editingProduct.is_bestseller ?? false,
        image_url: editingProduct.image_url || "",
      });
      loadProductImages(editingProduct.id);
    } else {
      // reset
      setProductImages([]);
      setPendingFiles([]);
      lastImagesRef.current = "";
      setFormData({
        name: "",
        description: "",
        slug: "",
        base_price: 0,
        discount_percentage: 0,
        is_active: true,
        stock_quantity: 0,
        min_stock_level: 5,
        sku: "",
        brand_id: undefined,
        frame_material: "",
        lens_type: "",
        frame_style: "",
        frame_size: "",
        lens_color: "",
        frame_color: "",
        gender: "unisex",
        has_uv_protection: false,
        has_blue_filter: false,
        is_photochromic: false,
        has_anti_reflective: false,
        is_featured: false,
        is_bestseller: false,
        image_url: "",
      });
    }
  }, [editingProduct, loadProductImages, setFormData, setProductImages, setPendingFiles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productId = await submit({
        isEdit: !!editingProduct,
        editingId: editingProduct?.id,
        createFn: createProduct,
        updateFn: updateProduct,
      });
      toast({
        title: editingProduct ? "Producto actualizado" : "Producto creado",
        description: editingProduct ? "El producto se actualizó correctamente" : "El producto se creó correctamente",
      });
      onSaved();
    } catch (err: unknown) {
      console.error(err);
      const message = typeof err === "object" && err !== null && "message" in err ? (err as { message?: unknown }).message : undefined;
      const msgStr = typeof message === "string" ? message : undefined;
      if (msgStr === "SKU_EXISTS") {
        toast({ title: "Error de validación", description: "El SKU ya existe.", variant: "destructive" });
        return;
      }
      if (msgStr === "SLUG_EXISTS") {
        toast({ title: "Error de validación", description: "La URL (slug) ya existe.", variant: "destructive" });
        return;
      }
      toast({
        title: "Error",
        description: editingProduct ? "No se pudo actualizar el producto" : "No se pudo crear el producto",
        variant: "destructive",
      });
    }
  };

  const handleFormChange = useCallback(
    (partial: Partial<ProductFormData>) => {
      setFormData((prev) => ({ ...prev, ...partial }));
    },
    [setFormData],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingProduct ? "Editar Producto" : "Crear Producto"}</DialogTitle>
          <DialogDescription>
            {editingProduct ? "Modifica los datos del producto" : "Completa el formulario para crear un nuevo producto"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <BasicInfoSection
              formData={formData}
              onChange={handleFormChange}
              onGenerateSKU={handleGenerateSKU}
              onGenerateSlug={handleGenerateSlug}
              generatingSKU={generatingSKU}
              generatingSlug={generatingSlug}
              generateSlug={generateSlug}
            />

            <PricingStockSection formData={formData} onChange={handleFormChange} />

            <ProductAttributesSection formData={formData} onChange={handleFormChange} />

            <FeaturesTogglesSection formData={formData} onChange={handleFormChange} />

            {/* Imágenes */}
            <div className="border-t pt-6">
              <ImageUpload
                productId={editingProduct?.id}
                existingImages={productImages}
                onImagesChange={handleImagesChange}
                maxImages={8}
                compressionType="product"
                enableAutoOptimization={true}
                deferUpload={!editingProduct}
                onPendingImagesChange={setPendingFiles}
              />
            </div>

            <div className="flex items-center space-x-2 border-t pt-4">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleFormChange({ is_active: checked })}
              />
              <Label htmlFor="is_active">Producto activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{editingProduct ? "Actualizar" : "Crear"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDialog;
