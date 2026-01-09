import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.string(),
  MONGO_URI: z.string(),
  DB_NAME: z.string(),
  JWT_PRIVATE_KEY: z.string(),
  JWT_SECRET: z.string(),
  JWT_SECRET_ACCESS_TOKEN: z.string(),
  JWT_SECRET_REFRESH_TOKEN: z.string(),
  JWT_SECRET_EMAIL_VERIFY_TOKEN: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.string(),
  REFRESH_TOKEN_EXPIRES_IN: z.string(),
  EMAIL_VERIFY_TOKEN_EXPIRES_IN: z.string(),
  JWT_SECRET_FORGOT_PASSWORD_TOKEN: z.string(),
  GOOGLE_APP_PASSWORD: z.string(),
  GOOGLE_SENDER_EMAIL: z.string(),
  GOOGLE_HOST: z.string(),
  FRONT_END_URL: z.string(),
  GOOGLE_REDIRECT_URI: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  REDIS_USERNAME: z.string(),
  REDIS_PASSWORD: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string(),
  GOOGLE_PORT: z.string(),
  S3_BUCKET_NAME: z.string(),
  S3_REGION: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_ENDPOINT: z.string()
});

const configEnvSchema = envSchema.safeParse(process.env);

if (!configEnvSchema.success) {
  console.error("❌ Invalid environment variables:");
  console.error(configEnvSchema.error);
  throw new Error("Invalid environment variable declarations");
}

const envConfig = configEnvSchema.data;

export default envConfig;
