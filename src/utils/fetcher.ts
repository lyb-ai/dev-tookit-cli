import { fetchWithRetry } from "./network";
import { logger } from "./logger";
import { ResolvedComponent } from "./resolver";

export interface FetchedFile {
  type: "hook" | "util";
  path: string;
  target: string;
  content: string;
}

export interface FetchedComponent extends ResolvedComponent {
  fetchedFiles: FetchedFile[];
}

/**
 * Fetch source code for resolved components
 */
export async function fetchComponentSource(
  registryUrl: string,
  components: ResolvedComponent[]
): Promise<FetchedComponent[]> {
  const fetchedComponents: FetchedComponent[] = [];

  for (const component of components) {
    const fetchedFiles: FetchedFile[] = [];

    // Parallel fetch for all files in a component
    await Promise.all(
      component.files.map(async (file) => {
        const fileUrl = `${registryUrl}/${file.path}`;
        try {
          const response = await fetchWithRetry(fileUrl);
          const content = await response.text();
          
          fetchedFiles.push({
            type: file.type,
            path: file.path,
            target: file.target,
            content,
          });
        } catch (error) {
          throw new Error(
            `Failed to fetch source for ${component.name} (${file.path}): ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      })
    );

    fetchedComponents.push({
      ...component,
      fetchedFiles,
    });
  }

  return fetchedComponents;
}
