import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { NoticeController } from './notice.controller';
import { NoticeService } from './notice.service';
import { NoticeGroupingService } from './domain/services/notice-grouping.service';
import { NoticePaginationService } from './domain/services/notice-pagination.service';
import { NoticeCollectorService } from './application/services/notice-collector.service';
import { GetNoticesUseCase } from './application/use-cases/get-notices.use-case';
import { GetNoticeGroupUseCase } from './application/use-cases/get-notice-group.use-case';
import { GetNoticeDetailUseCase } from './application/use-cases/get-notice-detail.use-case';
import { UpdateNoticeCacheUseCase } from './application/use-cases/update-notice-cache.use-case';
import { InitializeNoticeCacheUseCase } from './application/use-cases/initialize-notice-cache.use-case';
import { RedisNoticeCacheRepository } from './infrastructure/persistence/redis-notice-cache.repository';
import { HanbatNoticeSourceGateway } from './infrastructure/gateways/hanbat-notice-source.gateway';
import { NoticeHtmlParserService } from './infrastructure/services/notice-html-parser.service';
import { NOTICE_CACHE_REPOSITORY } from './application/ports/notice-cache.repository';
import { NOTICE_SOURCE_GATEWAY } from './application/ports/notice-source.gateway';

@Module({
  imports: [RedisModule],
  controllers: [NoticeController],
  providers: [
    NoticeService,
    NoticeGroupingService,
    NoticePaginationService,
    NoticeCollectorService,
    GetNoticesUseCase,
    GetNoticeGroupUseCase,
    GetNoticeDetailUseCase,
    UpdateNoticeCacheUseCase,
    InitializeNoticeCacheUseCase,
    RedisNoticeCacheRepository,
    HanbatNoticeSourceGateway,
    NoticeHtmlParserService,
    {
      provide: NOTICE_CACHE_REPOSITORY,
      useExisting: RedisNoticeCacheRepository,
    },
    {
      provide: NOTICE_SOURCE_GATEWAY,
      useExisting: HanbatNoticeSourceGateway,
    },
  ],
  exports: [NoticeService],
})
export class NoticeModule {}
