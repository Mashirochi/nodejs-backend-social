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
  GOOGLE_PORT: z.string().transform((val) => {
    const num = parseInt(val);
    if (isNaN(num)) {
      throw new Error("GOOGLE_PORT must be a valid number");
    }
    return num;
  })
});

const configEnvSchema = envSchema.safeParse(process.env);

if (!configEnvSchema.success) {
  console.error("❌ Invalid environment variables:");
  console.error(configEnvSchema.error);
  throw new Error("Invalid environment variable declarations");
}

const envConfig = configEnvSchema.data;

export default envConfig;
