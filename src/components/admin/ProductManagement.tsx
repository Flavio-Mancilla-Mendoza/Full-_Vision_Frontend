import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Package } from "lucide-react";

import { ProductFilters } from "@/components/admin/products/ProductFilters";
import { ProductPagination } from "@/components/admin/products/ProductPagination";
import { ProductDialog } from "@/components/admin/products/ProductDialog";
import { getAllOpticalProductsPaginated } from "@/services/admin";
import { useProducts } from "@/hooks/useProducts";
import { getAllBrands, createBrand, checkBrandExists, type Brand } from "@/services/brands";
import type { DbProductImage as ProductImage, OpticalProduct } from "@/types";
import type { ProductFormData } from "@/types/product-forms";

import { ProductRow } from "@/components/admin/products/ProductRow";
import { ProductList } from "@/components/admin/products/ProductList";
import { useToast } from "@/components/ui/use-toast";
// image helpers are used in dialog; parent no longer needs direct upload helpers
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import { useConfirm } from "@/hooks/useConfirm";
import { generateSlug, generateSKU } from "@/lib/product-utils";

function ProductManagementInner() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyDiscounted, setShowOnlyDiscounted] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<OpticalProduct | null>(null);

  const [generatingSKU, setGeneratingSKU] = useState(false);
  const [generatingSlug, setGeneratingSlug] = useState(false);

  // Estados para crear nueva marca
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");

  const [formData, setFormData] = useState<ProductFormData>({
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

  const confirm = useConfirm();
  const { toast } = useToast();

  // Cargar marcas
  const loadBrands = useCallback(async () => {
    try {
      const fetchedBrands = await getAllBrands();
      setBrands(fetchedBrands);
    } catch (error) {
      console.error("Error loading brands:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las marcas",
        variant: "destructive",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Crear nueva marca
  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la marca no puede estar vacío",
        variant: "destructive",
      });
      return;
    }

    try {
      // Verificar si ya existe
      const exists = await checkBrandExists(newBrandName);
      if (exists) {
        toast({
          title: "Marca existente",
          description: "Ya existe una marca con ese nombre",
          variant: "destructive",
        });
        return;
      }

      // Crear la nueva marca
      const newBrand = await createBrand({ name: newBrandName });

      // Actualizar lista de marcas
      setBrands((prev) => [...prev, newBrand].sort((a, b) => a.name.localeCompare(b.name)));

      // Seleccionar automáticamente la nueva marca
      setFormData((prev) => ({ ...prev, brand_id: newBrand.id }));

      // Limpiar y cerrar
      setNewBrandName("");
      setIsCreatingBrand(false);

      toast({
        title: "✅ Marca creada",
        description: `La marca "${newBrand.name}" se creó exitosamente`,
      });
    } catch (error) {
      console.error("Error creating brand:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la marca",
        variant: "destructive",
      });
    }
  };

  // useProducts hook (wraps usePagination)
  const {
    data: products,
    total: totalCount,
    totalPages,
    page,
    setPage,
    pageSize,
    setPageSize,
    filters,
    setFilters,
    isLoading: isProductsLoading,
    refresh: refreshProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useProducts(1, 50);

  // Initial brand load only (products are fetched by useQuery automatically)
  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  // Actualizar filtros cuando cambian search o showOnlyDiscounted
  useEffect(() => {
    setFilters({ search: searchTerm || undefined, discounted: showOnlyDiscounted || undefined, brandId: selectedBrandId || undefined });
    setPage(1);
  }, [searchTerm, showOnlyDiscounted, selectedBrandId, setFilters, setPage]);

  // SKU/slug generation handled by shared util `src/lib/product-utils.ts`

  const handleDelete = async (id: string) => {
    const shouldDelete = await confirm("¿Estás seguro de que quieres eliminar este producto?");
    if (!shouldDelete) return;
    try {
      await deleteProduct(id);
      toast({
        title: "Producto eliminado",
        description: "El producto se eliminó correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (product: OpticalProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      slug: product.slug,
      base_price: product.base_price,
      discount_percentage: product.discount_percentage,
      is_active: product.is_active,
      stock_quantity: product.stock_quantity || 0,
      min_stock_level: product.min_stock_level || 5,
      sku: product.sku || "",
      frame_material: product.frame_material || "",
      lens_type: product.lens_type || "",
      frame_style: product.frame_style || "",
      frame_size: product.frame_size || "",
      lens_color: product.lens_color || "",
      frame_color: product.frame_color || "",
      gender: product.gender || "unisex",
      has_uv_protection: product.has_uv_protection,
      has_blue_filter: product.has_blue_filter,
      is_photochromic: product.is_photochromic,
      has_anti_reflective: product.has_anti_reflective,
      is_featured: product.is_featured,
      is_bestseller: product.is_bestseller,
      image_url: product.image_url || "",
    });

    // Abrir diálogo para editar; el diálogo cargará sus propias imágenes
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    // Images are managed by the dialog component; clear editing state only
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
  };

  const filteredProducts = products || [];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(price);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Gestión de Productos
        </CardTitle>
        <CardDescription>Administra el catálogo de productos</CardDescription>
        <ProductFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showOnlyDiscounted={showOnlyDiscounted}
          onShowOnlyDiscountedChange={setShowOnlyDiscounted}
          brands={brands}
          selectedBrandId={selectedBrandId}
          onBrandChange={(id) => setSelectedBrandId(id)}
          pageSize={pageSize}
          setPageSize={setPageSize}
          onNew={() => setIsDialogOpen(true)}
        />

        <ProductDialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingProduct(null);
          }}
          editingProduct={editingProduct}
          createProduct={createProduct}
          updateProduct={updateProduct}
          onSaved={() => {
            setIsDialogOpen(false);
            setEditingProduct(null);
            refreshProducts();
          }}
        />
      </CardHeader>
      <CardContent>
        {isProductsLoading ? (
          <div className="text-center py-8">Cargando productos...</div>
        ) : (
          <>
            <ProductList
              products={filteredProducts}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewImages={(p) => {
                setIsDialogOpen(true);
                setEditingProduct(p);
              }}
            />

            <ProductPagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              setPage={setPage}
              setPageSize={setPageSize}
              isLoading={isProductsLoading}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

export const ProductManagement: React.FC = () => (
  <ConfirmProvider>
    <ProductManagementInner />
  </ConfirmProvider>
);
