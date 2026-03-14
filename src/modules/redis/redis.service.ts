import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Redis, RedisOptions } from 'ioredis';
import { ConfigService } from '@nestjs/config';

export function buildRedisOptions(
  configService: ConfigService,
): RedisOptions {
  return {
    host: configService.get<string>('REDIS_HOST'),
    port: configService.get<number>('REDIS_PORT'),
    password: configService.get<string>('REDIS_PASSWORD'),
    db: configService.get<number>('REDIS_DB'),
    connectTimeout: 10_000,
    keepAlive: 10_000,
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 500, 5_000),
  };
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis(buildRedisOptions(this.configService));
    this.registerEventHandlers();
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
    } else {
      await this.redis.set(key, JSON.stringify(value));
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async flushAll(): Promise<void> {
    await this.redis.flushall();
  }

  /**
   * 특정 패턴의 키들만 초기화
   * @param pattern Redis 키 패턴 (예: 'jobs:*')
   */
  async flushByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.log(
          `Cleared ${keys.length} keys matching pattern: ${pattern}`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to flush keys by pattern ${pattern}:`, error);
      throw error;
    }
  }

  /**
   * 서비스 시작 시 캐시 초기화
   * @param serviceName 서비스 이름 (예: 'jobs', 'notices')
   */
  async initializeServiceCache(serviceName: string): Promise<void> {
    try {
      const pattern = serviceName.endsWith(':*')
        ? serviceName
        : `${serviceName}:*`;
      await this.flushByPattern(pattern);
      this.logger.log(`Initialized cache for service: ${serviceName}`);
    } catch (error) {
      this.logger.error(
        `Failed to initialize cache for service ${serviceName}:`,
        error,
      );
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (error) {
      this.logger.warn(
        `Failed to quit Redis cleanly, disconnecting instead: ${error.message}`,
      );
      this.redis.disconnect();
    }
  }

  private registerEventHandlers(): void {
    this.redis.on('connect', () => {
      this.logger.log('Redis TCP connection established.');
    });

    this.redis.on('ready', () => {
      this.logger.log('Redis client is ready.');
    });

    this.redis.on('reconnecting', (delay: number) => {
      this.logger.warn(`Redis reconnecting in ${delay}ms.`);
    });

    this.redis.on('error', (error) => {
      this.logger.warn(`Redis connection error: ${error.message}`);
    });
  }
}
