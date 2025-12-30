import { z } from "zod";

// Registry Schema
export const RegistryIndexSchema = z.object({
  $schema: z.string().optional(),
  hooks: z.record(
    z.string(),
    z.object({
      name: z.string(),
      description: z.string(),
      category: z.string().optional(),
      files: z.array(
        z.object({
          type: z.enum(["hook", "util"]),
          path: z.string(),
          target: z.string(),
        })
      ),
      dependencies: z.array(z.string()).default([]),
      internalDependencies: z.array(z.string()).default([]),
      version: z.string(),
    })
  ),
  utils: z.record(
    z.string(),
    z.object({
      name: z.string(),
      description: z.string(),
      files: z.array(
        z.object({
          type: z.enum(["hook", "util"]),
          path: z.string(),
          target: z.string(),
        })
      ),
      dependencies: z.array(z.string()).default([]),
      version: z.string(),
    })
  ),
});

export type RegistryIndex = z.infer<typeof RegistryIndexSchema>;

// Mock Registry Data for testing (until remote registry is ready)
export const MOCK_REGISTRY_INDEX: RegistryIndex = {
  hooks: {
    useLocalStorage: {
      name: "useLocalStorage",
      description: "Persist state to localStorage with serialization support",
      category: "State",
      files: [
        {
          type: "hook",
          path: "registry/hooks/useLocalStorage.ts",
          target: "hooks/useLocalStorage.ts",
        },
      ],
      dependencies: [],
      internalDependencies: ["utils/isBrowser"],
      version: "1.0.0",
    },
    useDebounce: {
      name: "useDebounce",
      description: "Debounce a value",
      category: "State",
      files: [
        {
          type: "hook",
          path: "registry/hooks/useDebounce.ts",
          target: "hooks/useDebounce.ts",
        },
      ],
      dependencies: [],
      internalDependencies: [],
      version: "1.0.0",
    },
  },
  utils: {
    isBrowser: {
      name: "isBrowser",
      description: "Check if code is running in browser",
      files: [
        {
          type: "util",
          path: "registry/utils/isBrowser.ts",
          target: "utils/isBrowser.ts",
        },
      ],
      dependencies: [],
      version: "1.0.0",
    },
    formatDate: {
      name: "formatDate",
      description: "Format date using Intl.DateTimeFormat",
      files: [
        {
          type: "util",
          path: "registry/utils/formatDate.ts",
          target: "utils/formatDate.ts",
        },
      ],
      dependencies: [],
      version: "1.0.0",
    },
  },
};
