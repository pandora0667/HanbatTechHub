import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from '../redis/redis.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './services/jobs.service';
import { CRAWLER_PROVIDERS } from './crawlers';
import { HttpClientUtil } from './utils/http-client.util';
import { BrowserService } from './services/browser.service';

@Module({
  imports: [RedisModule, ScheduleModule.forRoot()],
  controllers: [JobsController],
  providers: [JobsService, HttpClientUtil, BrowserService, ...CRAWLER_PROVIDERS],
  exports: [JobsService],
})
export class JobsModule {}
