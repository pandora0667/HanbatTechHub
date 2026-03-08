import { Injectable } from '@nestjs/common';
import { createOffsetPaginationWindow } from '../../../../common/utils/pagination.util';
import { joinRedisKeySegments } from '../../../../common/utils/redis-key.util';
import { REDIS_KEYS } from '../../constants/redis.constant';
import { JobPosting } from '../../interfaces/job-posting.interface';
import { JobSearchQuery } from '../types/job-search-query.type';
import { PaginatedResult } from '../types/paginated-result.type';

@Injectable()
export class JobPostingSearchService {
  filter(jobs: JobPosting[], query: JobSearchQuery): JobPosting[] {
    let filteredJobs = jobs;

    if (query.department) {
      filteredJobs = filteredJobs.filter((job) =>
        job.department.toLowerCase().includes(query.department!.toLowerCase()),
      );
    }

    if (query.field) {
      filteredJobs = filteredJobs.filter((job) =>
        job.field.toLowerCase().includes(query.field!.toLowerCase()),
      );
    }

    if (query.career) {
      filteredJobs = filteredJobs.filter(
        (job) => job.requirements.career === query.career,
      );
    }

    if (query.employmentType) {
      filteredJobs = filteredJobs.filter(
        (job) => job.employmentType === query.employmentType,
      );
    }

    if (query.location) {
      filteredJobs = filteredJobs.filter((job) =>
        job.locations.includes(query.location!),
      );
    }

    if (query.keyword) {
      const keyword = query.keyword.toLowerCase();
      filteredJobs = filteredJobs.filter((job) => {
        const titleMatch = job.title.toLowerCase().includes(keyword);
        const descMatch =
          job.description?.toLowerCase().includes(keyword) || false;
        const tagMatch =
          job.tags?.some((tag) => tag.toLowerCase().includes(keyword)) || false;
        const skillMatch =
          job.requirements.skills?.some((skill) =>
            skill.toLowerCase().includes(keyword),
          ) || false;

        return titleMatch || descMatch || tagMatch || skillMatch;
      });
    }

    return filteredJobs;
  }

  paginate(
    jobs: JobPosting[],
    query: JobSearchQuery,
  ): PaginatedResult<JobPosting> {
    const window = createOffsetPaginationWindow(
      jobs.length,
      query.page || 1,
      query.limit || 10,
      10,
    );

    return {
      data: jobs.slice(window.startIndex, window.startIndex + window.limit),
      meta: {
        total: jobs.length,
        page: window.currentPage,
        limit: window.limit,
        totalPages: window.totalPages,
      },
    };
  }

  buildTechJobsCacheKey(query: JobSearchQuery): string {
    if (!query || Object.keys(query).length === 0) {
      return REDIS_KEYS.JOBS_ALL;
    }

    const parts = [REDIS_KEYS.JOBS_TECH];

    if (query.company) {
      parts.push(`company:${query.company}`);
    }

    if (query.department) {
      parts.push(`department:${query.department}`);
    }

    if (query.field) {
      parts.push(`field:${query.field}`);
    }

    if (query.career) {
      parts.push(`career:${query.career}`);
    }

    if (query.employmentType) {
      parts.push(`employmentType:${query.employmentType}`);
    }

    if (query.location) {
      parts.push(`location:${query.location}`);
    }

    if (query.keyword) {
      parts.push(`keyword:${query.keyword}`);
    }

    if (parts.length === 1) {
      return REDIS_KEYS.JOBS_ALL;
    }

    return joinRedisKeySegments(...parts);
  }
}
