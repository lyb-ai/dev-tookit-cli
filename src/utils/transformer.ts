import { Config } from "./config";
import { FetchedComponent } from "./fetcher";

/**
 * Transform source code to match user's project structure
 */
export async function transformCode(
  components: FetchedComponent[],
  config: Config
): Promise<FetchedComponent[]> {
  return components.map((component) => {
    const transformedFiles = component.fetchedFiles.map((file) => {
      let content = file.content;

      // Replace imports for hooks
      // e.g. import { useDebounce } from "@/hooks/useDebounce" -> import { useDebounce } from "@/lib/hooks/useDebounce"
      // or import { useDebounce } from "registry/hooks/useDebounce"
      // We assume registry code uses a standard alias or relative paths that we need to replace
      
      // Pattern 1: Replace internal registry aliases if any
      // For simplicity, let's assume registry code might use standard imports like:
      // import { isBrowser } from "@/utils/isBrowser"
      
      // We need to replace the alias prefix based on user config
      // But wait, the registry code might be written with a specific alias in mind.
      // A common strategy is that registry code uses a placeholder or standard alias.
      
      // Strategy:
      // 1. Replace "@/utils/" with user's utils alias + "/"
      // 2. Replace "@/hooks/" with user's hooks alias + "/"
      
      // Note: This is a simple regex replacement. AST based would be safer but heavier.
      
      if (config.aliases.utils) {
        content = content.replace(
          /@\/utils\//g,
          `${config.aliases.utils}/`
        );
      }
      
      if (config.aliases.hooks) {
        content = content.replace(
          /@\/hooks\//g,
          `${config.aliases.hooks}/`
        );
      }

      // Handle "registry/" imports if we decide to use that convention in source
      // e.g. import ... from "registry/utils/isBrowser"
      content = content.replace(
        /registry\/utils\//g,
        `${config.aliases.utils}/`
      );
      content = content.replace(
        /registry\/hooks\//g,
        `${config.aliases.hooks}/`
      );

      return {
        ...file,
        content,
      };
    });

    return {
      ...component,
      fetchedFiles: transformedFiles,
    };
  });
}
