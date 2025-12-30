import { logger } from "./logger";

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

const DEFAULT_TIMEOUT = 10000;
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY = 1000;

/**
 * Fetch with timeout and retry mechanism
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    ...fetchOptions
  } = options;

  let attempt = 0;

  while (attempt <= retries) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(id);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error: any) {
      clearTimeout(id);
      attempt++;

      const isLastAttempt = attempt > retries;
      const isAbortError = error.name === "AbortError";
      const errorMessage = isAbortError
        ? `Request timeout after ${timeout}ms`
        : error.message;

      if (isLastAttempt) {
        throw new Error(
          `Failed to fetch ${url} after ${attempt} attempts: ${errorMessage}`
        );
      }

      logger.warn(
        `Request failed (${errorMessage}). Retrying in ${retryDelay}ms... (${attempt}/${retries})`
      );

      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // This should never be reached due to the throw in the loop
  throw new Error("Unexpected error in fetchWithRetry");
}
