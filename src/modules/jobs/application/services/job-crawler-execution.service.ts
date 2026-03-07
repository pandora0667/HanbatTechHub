import { Injectable, Logger } from '@nestjs/common';
import { JOB_CRAWLING_CONFIG } from '../../constants/redis.constant';

@Injectable()
export class JobCrawlerExecutionService {
  private readonly logger = new Logger(JobCrawlerExecutionService.name);

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    config = JOB_CRAWLING_CONFIG,
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = config.INITIAL_DELAY;

    for (let attempt = 1; attempt <= config.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.toError(error);

        if (attempt === config.MAX_RETRIES) {
          this.logger.error(
            `Failed after ${config.MAX_RETRIES} attempts: ${context}. Error: ${lastError.message}`,
          );
          break;
        }

        const jitter = Math.floor(Math.random() * config.JITTER);
        const retryDelay = delay + jitter;

        this.logger.warn(
          `Attempt ${attempt} failed: ${context}. Retrying in ${retryDelay}ms. Error: ${lastError.message}`,
        );

        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        delay *= config.BACKOFF_FACTOR;
      }
    }

    throw lastError ?? new Error(`Unknown crawler execution failure: ${context}`);
  }

  private toError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    return new Error(String(error));
  }
}
