const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const IMAGES_BUCKET_NAME = process.env.IMAGES_BUCKET_NAME;
const S3_REGION = process.env.S3_REGION || 'sa-east-1';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const ADMIN_GROUP = process.env.ADMIN_GROUP || 'admins';

module.exports = {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    IMAGES_BUCKET_NAME,
    S3_REGION,
    LOG_LEVEL,
    ADMIN_GROUP,
};
