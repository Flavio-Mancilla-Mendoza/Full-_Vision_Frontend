import { uploadProductImage } from "./imageStorage";
import {
  getProductImages,
  createProductImageRecord,
  updateProductImageRecord,
  deleteProductImageRecord,
  updateOpticalProduct,
} from "./admin";
import type { DbProductImage as ProductImage } from "@/types";

export async function saveProductImages(
  productId: string,
  productImages: ProductImage[],
  pendingFiles: File[],
  isEdit: boolean,
  toast?: (opts: { title: string; description: string; variant?: "default" | "destructive" }) => void
) {
  try {
    const uploadedImages: ProductImage[] = [];

    if (pendingFiles.length > 0) {
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        try {
          const result = await uploadProductImage(file, "products");
          if (!result.success || !result.s3Key) throw new Error(result.error || "Error al subir imagen");

          const matchingImage = productImages.find((img) => img.alt_text === file.name);

          uploadedImages.push({
            id: "",
            product_id: productId,
            url: result.url || result.s3Key,
            s3_key: result.s3Key,
            alt_text: matchingImage?.alt_text || file.name,
            sort_order: matchingImage?.sort_order || i,
            is_primary: matchingImage?.is_primary || i === 0,
            created_at: new Date().toISOString(),
          });
        } catch (err) {
          console.error("Error subiendo archivo:", file.name, err);
          toast?.({ title: "Error al subir imagen", description: `No se pudo subir ${file.name}`, variant: "destructive" });
        }
      }
    }

    const allImagesToSave = [...uploadedImages, ...productImages.filter((img) => img.s3_key && !img.url.startsWith("blob:"))];

    if (isEdit) {
      const existingImages = await getProductImages(productId);
      const currentImageUrls = allImagesToSave.map((img) => img.url);
      for (const existingImage of existingImages) {
        if (!currentImageUrls.includes(existingImage.url)) {
          await deleteProductImageRecord(existingImage.id);
        }
      }
    }

    for (const image of allImagesToSave) {
      if (image.id) {
        await updateProductImageRecord(image.id, {
          url: image.url,
          s3_key: image.s3_key,
          alt_text: image.alt_text,
          sort_order: image.sort_order,
          is_primary: image.is_primary,
        });
      } else {
        await createProductImageRecord(productId, {
          url: image.url,
          s3_key: image.s3_key,
          alt_text: image.alt_text,
          sort_order: image.sort_order,
          is_primary: image.is_primary,
        });
      }
    }

    const primaryImage = allImagesToSave.find((img) => img.is_primary) || allImagesToSave[0];
    if (primaryImage) {
      await updateOpticalProduct(productId, { image_url: primaryImage.url });
    }
  } catch (error) {
    console.error("Error saving product images:", error);
    toast?.({ title: "Error con imágenes", description: "Hubo un problema al guardar las imágenes", variant: "destructive" });
    throw error;
  }
}

export default saveProductImages;
