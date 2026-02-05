"use strict";
// Lambda@Edge function for image optimization
// This runs at CloudFront edge locations (Origin Response event)
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const AWS = __importStar(require("aws-sdk"));
const sharp_1 = __importDefault(require("sharp"));
const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME || "";
// Parse query string parameters
function parseQueryParams(querystring) {
    const params = {};
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
function supportsWebP(headers) {
    const accept = headers["accept"]?.[0]?.value || "";
    return accept.includes("image/webp");
}
const handler = async (event) => {
    const request = event.Records[0].cf.request;
    const response = event.Records[0].cf.response;
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
        let transformer = (0, sharp_1.default)(s3Object.Body);
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
        }
        else {
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
            response.headers = {};
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
    }
    catch (error) {
        console.error("Error optimizing image:", error);
        // Return original response on error
        return response;
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsOENBQThDO0FBQzlDLGlFQUFpRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHakUsNkNBQStCO0FBQy9CLGtEQUEwQjtBQUUxQixNQUFNLEVBQUUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQztBQUN4QixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsSUFBSSxFQUFFLENBQUM7QUFPckQsZ0NBQWdDO0FBQ2hDLFNBQVMsZ0JBQWdCLENBQUMsV0FBbUI7SUFDM0MsTUFBTSxNQUFNLEdBQWdCLEVBQUUsQ0FBQztJQUMvQixNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRXJDLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFO1FBQ3hCLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNyQyxJQUFJLEdBQUcsS0FBSyxHQUFHLElBQUksS0FBSyxFQUFFO1lBQ3hCLE1BQU0sQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztTQUNwQztRQUNELElBQUksR0FBRyxLQUFLLEdBQUcsSUFBSSxLQUFLLEVBQUU7WUFDeEIsTUFBTSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQ3RDO0tBQ0Y7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQsZ0NBQWdDO0FBQ2hDLFNBQVMsWUFBWSxDQUFDLE9BQTBEO0lBQzlFLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssSUFBSSxFQUFFLENB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Q0FBQyxDQUFDO1FBQ2xELFFBQVEsQ0FBQyxZQUFZLEdBQUcsUUFBUSxDQUFDO1FBRWpDLHVEQUF1RDtRQUN2RCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRTtZQUNyQixRQUFRLENBQUMsT0FBTyxHQUFHLEVBQTJELENBQUM7U0FDaEY7UUFFRCxRQUFRLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxHQUFHO1lBQ2pDO2dCQUNFLEdBQUcsRUFBRSxjQUFjO2dCQUNuQixLQUFLLEVBQUUsU0FBUyxZQUFZLEVBQUU7YUFDL0I7U0FDRixDQUFDO1FBRUYsUUFBUSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsR0FBRztZQUNsQztnQkFDRSxHQUFHLEVBQUUsZUFBZTtnQkFDcEIsS0FBSyxFQUFFLHFDQUFxQzthQUM3QztTQUNGLENBQUM7UUFFRixPQUFPLFFBQVEsQ0FBQztLQUNqQjtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNoRCxvQ0FBb0M7UUFDcEMsT0FBTyxRQUFRLENBQUM7S0FDakI7QUFDSCxDQUFDLENBQUM7QUFuR1csUUFBQSxPQUFPLFdBbUdsQiIsInNvdXJjZXNDb250ZW50IjpbIi8vIExhbWJkYUBFZGdlIGZ1bmN0aW9uIGZvciBpbWFnZSBvcHRpbWl6YXRpb25cclxuLy8gVGhpcyBydW5zIGF0IENsb3VkRnJvbnQgZWRnZSBsb2NhdGlvbnMgKE9yaWdpbiBSZXNwb25zZSBldmVudClcclxuXHJcbmltcG9ydCB7IENsb3VkRnJvbnRSZXNwb25zZUV2ZW50LCBDbG91ZEZyb250UmVzcG9uc2VSZXN1bHQgfSBmcm9tIFwiYXdzLWxhbWJkYVwiO1xyXG5pbXBvcnQgKiBhcyBBV1MgZnJvbSBcImF3cy1zZGtcIjtcclxuaW1wb3J0IHNoYXJwIGZyb20gXCJzaGFycFwiO1xyXG5cclxuY29uc3QgczMgPSBuZXcgQVdTLlMzKCk7XHJcbmNvbnN0IEJVQ0tFVF9OQU1FID0gcHJvY2Vzcy5lbnYuUzNfQlVDS0VUX05BTUUgfHwgXCJcIjtcclxuXHJcbmludGVyZmFjZSBJbWFnZVBhcmFtcyB7XHJcbiAgd2lkdGg/OiBudW1iZXI7XHJcbiAgcXVhbGl0eT86IG51bWJlcjtcclxufVxyXG5cclxuLy8gUGFyc2UgcXVlcnkgc3RyaW5nIHBhcmFtZXRlcnNcclxuZnVuY3Rpb24gcGFyc2VRdWVyeVBhcmFtcyhxdWVyeXN0cmluZzogc3RyaW5nKTogSW1hZ2VQYXJhbXMge1xyXG4gIGNvbnN0IHBhcmFtczogSW1hZ2VQYXJhbXMgPSB7fTtcclxuICBjb25zdCBwYWlycyA9IHF1ZXJ5c3RyaW5nLnNwbGl0KFwiJlwiKTtcclxuXHJcbiAgZm9yIChjb25zdCBwYWlyIG9mIHBhaXJzKSB7XHJcbiAgICBjb25zdCBba2V5LCB2YWx1ZV0gPSBwYWlyLnNwbGl0KFwiPVwiKTtcclxuICAgIGlmIChrZXkgPT09IFwid1wiICYmIHZhbHVlKSB7XHJcbiAgICAgIHBhcmFtcy53aWR0aCA9IHBhcnNlSW50KHZhbHVlLCAxMCk7XHJcbiAgICB9XHJcbiAgICBpZiAoa2V5ID09PSBcInFcIiAmJiB2YWx1ZSkge1xyXG4gICAgICBwYXJhbXMucXVhbGl0eSA9IHBhcnNlSW50KHZhbHVlLCAxMCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcGFyYW1zO1xyXG59XHJcblxyXG4vLyBDaGVjayBpZiBjbGllbnQgc3VwcG9ydHMgV2ViUFxyXG5mdW5jdGlvbiBzdXBwb3J0c1dlYlAoaGVhZGVyczogUmVjb3JkPHN0cmluZywgeyBrZXk/OiBzdHJpbmc7IHZhbHVlOiBzdHJpbmcgfVtdPik6IGJvb2xlYW4ge1xyXG4gIGNvbnN0IGFjY2VwdCA9IGhlYWRlcnNbXCJhY2NlcHRcIl0/LlswXT8udmFsdWUgfHwgXCJcIjtcclxuICByZXR1cm4gYWNjZXB0LmluY2x1ZGVzKFwiaW1hZ2Uvd2VicFwiKTtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IENsb3VkRnJvbnRSZXNwb25zZUV2ZW50KTogUHJvbWlzZTxDbG91ZEZyb250UmVzcG9uc2VSZXN1bHQ+ID0+IHtcclxuICBjb25zdCByZXF1ZXN0ID0gZXZlbnQuUmVjb3Jkc1swXS5jZi5yZXF1ZXN0O1xyXG4gIC8vIENsb3VkRnJvbnQgcmVzcG9uc2UgdHlwaW5ncyBpbiBAdHlwZXMvYXdzLWxhbWJkYSBzb21ldGltZXMgb21pdFxyXG4gIC8vIGBib2R5YCAvIGBib2R5RW5jb2RpbmdgIHVzZWQgYnkgTGFtYmRhQEVkZ2UuIENyZWF0ZSBhbiBhdWdtZW50ZWRcclxuICAvLyB0eXBlIHRvIHByZXNlcnZlIHR5cGUtc2FmZXR5IHdpdGhvdXQgdXNpbmcgYGFueWAuXHJcbiAgdHlwZSBDRlJlc3BvbnNlV2l0aEJvZHkgPSBDbG91ZEZyb250UmVzcG9uc2VSZXN1bHQgJiB7XHJcbiAgICBib2R5Pzogc3RyaW5nO1xyXG4gICAgYm9keUVuY29kaW5nPzogXCJ0ZXh0XCIgfCBcImJhc2U2NFwiO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IHJlc3BvbnNlID0gZXZlbnQuUmVjb3Jkc1swXS5jZi5yZXNwb25zZSBhcyBDRlJlc3BvbnNlV2l0aEJvZHk7XHJcblxyXG4gIC8vIE9ubHkgcHJvY2VzcyBpbWFnZXNcclxuICBjb25zdCB1cmkgPSByZXF1ZXN0LnVyaTtcclxuICBjb25zdCBpc0ltYWdlID0gL1xcLihqcGd8anBlZ3xwbmd8Z2lmfHdlYnApJC9pLnRlc3QodXJpKTtcclxuXHJcbiAgaWYgKCFpc0ltYWdlKSB7XHJcbiAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgfVxyXG5cclxuICAvLyBQYXJzZSB0cmFuc2Zvcm1hdGlvbiBwYXJhbWV0ZXJzXHJcbiAgY29uc3QgcXVlcnlzdHJpbmcgPSByZXF1ZXN0LnF1ZXJ5c3RyaW5nIHx8IFwiXCI7XHJcbiAgY29uc3QgcGFyYW1zID0gcGFyc2VRdWVyeVBhcmFtcyhxdWVyeXN0cmluZyk7XHJcblxyXG4gIC8vIElmIG5vIHRyYW5zZm9ybWF0aW9ucyByZXF1ZXN0ZWQsIHJldHVybiBvcmlnaW5hbFxyXG4gIGlmICghcGFyYW1zLndpZHRoICYmICFwYXJhbXMucXVhbGl0eSkge1xyXG4gICAgcmV0dXJuIHJlc3BvbnNlO1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIC8vIEdldCBpbWFnZSBmcm9tIFMzXHJcbiAgICBjb25zdCBzM0tleSA9IHVyaS5zdGFydHNXaXRoKFwiL1wiKSA/IHVyaS5zdWJzdHJpbmcoMSkgOiB1cmk7XHJcbiAgICBjb25zdCBzM09iamVjdCA9IGF3YWl0IHMzXHJcbiAgICAgIC5nZXRPYmplY3Qoe1xyXG4gICAgICAgIEJ1Y2tldDogQlVDS0VUX05BTUUsXHJcbiAgICAgICAgS2V5OiBzM0tleSxcclxuICAgICAgfSlcclxuICAgICAgLnByb21pc2UoKTtcclxuXHJcbiAgICBpZiAoIXMzT2JqZWN0LkJvZHkpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIkVtcHR5IFMzIG9iamVjdCBib2R5XCIpO1xyXG4gICAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVHJhbnNmb3JtIGltYWdlIHdpdGggc2hhcnBcclxuICAgIGxldCB0cmFuc2Zvcm1lciA9IHNoYXJwKHMzT2JqZWN0LkJvZHkgYXMgQnVmZmVyKTtcclxuXHJcbiAgICAvLyBSZXNpemUgaWYgd2lkdGggc3BlY2lmaWVkXHJcbiAgICBpZiAocGFyYW1zLndpZHRoKSB7XHJcbiAgICAgIHRyYW5zZm9ybWVyID0gdHJhbnNmb3JtZXIucmVzaXplKHBhcmFtcy53aWR0aCwgbnVsbCwge1xyXG4gICAgICAgIGZpdDogXCJpbnNpZGVcIixcclxuICAgICAgICB3aXRob3V0RW5sYXJnZW1lbnQ6IHRydWUsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENvbnZlcnQgdG8gV2ViUCBpZiBzdXBwb3J0ZWRcclxuICAgIGNvbnN0IG91dHB1dEZvcm1hdCA9IHN1cHBvcnRzV2ViUChyZXF1ZXN0LmhlYWRlcnMpID8gXCJ3ZWJwXCIgOiBcImpwZWdcIjtcclxuICAgIGNvbnN0IHF1YWxpdHkgPSBwYXJhbXMucXVhbGl0eSB8fCA4NTtcclxuXHJcbiAgICBpZiAob3V0cHV0Rm9ybWF0ID09PSBcIndlYnBcIikge1xyXG4gICAgICB0cmFuc2Zvcm1lciA9IHRyYW5zZm9ybWVyLndlYnAoeyBxdWFsaXR5IH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdHJhbnNmb3JtZXIgPSB0cmFuc2Zvcm1lci5qcGVnKHsgcXVhbGl0eSwgcHJvZ3Jlc3NpdmU6IHRydWUgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRXhlY3V0ZSB0cmFuc2Zvcm1hdGlvblxyXG4gICAgY29uc3Qgb3B0aW1pemVkSW1hZ2UgPSBhd2FpdCB0cmFuc2Zvcm1lci50b0J1ZmZlcigpO1xyXG5cclxuICAgIC8vIFVwZGF0ZSByZXNwb25zZSB3aXRoIG9wdGltaXplZCBpbWFnZVxyXG4gICAgcmVzcG9uc2Uuc3RhdHVzID0gXCIyMDBcIjtcclxuICAgIHJlc3BvbnNlLnN0YXR1c0Rlc2NyaXB0aW9uID0gXCJPS1wiO1xyXG4gICAgcmVzcG9uc2UuYm9keSA9IG9wdGltaXplZEltYWdlLnRvU3RyaW5nKFwiYmFzZTY0XCIpO1xyXG4gICAgcmVzcG9uc2UuYm9keUVuY29kaW5nID0gXCJiYXNlNjRcIjtcclxuXHJcbiAgICAvLyBFbnN1cmUgaGVhZGVycyBvYmplY3QgZXhpc3RzIHdpdGggdGhlIGV4cGVjdGVkIHNoYXBlXHJcbiAgICBpZiAoIXJlc3BvbnNlLmhlYWRlcnMpIHtcclxuICAgICAgcmVzcG9uc2UuaGVhZGVycyA9IHt9IGFzIFJlY29yZDxzdHJpbmcsIEFycmF5PHsga2V5OiBzdHJpbmc7IHZhbHVlOiBzdHJpbmcgfT4+O1xyXG4gICAgfVxyXG5cclxuICAgIHJlc3BvbnNlLmhlYWRlcnNbXCJjb250ZW50LXR5cGVcIl0gPSBbXHJcbiAgICAgIHtcclxuICAgICAgICBrZXk6IFwiQ29udGVudC1UeXBlXCIsXHJcbiAgICAgICAgdmFsdWU6IGBpbWFnZS8ke291dHB1dEZvcm1hdH1gLFxyXG4gICAgICB9LFxyXG4gICAgXTtcclxuXHJcbiAgICByZXNwb25zZS5oZWFkZXJzW1wiY2FjaGUtY29udHJvbFwiXSA9IFtcclxuICAgICAge1xyXG4gICAgICAgIGtleTogXCJDYWNoZS1Db250cm9sXCIsXHJcbiAgICAgICAgdmFsdWU6IFwicHVibGljLCBtYXgtYWdlPTMxNTM2MDAwLCBpbW11dGFibGVcIixcclxuICAgICAgfSxcclxuICAgIF07XHJcblxyXG4gICAgcmV0dXJuIHJlc3BvbnNlO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiRXJyb3Igb3B0aW1pemluZyBpbWFnZTpcIiwgZXJyb3IpO1xyXG4gICAgLy8gUmV0dXJuIG9yaWdpbmFsIHJlc3BvbnNlIG9uIGVycm9yXHJcbiAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgfVxyXG59O1xyXG4iXX0=