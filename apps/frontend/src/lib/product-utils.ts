// Utilities for product identifiers: slug and SKU generation
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function generateSKU(name: string, frameStyle?: string, frameSize?: string): string {
  const prefix = "FV";
  const nameCode = (name || "")
    .split(" ")
    .map((w) => w.substring(0, 2).toUpperCase())
    .join("")
    .substring(0, 4);
  const styleCode = frameStyle ? frameStyle.substring(0, 3).toUpperCase() : "GEN";
  const sizeCode = frameSize ? frameSize.toUpperCase() : "M";
  const randomCode = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${nameCode}-${styleCode}-${sizeCode}-${randomCode}`;
}

export default { generateSlug, generateSKU };
