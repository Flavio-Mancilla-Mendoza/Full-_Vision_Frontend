const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const IMAGES_BUCKET_NAME = process.env.IMAGES_BUCKET_NAME;
const S3_REGION = process.env.S3_REGION || 'sa-east-1';

const s3Client = new S3Client({ region: S3_REGION });

async function generatePresignedUrl(s3Key) {
    if (!s3Key || !IMAGES_BUCKET_NAME) return null;
    const command = new GetObjectCommand({ Bucket: IMAGES_BUCKET_NAME, Key: s3Key });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

async function generatePresignedUploadUrl(fileName, contentType) {
    if (!IMAGES_BUCKET_NAME) throw new Error('IMAGES_BUCKET_NAME not configured');
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = fileName.split('.').pop();
    const s3Key = `products/${timestamp}-${randomString}.${extension}`;
    const command = new PutObjectCommand({ Bucket: IMAGES_BUCKET_NAME, Key: s3Key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    return { uploadUrl, s3Key, fileName };
}

/**
 * Eliminar un objeto de S3
 * @param {string} s3Key - Key del objeto a eliminar (ej: "products/1234-abc.jpg")
 */
async function deleteObject(s3Key) {
    if (!IMAGES_BUCKET_NAME) throw new Error('IMAGES_BUCKET_NAME not configured');
    if (!s3Key) throw new Error('s3Key is required');

    const command = new DeleteObjectCommand({
        Bucket: IMAGES_BUCKET_NAME,
        Key: s3Key,
    });

    await s3Client.send(command);
    return { deleted: true, s3Key };
}

module.exports = { generatePresignedUrl, generatePresignedUploadUrl, deleteObject };
