import pc from "picocolors";
import { logger } from "../utils/logger";
import { getConfig } from "../utils/config";
import { fetchWithRetry } from "../utils/network";
import {
  MOCK_REGISTRY_INDEX,
  RegistryIndexSchema,
  type RegistryIndex,
} from "../utils/registry";

export async function list() {
  try {
    const config = await getConfig();
    let registryIndex: RegistryIndex;

    if (!config) {
      logger.warn(
        "Config file not found. Using default registry to list available components."
      );
      // In a real scenario, we might want to fetch from default URL
      // For now, we use mock data if config is missing, or fetch from default URL
      registryIndex = MOCK_REGISTRY_INDEX;
    } else {
      logger.step("Fetching registry...");
      try {
        const response = await fetchWithRetry(
          `${config.registryUrl}/index.json`
        );
        const data = await response.json();
        const result = RegistryIndexSchema.safeParse(data);

        if (!result.success) {
          logger.warn("Remote registry is invalid. Using cached/mock data.");
           // Fallback to mock data for now, since remote doesn't exist yet
          registryIndex = MOCK_REGISTRY_INDEX;
        } else {
          registryIndex = result.data;
        }
      } catch (error) {
        logger.warn(
          "Failed to fetch registry. Using cached/mock data for demonstration."
        );
        registryIndex = MOCK_REGISTRY_INDEX;
      }
    }

    // Display Hooks
    console.log("");
    logger.info(pc.bold("Available Hooks:"));
    Object.values(registryIndex.hooks).forEach((hook) => {
      const isInstalled = config?.components?.hooks?.[hook.name];
      const status = isInstalled
        ? pc.green(`(installed v${isInstalled.version})`)
        : pc.dim("(not installed)");
      
      console.log(`  ${pc.cyan(hook.name)} ${status}`);
      console.log(`    ${pc.dim(hook.description)}`);
    });

    // Display Utils
    console.log("");
    logger.info(pc.bold("Available Utils:"));
    Object.values(registryIndex.utils).forEach((util) => {
      const isInstalled = config?.components?.utils?.[util.name];
      const status = isInstalled
        ? pc.green(`(installed v${isInstalled.version})`)
        : pc.dim("(not installed)");

      console.log(`  ${pc.cyan(util.name)} ${status}`);
      console.log(`    ${pc.dim(util.description)}`);
    });
    
    console.log("");

  } catch (error) {
    logger.error("Failed to list components.");
    if (error instanceof Error) {
      logger.error(error);
    }
  }
}
