import { RegistryIndex } from "./registry";
import { logger } from "./logger";

export interface Component {
  name: string;
  type: "hook" | "util";
  version: string;
  files: {
    type: "hook" | "util";
    path: string;
    target: string;
  }[];
  dependencies: string[]; // NPM dependencies
  internalDependencies: string[]; // Internal component dependencies (e.g. "utils/isBrowser")
}

export interface ResolvedComponent extends Component {
  // Can add resolved path or other info here if needed
}

/**
 * Resolve component and its dependencies recursively
 */
export async function resolveComponent(
  name: string,
  type: "hook" | "util",
  registryIndex: RegistryIndex
): Promise<ResolvedComponent[]> {
  const resolved = new Map<string, ResolvedComponent>();
  const queue = [{ name, type }];

  while (queue.length > 0) {
    const { name, type } = queue.shift()!;
    const key = `${type}/${name}`;

    if (resolved.has(key)) {
      continue;
    }

    const collection =
      type === "hook" ? registryIndex.hooks : registryIndex.utils;
    // @ts-ignore - dynamic access
    const component = collection[name];

    if (!component) {
      throw new Error(`Component "${type}/${name}" not found in registry.`);
    }

    // Normalize component structure to match interface
    const normalizedComponent: ResolvedComponent = {
        name: component.name,
        type: type,
        version: component.version,
        files: component.files,
        dependencies: component.dependencies,
        internalDependencies: (component as any).internalDependencies || []
    }

    resolved.set(key, normalizedComponent);

    // Add internal dependencies to queue
    if (normalizedComponent.internalDependencies && normalizedComponent.internalDependencies.length > 0) {
      for (const dep of normalizedComponent.internalDependencies) {
        let [depType, depName] = dep.split("/");
        if (!depType || !depName) {
            logger.warn(`Invalid dependency format: ${dep}. Expected "type/name".`);
            continue;
        }
        
        // Normalize type (plural to singular)
        if (depType === "hooks") depType = "hook";
        if (depType === "utils") depType = "util";
        
        if (depType !== "hook" && depType !== "util") {
             logger.warn(`Invalid dependency type: ${depType}. Must be "hook" or "util".`);
             continue;
        }

        queue.push({ name: depName, type: depType as "hook" | "util" });
      }
    }
  }

  // Return values in the order they were resolved (BFS), but reversed so dependencies come first? 
  // Actually BFS order is fine for installation, but usually we want leaves first if we care about build order.
  // For file writing, order doesn't matter much unless we want to log nicely.
  return Array.from(resolved.values());
}
