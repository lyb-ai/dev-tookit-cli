import fs from "fs";
import path from "path";
import { z } from "zod";
import { logger } from "./logger";

export const CONFIG_FILE_NAME = "codegen.config.json";

// Schema Definition
export const ConfigSchema = z.object({
  $schema: z.string().optional(),
  typescript: z.boolean().default(true),
  registryUrl: z
    .string()
    .default(
      "https://lyb-ai.github.io/dev-tookit-registry"
    ),
  aliases: z.object({
    utils: z.string(),
    hooks: z.string(),
  }),
  paths: z.object({
    hooks: z.string(),
    utils: z.string(),
  }),
  components: z
    .object({
      hooks: z.record(
        z.string(),
        z.object({
          version: z.string(),
          files: z.array(z.string()),
          pulledAt: z.string(),
        })
      ).optional(),
      utils: z.record(
        z.string(),
        z.object({
          version: z.string(),
          files: z.array(z.string()),
          pulledAt: z.string(),
        })
      ).optional(),
    })
    .default({}),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Detect package manager (pnpm, yarn, npm, bun)
 */
export async function detectPackageManager(): Promise<
  "pnpm" | "yarn" | "npm" | "bun"
> {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(cwd, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(cwd, "bun.lockb"))) return "bun";
  return "npm";
}

/**
 * Find and read configuration file
 */
export async function getConfig(): Promise<Config | null> {
  try {
    const configPath = path.resolve(process.cwd(), CONFIG_FILE_NAME);

    if (!fs.existsSync(configPath)) {
      return null;
    }

    const content = fs.readFileSync(configPath, "utf-8");
    const rawConfig = JSON.parse(content);

    const result = ConfigSchema.safeParse(rawConfig);

    if (!result.success) {
      logger.error("Invalid configuration file:");
      result.error.issues.forEach((issue) => {
        logger.error(` - ${issue.path.join(".")}: ${issue.message}`);
      });
      throw new Error("Configuration validation failed");
    }

    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to read config: ${error.message}`);
    }
    return null;
  }
}
