import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { logger } from "./logger";
import { detectPackageManager } from "./config";

export async function checkAndInstallDependencies(
  dependencies: string[],
  options: { silent?: boolean } = {}
) {
  if (dependencies.length === 0) return;

  const cwd = process.cwd();
  const packageJsonPath = path.resolve(cwd, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    logger.warn("package.json not found. Skipping dependency check.");
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const installedDependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  const missingDependencies = dependencies.filter(
    (dep) => !installedDependencies[dep]
  );

  if (missingDependencies.length === 0) {
    if (!options.silent) {
        logger.success("All dependencies are already installed.");
    }
    return;
  }

  logger.warn(
    `Missing dependencies: ${missingDependencies.join(", ")}`
  );

  const packageManager = await detectPackageManager();
  const installCmd =
    packageManager === "npm"
      ? "npm install"
      : packageManager === "yarn"
      ? "yarn add"
      : packageManager === "bun"
      ? "bun add"
      : "pnpm add";

  logger.info(`Installing dependencies with ${packageManager}...`);
  
  try {
    execSync(`${installCmd} ${missingDependencies.join(" ")}`, {
      stdio: "inherit",
      cwd,
    });
    logger.success("Dependencies installed successfully.");
  } catch (error) {
    logger.error("Failed to install dependencies.");
    // Don't throw, just warn. User can install manually.
  }
}
