import { z } from "zod";

/**
 * Environment configuration for the platform.
 *
 * Only non-secret runtime configuration is parsed here. Execution-plane secrets
 * (sandbox tokens, model API keys) are NOT loaded into the control-plane process;
 * they are injected directly into the execution plane (docs/03 §21, docs/07 §28).
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  ARTIFACTS_DIR: z.string().min(1).default(".artifacts"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(source);
}
