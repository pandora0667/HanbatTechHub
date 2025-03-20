import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
  private readonly redis: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB'),
    });
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
      const pattern = `${serviceName}:*`;
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
}
