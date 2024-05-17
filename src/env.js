import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    MAIN_ADMIN_ID: z.string(),
    TELEGRAM_TOKEN: z.string(),
    WEBAPP_URL: z.string().url()
  },
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
    MAIN_ADMIN_ID: process.env.MAIN_ADMIN_ID,
    WEBAPP_URL: process.env.WEBAPP_URL
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
