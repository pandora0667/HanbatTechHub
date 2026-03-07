import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  JOB_POSTING_CACHE_REPOSITORY,
  JobPostingCacheRepository,
} from '../ports/job-posting-cache.repository';
import { SyncJobCacheUseCase } from './sync-job-cache.use-case';

@Injectable()
export class InitializeJobsCacheUseCase {
  private readonly logger = new Logger(InitializeJobsCacheUseCase.name);

  constructor(
    @Inject(JOB_POSTING_CACHE_REPOSITORY)
    private readonly jobPostingCacheRepository: JobPostingCacheRepository,
    private readonly syncJobCacheUseCase: SyncJobCacheUseCase,
  ) {}

  async execute(): Promise<void> {
    await this.jobPostingCacheRepository.initializeJobsCache();
    this.logger.log('Jobs cache initialized');

    await this.syncJobCacheUseCase.execute();
    this.logger.log('Initial job data loaded');
  }
}
