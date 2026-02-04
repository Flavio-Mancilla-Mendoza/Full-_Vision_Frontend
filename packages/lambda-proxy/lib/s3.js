const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
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

module.exports = { generatePresignedUrl, generatePresignedUploadUrl };
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IMAGES_BUCKET_NAME, S3_REGION } from './config.js';

const s3Client = new S3Client({ region: S3_REGION });

export async function generatePresignedUrl(s3Key, logger = console) {
    if (!s3Key || !IMAGES_BUCKET_NAME) return null;
    try {
        const command = new GetObjectCommand({ Bucket: IMAGES_BUCKET_NAME, Key: s3Key });
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return url;
    } catch (error) {
        logger.error('Error generating presigned URL:', error);
        return null;
    }
}

export async function generatePresignedUploadUrl(fileName, contentType, logger = console) {
    if (!IMAGES_BUCKET_NAME) throw new Error('IMAGES_BUCKET_NAME not configured');
    try {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const extension = fileName.split('.').pop();
        const s3Key = `products/${timestamp}-${randomString}.${extension}`;

        const command = new PutObjectCommand({ Bucket: IMAGES_BUCKET_NAME, Key: s3Key, ContentType: contentType });
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

        return { uploadUrl, s3Key, fileName };
    } catch (error) {
        logger.error('Error generating upload URL:', error);
        throw error;
    }
}

export default { generatePresignedUrl, generatePresignedUploadUrl };
