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

  // JWT - Authentication token configuration
  // JWT secrets must be at least 32 characters long for security
  // In production, use cryptographically secure random strings
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters long for security")
    .refine(
      (val) => val !== "your-super-secret-jwt-key-change-in-production",
      "JWT_SECRET must be changed from default value in production"
    ),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters long for security")
    .refine(
      (val) => val !== "your-super-secret-refresh-jwt-key-change-in-production",
      "JWT_REFRESH_SECRET must be changed from default value in production"
    ),
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
  
  // Additional runtime validation for production
  if (env.NODE_ENV === 'production') {
    const warnings = [];
    
    if (env.JWT_SECRET.includes('change-in-production')) {
      warnings.push('JWT_SECRET should be changed from default value in production');
    }
    
    if (env.JWT_REFRESH_SECRET.includes('change-in-production')) {
      warnings.push('JWT_REFRESH_SECRET should be changed from default value in production');
    }
    
    if (warnings.length > 0) {
      console.warn('⚠️  Security warnings:', warnings.join(', '));
    }
  }
  
  console.log('✅ Environment configuration loaded successfully');
} catch (error) {
  console.error("❌ Invalid environment variables:");
  
  if (error.errors) {
    error.errors.forEach(err => {
      console.error(`   • ${err.path.join('.')}: ${err.message}`);
    });
  } else {
    console.error(`   • ${error.message}`);
  }
  
  console.error("\n💡 Please check your .env file and ensure all required variables are set correctly.");
  process.exit(1);
}

export default env;
