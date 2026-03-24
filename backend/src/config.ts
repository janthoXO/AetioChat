import dotenv from "dotenv";
import z from "zod";

dotenv.config();

export const LLMProviderSchema = z.enum(["ollama", "google"]);

export type LLMProvider = z.infer<typeof LLMProviderSchema>;

const ConfigSchema = z.object({
  PORT: z.coerce.number().default(3031),
  DEBUG: z.coerce.boolean().default(false),

  LLM_API_KEY: z.string().optional(),
  LLM_PROVIDER: LLMProviderSchema.default("ollama"),
  LLM_MODEL: z.string().default("llama3.1"),

  GENERATOR_URL: z.string().default("http://localhost:3030/api"),

  DATABASE_URL: z
    .string()
    .default("postgresql://postgres:postgres@localhost:5432/aetio"),

  ADMIN_USERNAME: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),

  JWT_SECRET: z.string(),
});

export type Config = z.infer<typeof ConfigSchema>;

const parsed = ConfigSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(parsed.error, null, 2)
  );
  process.exit(1);
}
export const config = parsed.data;
