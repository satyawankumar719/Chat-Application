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
    EMAIL_USER:z.string().nonempty("EMAIL_USER is required"),
    EMAIL_PASS:z.string().nonempty("EMAIL_PASS is required"),
    REDIS_URL:z.string().nonempty("REDIS_URL is required"),
    CLIENT_URL:z.string().default("http://localhost:5173")
})

export const ENV=envSchema.parse(process.env);