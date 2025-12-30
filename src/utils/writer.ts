import fs from "fs";
import path from "path";
import crypto from "crypto";
import prompts from "prompts";
import { logger } from "./logger";
import { Config, CONFIG_FILE_NAME } from "./config";
import { FetchedComponent } from "./fetcher";

/**
 * Calculate SHA-256 hash of a string
 */
function calculateHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Write components to disk and update config
 */
export async function writeComponents(
  components: FetchedComponent[],
  config: Config,
  options: { force?: boolean } = {}
) {
  const cwd = process.cwd();
  let hasUpdates = false;

  for (const component of components) {
    logger.step(`Installing ${component.type}/${component.name}...`);

    // Determine target directory based on config and component type
    // But wait, the component.files already have a 'target' path which is relative
    // e.g. "hooks/useLocalStorage.ts"
    // We need to map "hooks/" to config.paths.hooks

    const installedFiles: string[] = [];

    for (const file of component.fetchedFiles) {
      // Resolve absolute path
      // Logic:
      // if file.target starts with "hooks/", replace with config.paths.hooks
      // if file.target starts with "utils/", replace with config.paths.utils

      let targetDir = "";
      let fileName = "";

      if (file.target.startsWith("hooks/")) {
        targetDir = config.paths.hooks;
        fileName = file.target.replace("hooks/", "");
      } else if (file.target.startsWith("utils/")) {
        targetDir = config.paths.utils;
        fileName = file.target.replace("utils/", "");
      } else {
        // Fallback or error?
        logger.warn(`Unknown file target prefix: ${file.target}. Using default logic.`);
        targetDir = file.type === "hook" ? config.paths.hooks : config.paths.utils;
        fileName = path.basename(file.target);
      }

      const absolutePath = path.resolve(cwd, targetDir, fileName);
      const dirPath = path.dirname(absolutePath);

      // Ensure directory exists
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Check for existing file and conflict
      if (fs.existsSync(absolutePath)) {
        const existingContent = fs.readFileSync(absolutePath, "utf-8");
        // Simple content check, or hash check if we stored hashes (we don't store file-level hashes in config yet, only component level)
        // But we can check if content is identical

        if (existingContent === file.content) {
          logger.info(`  ${file.target} is up to date.`);
          continue;
        }

        if (!options.force) {
          const { action } = await prompts({
            type: "select",
            name: "action",
            message: `File ${file.target} already exists and is different.`,
            choices: [
              { title: "Overwrite", value: "overwrite" },
              { title: "Skip", value: "skip" },
              // { title: "Diff", value: "diff" }, // TODO: Implement Diff view
            ],
            initial: 0
          });

          if (action === "skip") {
            logger.info(`  Skipped ${file.target}`);
            continue;
          }
        }
      }

      // Write file
      fs.writeFileSync(absolutePath, file.content, "utf-8");
      logger.success(`  Written ${file.target}`);
      installedFiles.push(file.target);
    }

    // Update Config
    if (installedFiles.length > 0) {
      if (component.type === "hook") {
        if (!config.components.hooks) config.components.hooks = {};
        config.components.hooks[component.name] = {
          version: component.version,
          files: installedFiles,
          pulledAt: new Date().toISOString(),
        };
      } else {
        if (!config.components.utils) config.components.utils = {};
        config.components.utils[component.name] = {
          version: component.version,
          files: installedFiles,
          pulledAt: new Date().toISOString(),
        };
      }
      hasUpdates = true;
    }
  }

  // Write updated config to disk
  if (hasUpdates) {
    const configPath = path.resolve(cwd, CONFIG_FILE_NAME);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    logger.success(`Updated ${CONFIG_FILE_NAME}`);
  }

  return hasUpdates;
}
