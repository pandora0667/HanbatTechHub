import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  JOB_POSTING_CACHE_REPOSITORY,
  JobPostingCacheRepository,
} from '../ports/job-posting-cache.repository';
import { JobPostingCollectorService } from '../services/job-posting-collector.service';
import { JobPosting } from '../../interfaces/job-posting.interface';

@Injectable()
export class SyncJobCacheUseCase {
  private readonly logger = new Logger(SyncJobCacheUseCase.name);

  constructor(
    @Inject(JOB_POSTING_CACHE_REPOSITORY)
    private readonly jobPostingCacheRepository: JobPostingCacheRepository,
    private readonly jobPostingCollectorService: JobPostingCollectorService,
  ) {}

  async execute(at: Date = new Date()): Promise<void> {
    const results = await this.jobPostingCollectorService.fetchJobsByCompany({
      continueOnError: true,
      coolDownBetweenRuns: true,
    });

    const allJobs: JobPosting[] = [];

    for (const result of results) {
      await this.jobPostingCacheRepository.setCompanyJobs(
        result.company,
        result.jobs,
      );
      allJobs.push(...result.jobs);
      this.logger.log(`Updated ${result.jobs.length} jobs for ${result.company}`);
    }

    await this.jobPostingCacheRepository.setAllJobs(allJobs);
    await this.jobPostingCacheRepository.setLastUpdate(at.toISOString());
  }
}
