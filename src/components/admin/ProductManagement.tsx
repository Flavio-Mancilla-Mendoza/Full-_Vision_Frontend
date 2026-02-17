import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

import { ProductFilters } from "@/components/admin/products/ProductFilters";
import { ProductPagination } from "@/components/admin/products/ProductPagination";
import { ProductDialog } from "@/components/admin/products/ProductDialog";
import { ProductList } from "@/components/admin/products/ProductList";
import { useProducts } from "@/hooks/useProducts";
import { useBrands } from "@/hooks/useBrands";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import { useConfirm } from "@/hooks/useConfirm";
import type { OpticalProduct } from "@/types";

function ProductManagementInner() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyDiscounted, setShowOnlyDiscounted] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<OpticalProduct | null>(null);

  const confirm = useConfirm();
  const { toast } = useToast();
  const { brands } = useBrands();

  const {
    data: products,
    total: totalCount,
    totalPages,
    page,
    setPage,
    pageSize,
    setPageSize,
    setFilters,
    isLoading: isProductsLoading,
    refresh: refreshProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useProducts(1, 50);

  // Sincronizar filtros con useProducts
  useEffect(() => {
    setFilters({
      search: searchTerm || undefined,
      discounted: showOnlyDiscounted || undefined,
      brandId: selectedBrandId || undefined,
    });
    setPage(1);
  }, [searchTerm, showOnlyDiscounted, selectedBrandId, setFilters, setPage]);

  const handleEdit = (product: OpticalProduct) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = await confirm("¿Estás seguro de que quieres eliminar este producto?");
    if (!shouldDelete) return;
    try {
      await deleteProduct(id);
      toast({ title: "Producto eliminado", description: "El producto se eliminó correctamente" });
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el producto", variant: "destructive" });
    }
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
          onBrandChange={setSelectedBrandId}
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
              products={products ?? []}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewImages={handleEdit}
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
