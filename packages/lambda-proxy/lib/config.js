export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const IMAGES_BUCKET_NAME = process.env.IMAGES_BUCKET_NAME;
export const S3_REGION = process.env.S3_REGION || 'sa-east-1';
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
export const ADMIN_GROUP = process.env.ADMIN_GROUP || 'admins';

export default {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    IMAGES_BUCKET_NAME,
    S3_REGION,
    LOG_LEVEL,
    ADMIN_GROUP,
};
