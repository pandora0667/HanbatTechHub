import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  JOB_POSTING_CACHE_REPOSITORY,
  JobPostingCacheEntry,
  JobPostingCacheRepository,
} from '../ports/job-posting-cache.repository';
import { JobPostingCollectorService } from '../services/job-posting-collector.service';
import { JobPosting } from '../../interfaces/job-posting.interface';
import {
  buildSnapshotMetadata,
  mergeSnapshotMetadata,
} from '../../../../common/utils/snapshot.util';
import { JOBS_FRESHNESS_TTL } from '../../constants/redis.constant';
import {
  getJobSourceDescriptor,
  JOB_SOURCE_COMPANIES,
} from '../../constants/job-source.constant';
import { JobPostingChangeDetectorService } from '../../domain/services/job-posting-change-detector.service';
import { JobMarketHistoryBuilderService } from '../../domain/services/job-market-history-builder.service';

@Injectable()
export class SyncJobCacheUseCase {
  private readonly logger = new Logger(SyncJobCacheUseCase.name);

  constructor(
    @Inject(JOB_POSTING_CACHE_REPOSITORY)
    private readonly jobPostingCacheRepository: JobPostingCacheRepository,
    private readonly jobPostingCollectorService: JobPostingCollectorService,
    private readonly jobPostingChangeDetectorService: JobPostingChangeDetectorService,
    private readonly jobMarketHistoryBuilderService: JobMarketHistoryBuilderService,
  ) {}

  async execute(at: Date = new Date()): Promise<void> {
    const previousAllJobs =
      await this.jobPostingCacheRepository.getAllJobs();
    const results = await this.jobPostingCollectorService.fetchJobsByCompany({
      continueOnError: true,
      coolDownBetweenRuns: true,
    });
    const refreshedEntries = new Map(
      results.map((result) => {
        const source = getJobSourceDescriptor(result.company);
        const entry: JobPostingCacheEntry = {
          jobs: result.jobs,
          snapshot: buildSnapshotMetadata({
            collectedAt: at,
            ttlSeconds: JOBS_FRESHNESS_TTL,
            confidence: source.confidence,
            sourceIds: [source.id],
          }),
        };

        return [result.company, entry] as const;
      }),
    );
    const finalEntries = new Map<string, JobPostingCacheEntry>();

    for (const company of JOB_SOURCE_COMPANIES) {
      const refreshedEntry = refreshedEntries.get(company);

      if (refreshedEntry) {
        await this.jobPostingCacheRepository.setCompanyJobs(company, refreshedEntry);
        finalEntries.set(company, refreshedEntry);
        this.logger.log(
          `Updated ${refreshedEntry.jobs.length} jobs for ${company}`,
        );
        continue;
      }

      const cachedEntry =
        await this.jobPostingCacheRepository.getCompanyJobs(company);

      if (cachedEntry) {
        finalEntries.set(company, cachedEntry);
        this.logger.warn(
          `Reused previous ${company} snapshot because the latest crawl did not complete.`,
        );
      }
    }

    const allJobs: JobPosting[] = Array.from(finalEntries.values()).flatMap(
      (entry) => entry.jobs,
    );
    const allSnapshot = mergeSnapshotMetadata(
      Array.from(finalEntries.values()).map((entry) => entry.snapshot),
    );
    const allEntry: JobPostingCacheEntry = {
      jobs: allJobs,
      snapshot:
        allSnapshot ??
        buildSnapshotMetadata({
          collectedAt: at,
          ttlSeconds: JOBS_FRESHNESS_TTL,
          confidence: 0.75,
          sourceIds: [],
        }),
    };

    await this.jobPostingCacheRepository.setAllJobs(allEntry);
    await this.jobPostingCacheRepository.appendJobMarketHistory(
      this.jobMarketHistoryBuilderService.build(allEntry),
    );
    await this.jobPostingCacheRepository.clearDerivedSearchCaches();
    await this.jobPostingCacheRepository.setJobChangeSignals(
      this.jobPostingChangeDetectorService.detect({
        previousJobs: previousAllJobs?.jobs,
        currentJobs: allJobs,
        generatedAt: at,
        baselineCollectedAt: previousAllJobs?.snapshot?.collectedAt,
        snapshot: allEntry.snapshot,
      }),
    );
    await this.jobPostingCacheRepository.setLastUpdate(at.toISOString());
  }
}
