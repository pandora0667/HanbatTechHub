import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  JOB_POSTING_CACHE_REPOSITORY,
  JobPostingCacheEntry,
  JobPostingCacheRepository,
} from '../ports/job-posting-cache.repository';
import { JobPostingCollectorService } from '../services/job-posting-collector.service';
import { JobPosting } from '../../interfaces/job-posting.interface';
import { buildSnapshotMetadata } from '../../../../common/utils/snapshot.util';
import { JOBS_CACHE_TTL } from '../../constants/redis.constant';
import { getJobSourceDescriptor } from '../../constants/job-source.constant';

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
      const source = getJobSourceDescriptor(result.company);
      const entry: JobPostingCacheEntry = {
        jobs: result.jobs,
        snapshot: buildSnapshotMetadata({
          collectedAt: at,
          ttlSeconds: JOBS_CACHE_TTL,
          confidence: source.confidence,
          sourceIds: [source.id],
        }),
      };

      await this.jobPostingCacheRepository.setCompanyJobs(
        result.company,
        entry,
      );
      allJobs.push(...result.jobs);
      this.logger.log(`Updated ${result.jobs.length} jobs for ${result.company}`);
    }

    await this.jobPostingCacheRepository.setAllJobs({
      jobs: allJobs,
      snapshot: buildSnapshotMetadata({
        collectedAt: at,
        ttlSeconds: JOBS_CACHE_TTL,
        confidence: 0.75,
        sourceIds: results.map(({ company }) => getJobSourceDescriptor(company).id),
      }),
    });
    await this.jobPostingCacheRepository.setLastUpdate(at.toISOString());
  }
}
