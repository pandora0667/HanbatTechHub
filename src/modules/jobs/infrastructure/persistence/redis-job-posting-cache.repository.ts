import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../redis/redis.service';
import { appendRedisKey } from '../../../../common/utils/redis-key.util';
import {
  JOBS_CACHE_TTL,
  JOBS_CHANGE_SIGNALS_TTL,
  JOBS_FRESHNESS_TTL,
  JOBS_MARKET_HISTORY_LIMIT,
  JOBS_MARKET_HISTORY_TTL,
  REDIS_KEYS,
} from '../../constants/redis.constant';
import { buildSnapshotMetadata } from '../../../../common/utils/snapshot.util';
import {
  CompanyType,
  JobPosting,
} from '../../interfaces/job-posting.interface';
import {
  JobPostingCacheEntry,
  JobPostingCacheRepository,
} from '../../application/ports/job-posting-cache.repository';
import { getJobSourceDescriptor } from '../../constants/job-source.constant';
import { JobPostingChangeResult } from '../../domain/models/job-posting-change.model';
import { JobMarketHistoryEntry } from '../../domain/models/job-market-history.model';

@Injectable()
export class RedisJobPostingCacheRepository
  implements JobPostingCacheRepository
{
  constructor(private readonly redisService: RedisService) {}

  async initializeJobsCache(): Promise<void> {
    await this.clearDerivedSearchCaches();
  }

  async clearDerivedSearchCaches(): Promise<void> {
    await this.redisService.flushByPattern(`${REDIS_KEYS.JOBS_TECH}*`);
  }

  async getSearchJobs(cacheKey: string): Promise<JobPostingCacheEntry | null> {
    const value = await this.redisService.get<JobPostingCacheEntry | JobPosting[]>(
      cacheKey,
    );

    return this.normalizeCacheEntry(value);
  }

  async setSearchJobs(
    cacheKey: string,
    entry: JobPostingCacheEntry,
  ): Promise<void> {
    await this.redisService.set(cacheKey, entry, JOBS_CACHE_TTL);
  }

  async getCompanyJobs(
    company: CompanyType,
  ): Promise<JobPostingCacheEntry | null> {
    const value = await this.redisService.get<JobPostingCacheEntry | JobPosting[]>(
      appendRedisKey(REDIS_KEYS.JOBS_COMPANY, company),
    );

    return this.normalizeCacheEntry(value, [getJobSourceDescriptor(company).id]);
  }

  async setCompanyJobs(
    company: CompanyType,
    entry: JobPostingCacheEntry,
  ): Promise<void> {
    await this.redisService.set(
      appendRedisKey(REDIS_KEYS.JOBS_COMPANY, company),
      entry,
      JOBS_CACHE_TTL,
    );
  }

  async getAllJobs(): Promise<JobPostingCacheEntry | null> {
    const value = await this.redisService.get<JobPostingCacheEntry | JobPosting[]>(
      REDIS_KEYS.JOBS_ALL,
    );

    return this.normalizeCacheEntry(value);
  }

  async setAllJobs(entry: JobPostingCacheEntry): Promise<void> {
    await this.redisService.set(REDIS_KEYS.JOBS_ALL, entry, JOBS_CACHE_TTL);
  }

  async getJobChangeSignals(): Promise<JobPostingChangeResult | null> {
    return this.redisService.get<JobPostingChangeResult>(
      REDIS_KEYS.JOBS_CHANGE_SIGNALS,
    );
  }

  async setJobChangeSignals(result: JobPostingChangeResult): Promise<void> {
    await this.redisService.set(
      REDIS_KEYS.JOBS_CHANGE_SIGNALS,
      result,
      JOBS_CHANGE_SIGNALS_TTL,
    );
  }

  async getJobMarketHistory(limit = JOBS_MARKET_HISTORY_LIMIT): Promise<JobMarketHistoryEntry[]> {
    const history = await this.redisService.get<JobMarketHistoryEntry[]>(
      REDIS_KEYS.JOBS_MARKET_HISTORY,
    );

    if (!Array.isArray(history)) {
      return [];
    }

    return history.slice(0, limit);
  }

  async appendJobMarketHistory(entry: JobMarketHistoryEntry): Promise<void> {
    const history = await this.getJobMarketHistory(JOBS_MARKET_HISTORY_LIMIT);
    const nextHistory =
      history[0]?.snapshot.collectedAt === entry.snapshot.collectedAt
        ? [entry, ...history.slice(1)]
        : [entry, ...history];

    await this.redisService.set(
      REDIS_KEYS.JOBS_MARKET_HISTORY,
      nextHistory.slice(0, JOBS_MARKET_HISTORY_LIMIT),
      JOBS_MARKET_HISTORY_TTL,
    );
  }

  async getLastUpdate(): Promise<string | null> {
    return this.redisService.get<string>(REDIS_KEYS.JOBS_LAST_UPDATE);
  }

  async setLastUpdate(timestamp: string): Promise<void> {
    await this.redisService.set(REDIS_KEYS.JOBS_LAST_UPDATE, timestamp);
  }

  private async normalizeCacheEntry(
    value: JobPostingCacheEntry | JobPosting[] | null,
    fallbackSourceIds: string[] = [],
  ): Promise<JobPostingCacheEntry | null> {
    if (!value) {
      return null;
    }

    if (Array.isArray(value)) {
      const lastUpdate = await this.getLastUpdate();

      return {
        jobs: this.hydrateJobs(value),
        snapshot: buildSnapshotMetadata({
          collectedAt: lastUpdate ?? new Date(),
          ttlSeconds: JOBS_FRESHNESS_TTL,
          confidence: 0.7,
          sourceIds: fallbackSourceIds,
        }),
      };
    }

    return {
      ...value,
      jobs: this.hydrateJobs(value.jobs),
    };
  }

  private hydrateJobs(jobs: JobPosting[]): JobPosting[] {
    return jobs.map((job) => ({
      ...job,
      period: {
        start: new Date(job.period.start),
        end: new Date(job.period.end),
      },
      createdAt: new Date(job.createdAt),
      updatedAt: new Date(job.updatedAt),
    }));
  }
}
