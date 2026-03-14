import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './services/jobs.service';
import { CRAWLER_PROVIDERS } from './crawlers';
import { HttpClientUtil } from './utils/http-client.util';
import { JobPostingSearchService } from './domain/services/job-posting-search.service';
import { JobPostingChangeDetectorService } from './domain/services/job-posting-change-detector.service';
import { JobMarketHistoryBuilderService } from './domain/services/job-market-history-builder.service';
import { JobCrawlerExecutionService } from './application/services/job-crawler-execution.service';
import { JobPostingCollectorService } from './application/services/job-posting-collector.service';
import { JobPostingSnapshotReaderService } from './application/services/job-posting-snapshot-reader.service';
import { GetCompanyJobsUseCase } from './application/use-cases/get-company-jobs.use-case';
import { GetSupportedCompaniesUseCase } from './application/use-cases/get-supported-companies.use-case';
import { GetTechJobsUseCase } from './application/use-cases/get-tech-jobs.use-case';
import { SyncJobCacheUseCase } from './application/use-cases/sync-job-cache.use-case';
import { InitializeJobsCacheUseCase } from './application/use-cases/initialize-jobs-cache.use-case';
import { JobPostingResponseMapper } from './presentation/mappers/job-posting-response.mapper';
import { JobCrawlerRegistryService } from './infrastructure/services/job-crawler-registry.service';
import { RedisJobPostingCacheRepository } from './infrastructure/persistence/redis-job-posting-cache.repository';
import { JOB_CRAWLER_REGISTRY } from './application/ports/job-crawler-registry';
import { JOB_POSTING_CACHE_REPOSITORY } from './application/ports/job-posting-cache.repository';

@Module({
  imports: [RedisModule],
  controllers: [JobsController],
  providers: [
    JobsService,
    HttpClientUtil,
    JobPostingSearchService,
    JobPostingChangeDetectorService,
    JobMarketHistoryBuilderService,
    JobCrawlerExecutionService,
    JobPostingCollectorService,
    JobPostingSnapshotReaderService,
    GetCompanyJobsUseCase,
    GetSupportedCompaniesUseCase,
    GetTechJobsUseCase,
    SyncJobCacheUseCase,
    InitializeJobsCacheUseCase,
    JobPostingResponseMapper,
    JobCrawlerRegistryService,
    RedisJobPostingCacheRepository,
    {
      provide: JOB_CRAWLER_REGISTRY,
      useExisting: JobCrawlerRegistryService,
    },
    {
      provide: JOB_POSTING_CACHE_REPOSITORY,
      useExisting: RedisJobPostingCacheRepository,
    },
    ...CRAWLER_PROVIDERS,
  ],
  exports: [
    JobsService,
    JobPostingSearchService,
    JobPostingSnapshotReaderService,
    JobMarketHistoryBuilderService,
    JOB_POSTING_CACHE_REPOSITORY,
  ],
})
export class JobsModule {}
