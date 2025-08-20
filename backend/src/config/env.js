import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables
dotenv.config();

// Environment schema validation
const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().transform(Number).pipe(z.number().min(1000)).default("8081"),

  // Database
  DB_HOST: z.string().default("localhost"),
  DB_USER: z.string().default("root"),
  DB_PASSWORD: z.string().default(""),
  DB_NAME: z.string().default("khandeshwar_db"),
  DB_PORT: z.string().transform(Number).pipe(z.number()).default("3306"),

  // JWT
  JWT_SECRET: z
    .string()
    .min(32)
    .default("your-super-secret-jwt-key-change-in-production"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32)
    .default("your-super-secret-refresh-jwt-key-change-in-production"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // AWS
  AWS_REGION: z.string().default("us-east-1"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),

  // SES
  SES_FROM_EMAIL: z.string().email().optional(),

  // CORS
  CORS_ORIGINS: z.string().default("http://localhost:5173"),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default("900000"), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default("100"),
});

// Validate and export environment variables
let env;
try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error(">> Invalid environment variables:", error.errors);
  process.exit(1);
}

export default env;
