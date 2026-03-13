import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { globalAgent as httpGlobalAgent } from 'http';
import { globalAgent as httpsGlobalAgent } from 'https';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const previousBackgroundSync = process.env.ENABLE_BACKGROUND_SYNC;

  jest.setTimeout(60000);

  beforeAll(async () => {
    process.env.ENABLE_BACKGROUND_SYNC = 'false';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
});
