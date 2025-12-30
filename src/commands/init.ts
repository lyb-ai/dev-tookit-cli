import fs from "fs";
import path from "path";
import prompts from "prompts";
import { logger } from "../utils/logger";
import { CONFIG_FILE_NAME, detectPackageManager } from "../utils/config";

export async function init() {
  const cwd = process.cwd();
  const configPath = path.resolve(cwd, CONFIG_FILE_NAME);

  // Check if config already exists
  if (fs.existsSync(configPath)) {
    logger.warn(`${CONFIG_FILE_NAME} already exists.`);
    const { overwrite } = await prompts({
      type: "confirm",
      name: "overwrite",
      message: "Do you want to overwrite it?",
      initial: false,
    });

    if (!overwrite) {
      logger.info("Init cancelled.");
      return;
    }
  }

  const packageManager = await detectPackageManager();
  const isTs = fs.existsSync(path.resolve(cwd, "tsconfig.json"));

  // Interactive prompts
  const response = await prompts([
    {
      type: "toggle",
      name: "typescript",
      message: "Would you like to use TypeScript?",
      initial: isTs,
      active: "yes",
      inactive: "no",
    },
    {
      type: "text",
      name: "hooksDir",
      message: "Where would you like to place your hooks?",
      initial: isTs ? "src/hooks" : "hooks",
    },
    {
      type: "text",
      name: "utilsDir",
      message: "Where would you like to place your utils?",
      initial: isTs ? "src/lib/utils" : "utils",
    },
    {
      type: "text",
      name: "hooksAlias",
      message: "Configure the import alias for hooks:",
      initial: "@/hooks",
    },
    {
      type: "text",
      name: "utilsAlias",
      message: "Configure the import alias for utils:",
      initial: "@/lib/utils",
    },
  ]);

  if (!response.typescript && !response.hooksDir) {
    logger.info("Init cancelled.");
    return;
  }

  // Create config content
  const config = {
    typescript: response.typescript,
    registryUrl:
      "https://lyb-ai.github.io/dev-tookit-registry",
    aliases: {
      utils: response.utilsAlias,
      hooks: response.hooksAlias,
    },
    paths: {
      hooks: response.hooksDir,
      utils: response.utilsDir,
    },
    components: {
      hooks: {},
      utils: {},
    },
  };

  // Write config file
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    logger.success(`${CONFIG_FILE_NAME} created successfully!`);

    // Hint for next steps
    console.log("");
    logger.info("Next steps:");
    logger.step(`Run ${packageManager} install`);
    logger.step(`Try adding a hook: npx dev-tookit add hook useLocalStorage`);
  } catch (error) {
    logger.error("Failed to write config file.");
    if (error instanceof Error) {
      logger.error(error);
    }
  }
}
