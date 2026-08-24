import { z} from 'zod';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.join(__dirname, '../.env') });

const envSchema = z.object({
    PORT:z.string().default("5000"),
    MONGO_URI:z.string().nonempty("MONGODB_URL is required"),
    DB_NAME:z.string().nonempty("DB_NAME is required"),
    JWT_SECRET:z.string().nonempty("JWT_SECRET is required"),
    JWT_EXPIRE:z.string().default("7d"),
    NODE_ENV :z.string().default("development"),
    EMAIL_USER:z.string().nonempty("EMAIL_USER is required"),
    EMAIL_PASS:z.string().nonempty("EMAIL_PASS is required"),
    REDIS_URL:z.string().nonempty("REDIS_URL is required"),
    CLIENT_URL:z.string().default("http://localhost:5173"),
    AWS_ACCESS_KEY_ID: z.string().optional().default(""),
    AWS_SECRET_ACCESS_KEY: z.string().optional().default(""),
    AWS_REGION: z.string().optional().default("us-east-1"),
    AWS_S3_BUCKET_NAME: z.string().optional().default("")
})

export const ENV=envSchema.parse(process.env);