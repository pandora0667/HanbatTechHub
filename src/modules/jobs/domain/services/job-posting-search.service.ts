import { Injectable } from '@nestjs/common';
import { GetJobsQueryDto } from '../../dto/requests/get-jobs-query.dto';
import { REDIS_KEYS } from '../../constants/redis.constant';
import { JobPosting } from '../../interfaces/job-posting.interface';
import { PaginatedResult } from '../types/paginated-result.type';

@Injectable()
export class JobPostingSearchService {
  filter(jobs: JobPosting[], query: GetJobsQueryDto): JobPosting[] {
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
    query: GetJobsQueryDto,
  ): PaginatedResult<JobPosting> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 ? limit : 10;
    const start = (safePage - 1) * safeLimit;
    const end = start + safeLimit;

    return {
      data: jobs.slice(start, end),
      meta: {
        total: jobs.length,
        page: safePage,
        limit: safeLimit,
        totalPages: jobs.length === 0 ? 0 : Math.ceil(jobs.length / safeLimit),
      },
    };
  }

  buildTechJobsCacheKey(query: GetJobsQueryDto): string {
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

    return parts.join(':');
  }
}
