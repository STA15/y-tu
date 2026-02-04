/**
 * Retry utility with exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'retryableErrors'>> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Check if error is retryable (network errors, 5xx errors, rate limits)
 */
const isRetryableError = (error: any): boolean => {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true;
  }

  // HTTP errors
  if (error.response) {
    const status = error.response.status;
    // Retry on 5xx errors and 429 (rate limit)
    return status >= 500 || status === 429;
  }

  // Timeout errors
  if (error.message && error.message.includes('timeout')) {
    return true;
  }

  return false;
};

/**
 * Retry a function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxRetries,
    initialDelay,
    maxDelay,
    backoffMultiplier,
    retryableErrors = isRetryableError
  } = {
    ...DEFAULT_OPTIONS,
    ...options
  };

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === maxRetries || !retryableErrors(error)) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      await sleep(Math.min(delay, maxDelay));
      delay *= backoffMultiplier;
    }
  }

  throw lastError;
};
