import { Injectable } from '@nestjs/common';
import { appendRedisKey } from '../../../../common/utils/redis-key.util';
import { RedisService } from '../../../redis/redis.service';
import { SourceRuntimeRecord } from '../../types/source-runtime.type';

const SOURCE_RUNTIME_KEY_PREFIX = 'hbnu:source:runtime:';
const SOURCE_RUNTIME_TTL = 180 * 24 * 60 * 60;

@Injectable()
export class SourceRuntimeRecorderService {
  constructor(private readonly redisService: RedisService) {}

  async getRuntimeRecord(sourceId: string): Promise<SourceRuntimeRecord | null> {
    return this.redisService.get<SourceRuntimeRecord>(
      appendRedisKey(SOURCE_RUNTIME_KEY_PREFIX, sourceId),
    );
  }

  async recordSuccess(sourceId: string, at: Date = new Date()): Promise<void> {
    const current = (await this.getRuntimeRecord(sourceId)) ?? {
      failureCount: 0,
      consecutiveFailures: 0,
    };

    await this.redisService.set(
      appendRedisKey(SOURCE_RUNTIME_KEY_PREFIX, sourceId),
      {
        ...current,
        lastSuccessAt: at.toISOString(),
        consecutiveFailures: 0,
        lastErrorMessage: undefined,
      },
      SOURCE_RUNTIME_TTL,
    );
  }

  async recordFailure(
    sourceId: string,
    errorMessage: string,
    at: Date = new Date(),
  ): Promise<void> {
    const current = (await this.getRuntimeRecord(sourceId)) ?? {
      failureCount: 0,
      consecutiveFailures: 0,
    };

    await this.redisService.set(
      appendRedisKey(SOURCE_RUNTIME_KEY_PREFIX, sourceId),
      {
        ...current,
        lastFailureAt: at.toISOString(),
        failureCount: current.failureCount + 1,
        consecutiveFailures: current.consecutiveFailures + 1,
        lastErrorMessage: errorMessage,
      },
      SOURCE_RUNTIME_TTL,
    );
  }
}
