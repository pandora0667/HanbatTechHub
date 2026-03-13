import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { globalAgent as httpGlobalAgent } from 'http';
import { globalAgent as httpsGlobalAgent } from 'https';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { RedisService } from '../src/modules/redis/redis.service';

class InMemoryRedisService {
  private readonly store = new Map<string, string>();

  async get<T>(key: string): Promise<T | null> {
    const value = this.store.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.store.set(key, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async flushAll(): Promise<void> {
    this.store.clear();
  }

  async flushByPattern(pattern: string): Promise<void> {
    const prefix = pattern.replace(/\*$/, '');
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  async initializeServiceCache(serviceName: string): Promise<void> {
    const pattern = serviceName.endsWith(':*')
      ? serviceName
      : `${serviceName}:*`;
    await this.flushByPattern(pattern);
  }
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const previousBackgroundSync = process.env.ENABLE_BACKGROUND_SYNC;

  jest.setTimeout(60000);

  beforeAll(async () => {
    process.env.ENABLE_BACKGROUND_SYNC = 'false';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RedisService)
      .useValue(new InMemoryRedisService())
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      }),
    );
    app.setGlobalPrefix('api/v1', {
      exclude: ['/health'],
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    httpGlobalAgent.destroy();
    httpsGlobalAgent.destroy();

    if (previousBackgroundSync === undefined) {
      delete process.env.ENABLE_BACKGROUND_SYNC;
      return;
    }

    process.env.ENABLE_BACKGROUND_SYNC = previousBackgroundSync;
  });

  it('/api/v1 (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect('Hello World!');
  });

  it('/api/v1/sources (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/sources?context=opportunity')
      .expect(200);

    expect(Array.isArray(response.body.sources)).toBe(true);
    expect(response.body.sources.length).toBeGreaterThan(0);
    expect(
      response.body.sources.every(
        (source: { context: string }) => source.context === 'opportunity',
      ),
    ).toBe(true);
  });

  it('/api/v1/signals/freshness (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/signals/freshness')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        summary: expect.objectContaining({
          total: expect.any(Number),
        }),
        signals: expect.any(Array),
      }),
    );
  });
});
