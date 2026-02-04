import React, { useEffect, useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { useToast } from "@/components/ui/use-toast";
import { getProductImages } from "@/services/admin";
import BrandSelector from "@/components/admin/products/BrandSelector";
import { checkSKUExists, checkSlugExists } from "@/services/admin";
import useProductForm from "@/hooks/useProductForm";
import type { OpticalProduct } from "@/types";
import type { DbProductImage as ProductImage } from "@/types";
import type { ProductFormData } from "@/types/product-forms";

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
        discount_percentage: editingProduct.discount_percentage,
        is_active: editingProduct.is_active,
        stock_quantity: editingProduct.stock_quantity || 0,
        min_stock_level: editingProduct.min_stock_level || 5,
        sku: editingProduct.sku || "",
        frame_material: editingProduct.frame_material || "",
        lens_type: editingProduct.lens_type || "",
        frame_style: editingProduct.frame_style || "",
        frame_size: editingProduct.frame_size || "",
        lens_color: editingProduct.lens_color || "",
        frame_color: editingProduct.frame_color || "",
        gender: editingProduct.gender || "unisex",
        has_uv_protection: editingProduct.has_uv_protection,
        has_blue_filter: editingProduct.has_blue_filter,
        is_photochromic: editingProduct.is_photochromic,
        has_anti_reflective: editingProduct.has_anti_reflective,
        is_featured: editingProduct.is_featured,
        is_bestseller: editingProduct.is_bestseller,
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
            {/* Información básica */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({ ...formData, name, slug: formData.slug || generateSlug(name) });
                  }}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU</Label>
                <div className="flex gap-2">
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Ej: FV-RABA-AVD-M-A1B"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleGenerateSKU} disabled={!formData.name || generatingSKU}>
                    {generatingSKU ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      "Generar"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  El SKU se genera automáticamente basado en el nombre y características del producto
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <div className="flex gap-2">
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="se-genera-automaticamente"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleGenerateSlug} disabled={!formData.name || generatingSlug}>
                  {generatingSlug ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    "Generar"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                El slug se usa para la URL del producto: /productos/{formData.slug || "slug-del-producto"}
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="base_price">Precio Base (S/)</Label>
                  <Input
                    id="base_price"
                    type="text"
                    placeholder="Ej: 100.00"
                    value={formData.base_price > 0 ? formData.base_price.toString() : ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Solo permitir números y punto decimal
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        setFormData({ ...formData, base_price: parseFloat(value) || 0 });
                      }
                    }}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="discount_percentage">Descuento (%)</Label>
                  <Input
                    id="discount_percentage"
                    type="text"
                    placeholder="Ej: 15"
                    value={formData.discount_percentage > 0 ? formData.discount_percentage.toString() : ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Solo permitir números y punto decimal, máximo 100
                      if (value === "" || (/^\d*\.?\d*$/.test(value) && parseFloat(value) <= 100)) {
                        setFormData({ ...formData, discount_percentage: parseFloat(value) || 0 });
                      }
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Precio de Venta</Label>
                  <div className="flex items-center h-10 px-3 bg-muted rounded-md">
                    <span className="text-sm font-semibold">
                      {formData.discount_percentage > 0
                        ? new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
                            formData.base_price * (1 - formData.discount_percentage / 100),
                          )
                        : new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(formData.base_price)}
                    </span>
                  </div>
                </div>
              </div>
              {formData.discount_percentage > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      {formData.discount_percentage}% OFF
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Ahorro:{" "}
                      {new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
                        formData.base_price * (formData.discount_percentage / 100),
                      )}
                    </span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="stock_quantity">Stock</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="min_stock_level">Nivel Mínimo de Stock</Label>
                  <Input
                    id="min_stock_level"
                    type="number"
                    min="0"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 5 })}
                  />
                </div>
              </div>
            </div>

            {/* Características del marco */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Características del Producto</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="frame_material">Material del Marco</Label>
                  <Input
                    id="frame_material"
                    value={formData.frame_material}
                    onChange={(e) => setFormData({ ...formData, frame_material: e.target.value })}
                    placeholder="Ej: Acetato, Metal, Titanio"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lens_type">Tipo de Lente</Label>
                  <Input
                    id="lens_type"
                    value={formData.lens_type}
                    onChange={(e) => setFormData({ ...formData, lens_type: e.target.value })}
                    placeholder="Ej: Monofocal, Bifocal, Progresivo"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="frame_style">Estilo del Marco</Label>
                  <Input
                    id="frame_style"
                    value={formData.frame_style}
                    onChange={(e) => setFormData({ ...formData, frame_style: e.target.value })}
                    placeholder="Ej: Aviador, Redondo, Rectangular"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="frame_size">Tamaño del Marco</Label>
                  <Input
                    id="frame_size"
                    value={formData.frame_size}
                    onChange={(e) => setFormData({ ...formData, frame_size: e.target.value })}
                    placeholder="Ej: S, M, L o 52-18-140"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lens_color">Color del Lente</Label>
                  <Input
                    id="lens_color"
                    value={formData.lens_color}
                    onChange={(e) => setFormData({ ...formData, lens_color: e.target.value })}
                    placeholder="Ej: Transparente, Gris, Marrón"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="frame_color">Color del Marco</Label>
                  <Input
                    id="frame_color"
                    value={formData.frame_color}
                    onChange={(e) => setFormData({ ...formData, frame_color: e.target.value })}
                    placeholder="Ej: Negro, Dorado, Azul"
                  />
                </div>
              </div>
            </div>

            {/* Marca del producto */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Marca</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="brand">Marca del Producto</Label>
                  <BrandSelector
                    value={formData.brand_id as string | undefined}
                    onChange={(v) => setFormData({ ...formData, brand_id: v })}
                  />
                </div>
              </div>
            </div>

            {/* Género y características especiales */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Características Especiales</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="gender">Género</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unisex">Unisex</SelectItem>
                      <SelectItem value="hombre">Hombre</SelectItem>
                      <SelectItem value="mujer">Mujer</SelectItem>
                      <SelectItem value="niño">Niño</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has_uv_protection"
                      checked={formData.has_uv_protection}
                      onCheckedChange={(checked) => setFormData({ ...formData, has_uv_protection: checked })}
                    />
                    <Label htmlFor="has_uv_protection">Protección UV</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has_blue_filter"
                      checked={formData.has_blue_filter}
                      onCheckedChange={(checked) => setFormData({ ...formData, has_blue_filter: checked })}
                    />
                    <Label htmlFor="has_blue_filter">Filtro de Luz Azul</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_photochromic"
                      checked={formData.is_photochromic}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_photochromic: checked })}
                    />
                    <Label htmlFor="is_photochromic">Fotocromático</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has_anti_reflective"
                      checked={formData.has_anti_reflective}
                      onCheckedChange={(checked) => setFormData({ ...formData, has_anti_reflective: checked })}
                    />
                    <Label htmlFor="has_anti_reflective">Anti-reflejo</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Configuración de destacados */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Configuración de Destacados</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label htmlFor="is_featured">Producto Destacado</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_bestseller"
                    checked={formData.is_bestseller}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_bestseller: checked })}
                  />
                  <Label htmlFor="is_bestseller">Más Vendido</Label>
                </div>
              </div>
            </div>

            {/* Componente de subida de imágenes optimizado */}
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
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
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
