import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
