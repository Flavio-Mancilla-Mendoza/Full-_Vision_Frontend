import { useCallback, useState } from "react";
import { checkSKUExists, checkSlugExists } from "@/services/admin";
import { saveProductImages } from "@/services/imageHelpers";
import type { OpticalProduct, DbProductImage as ProductImage, DbProductInsert, DbProductUpdate } from "@/types";
import type { ProductFormData } from "@/types/product-forms";
import { generateSlug, generateSKU } from "@/lib/product-utils";

export function useProductForm(opts?: { onSaved?: () => void }) {
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

  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // Use shared utilities for slug/SKU generation
  const generateSlugCb = useCallback((name: string) => generateSlug(name), []);
  const generateSKUCb = useCallback(
    (name: string, frameStyle?: string, frameSize?: string) => generateSKU(name, frameStyle, frameSize),
    [],
  );

  const checkUniqueSKU = useCallback(async (sku: string, excludeId?: string) => {
    return await checkSKUExists(sku, excludeId);
  }, []);

  const checkUniqueSlug = useCallback(async (slug: string, excludeId?: string) => {
    return await checkSlugExists(slug, excludeId);
  }, []);

  const submit = useCallback(
    async ({
      isEdit,
      editingId,
      createFn,
      updateFn,
    }: {
      isEdit: boolean;
      editingId?: string;
      createFn?: (data: DbProductInsert) => Promise<OpticalProduct>;
      updateFn?: (id: string, data: DbProductUpdate) => Promise<OpticalProduct>;
    }) => {
      // If SKU not provided, request server-generated SKU (ensures uniqueness)
      if (!formData.sku && formData.name) {
        try {
          const admin = await import("@/services/admin");
          const generated = await admin.generateProductSKU({
            name: formData.name,
            frame_style: formData.frame_style,
            frame_size: formData.frame_size,
            excludeProductId: editingId,
          });
          setFormData((prev) => ({ ...prev, sku: generated }));
        } catch (err) {
          console.error("Error requesting generated SKU:", err);
          // fallthrough: will still try with current formData.sku (might be empty)
        }
      }
      // Validate uniqueness
      if (formData.sku) {
        const exists = await checkUniqueSKU(formData.sku, editingId);
        if (exists) throw new Error("SKU_EXISTS");
      }
      const slug = formData.slug || generateSlug(formData.name);
      const slugExists = await checkUniqueSlug(slug, editingId);
      if (slugExists) throw new Error("SLUG_EXISTS");

      // Build product data with required fields
      const productData = {
        ...formData,
        slug,
        name: formData.name, // Ensure name is always present
        base_price: formData.base_price,
      };

      let productId: string;
      if (isEdit && editingId) {
        if (updateFn) await updateFn(editingId, productData as DbProductUpdate);
        else await (await import("@/services/admin")).updateOpticalProduct(editingId, productData as DbProductUpdate);
        productId = editingId;
      } else {
        let created: OpticalProduct;
        if (createFn) created = await createFn(productData as DbProductInsert);
        else created = await (await import("@/services/admin")).createOpticalProduct(productData as DbProductInsert);
        productId = created.id;
      }

      // Save images
      await saveProductImages(productId, productImages, pendingFiles, isEdit, () => {
        /* caller handles toast */
      });

      opts?.onSaved?.();
      return productId;
    },
    [formData, checkUniqueSKU, checkUniqueSlug, productImages, pendingFiles, opts],
  );

  return {
    formData,
    setFormData,
    productImages,
    setProductImages,
    pendingFiles,
    setPendingFiles,
    generateSlug: generateSlugCb,
    generateSKU: generateSKUCb,
    submit,
  };
}

export default useProductForm;
