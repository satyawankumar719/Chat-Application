import { z} from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    PORT:z.string().default(3000),
    MONGO_URI:z.string().nonempty(" MONGODB_URL is required"),
    DB_NAME:z.string().nonempty("DB_NAME is required"),
    JWT_SECRET:z.string().default("JWT_SECRET is required"),
    JWT_EXPIRE:z.string().nonempty("7d"),
    EMAIL_USER:z.string().nonempty("EMAIL_USER is required"),
    EMAIL_PASS:z.string().nonempty("EMAIL_PASS is required"),
    REDIS_URL:z.string().nonempty("REDIS_URL is required")
})

export const ENV=envSchema.parse(process.env);