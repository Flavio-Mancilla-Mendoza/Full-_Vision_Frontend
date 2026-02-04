// Lambda@Edge function for image optimization
// This runs at CloudFront edge locations (Origin Response event)

import { CloudFrontResponseEvent, CloudFrontResponseResult } from "aws-lambda";
import * as AWS from "aws-sdk";
import sharp from "sharp";

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME || "";

interface ImageParams {
  width?: number;
  quality?: number;
}

// Parse query string parameters
function parseQueryParams(querystring: string): ImageParams {
  const params: ImageParams = {};
  const pairs = querystring.split("&");

  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key === "w" && value) {
      params.width = parseInt(value, 10);
    }
    if (key === "q" && value) {
      params.quality = parseInt(value, 10);
    }
  }

  return params;
}

// Check if client supports WebP
function supportsWebP(headers: Record<string, { key?: string; value: string }[]>): boolean {
  const accept = headers["accept"]?.[0]?.value || "";
  return accept.includes("image/webp");
}

export const handler = async (event: CloudFrontResponseEvent): Promise<CloudFrontResponseResult> => {
  const request = event.Records[0].cf.request;
  // CloudFront response typings in @types/aws-lambda sometimes omit
  // `body` / `bodyEncoding` used by Lambda@Edge. Create an augmented
  // type to preserve type-safety without using `any`.
  type CFResponseWithBody = CloudFrontResponseResult & {
    body?: string;
    bodyEncoding?: "text" | "base64";
  };

  const response = event.Records[0].cf.response as CFResponseWithBody;

  // Only process images
  const uri = request.uri;
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(uri);

  if (!isImage) {
    return response;
  }

  // Parse transformation parameters
  const querystring = request.querystring || "";
  const params = parseQueryParams(querystring);

  // If no transformations requested, return original
  if (!params.width && !params.quality) {
    return response;
  }

  try {
    // Get image from S3
    const s3Key = uri.startsWith("/") ? uri.substring(1) : uri;
    const s3Object = await s3
      .getObject({
        Bucket: BUCKET_NAME,
        Key: s3Key,
      })
      .promise();

    if (!s3Object.Body) {
      console.error("Empty S3 object body");
      return response;
    }

    // Transform image with sharp
    let transformer = sharp(s3Object.Body as Buffer);

    // Resize if width specified
    if (params.width) {
      transformer = transformer.resize(params.width, null, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Convert to WebP if supported
    const outputFormat = supportsWebP(request.headers) ? "webp" : "jpeg";
    const quality = params.quality || 85;

    if (outputFormat === "webp") {
      transformer = transformer.webp({ quality });
    } else {
      transformer = transformer.jpeg({ quality, progressive: true });
    }

    // Execute transformation
    const optimizedImage = await transformer.toBuffer();

    // Update response with optimized image
    response.status = "200";
    response.statusDescription = "OK";
    response.body = optimizedImage.toString("base64");
    response.bodyEncoding = "base64";

    // Ensure headers object exists with the expected shape
    if (!response.headers) {
      response.headers = {} as Record<string, Array<{ key: string; value: string }>>;
    }

    response.headers["content-type"] = [
      {
        key: "Content-Type",
        value: `image/${outputFormat}`,
      },
    ];

    response.headers["cache-control"] = [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ];

    return response;
  } catch (error) {
    console.error("Error optimizing image:", error);
    // Return original response on error
    return response;
  }
};
