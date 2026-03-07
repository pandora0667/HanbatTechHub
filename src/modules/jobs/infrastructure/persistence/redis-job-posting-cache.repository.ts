import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../redis/redis.service';
import { JOBS_CACHE_TTL, REDIS_KEYS } from '../../constants/redis.constant';
import { CompanyType, JobPosting } from '../../interfaces/job-posting.interface';
import { JobPostingCacheRepository } from '../../application/ports/job-posting-cache.repository';

@Injectable()
export class RedisJobPostingCacheRepository
  implements JobPostingCacheRepository
{
  constructor(private readonly redisService: RedisService) {}

  async getCompanyJobs(company: CompanyType): Promise<JobPosting[] | null> {
    return this.redisService.get<JobPosting[]>(
      `${REDIS_KEYS.JOBS_COMPANY}${company}`,
    );
  }

  async setCompanyJobs(
    company: CompanyType,
    jobs: JobPosting[],
  ): Promise<void> {
    await this.redisService.set(
      `${REDIS_KEYS.JOBS_COMPANY}${company}`,
      jobs,
      JOBS_CACHE_TTL,
    );
  }
}
