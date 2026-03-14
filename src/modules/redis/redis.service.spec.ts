import { ConfigService } from '@nestjs/config';
import { buildRedisOptions } from './redis.service';

describe('buildRedisOptions', () => {
  it('configures resilient retry behavior for long-lived Redis connections', () => {
    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string | number> = {
          REDIS_HOST: '127.0.0.1',
          REDIS_PORT: 6379,
          REDIS_PASSWORD: 'devpassword',
          REDIS_DB: 0,
        };

        return values[key];
      }),
    } as unknown as ConfigService;

    const options = buildRedisOptions(configService);

    expect(options.host).toBe('127.0.0.1');
    expect(options.port).toBe(6379);
    expect(options.password).toBe('devpassword');
    expect(options.db).toBe(0);
    expect(options.connectTimeout).toBe(10_000);
    expect(options.keepAlive).toBe(10_000);
    expect(options.maxRetriesPerRequest).toBeNull();
    expect(options.retryStrategy?.(1)).toBe(500);
    expect(options.retryStrategy?.(20)).toBe(5_000);
  });
});
