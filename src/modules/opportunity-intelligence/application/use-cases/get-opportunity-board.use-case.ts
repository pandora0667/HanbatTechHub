import { Inject, Injectable } from '@nestjs/common';
import { paginateArray } from '../../../../common/utils/pagination.util';
import {
  JOB_POSTING_CACHE_REPOSITORY,
  JobPostingCacheRepository,
} from '../../../jobs/application/ports/job-posting-cache.repository';
import { JobPostingSnapshotReaderService } from '../../../jobs/application/services/job-posting-snapshot-reader.service';
import { JobPostingSearchService } from '../../../jobs/domain/services/job-posting-search.service';
import { JobPosting } from '../../../jobs/interfaces/job-posting.interface';
import { SourceRegistryService } from '../../../source-registry/source-registry.service';
import { GetOpportunitiesQueryDto } from '../../dto/get-opportunities-query.dto';
import { OpportunityBoardResponseDto } from '../../dto/opportunity-board.response.dto';

@Injectable()
export class GetOpportunityBoardUseCase {
  constructor(
    @Inject(JOB_POSTING_CACHE_REPOSITORY)
    private readonly jobPostingCacheRepository: JobPostingCacheRepository,
    private readonly jobPostingSnapshotReaderService: JobPostingSnapshotReaderService,
    private readonly jobPostingSearchService: JobPostingSearchService,
    private readonly sourceRegistryService: SourceRegistryService,
  ) {}

  async execute(
    query: GetOpportunitiesQueryDto,
  ): Promise<OpportunityBoardResponseDto> {
    const [allJobsEntry, changeSignals] = await Promise.all([
      this.jobPostingSnapshotReaderService.getResolvedAllJobs(),
      this.jobPostingCacheRepository.getJobChangeSignals(),
    ]);
    const generatedAt = new Date().toISOString();

    if (!allJobsEntry) {
      return {
        generatedAt,
        snapshot: undefined,
        summary: {
          totalOpenOpportunities: 0,
          companies: 0,
          closingSoon: 0,
          newSignals: 0,
          updatedSignals: 0,
        },
        meta: {
          totalCount: 0,
          currentPage: query.page ?? 1,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          limit: query.limit ?? 20,
          sort: query.sort ?? 'deadline',
          deadlineWindowDays: query.deadlineWindowDays ?? 7,
          company: query.company,
          keyword: query.keyword,
          onlyClosingSoon: query.onlyClosingSoon ?? false,
          onlyChanged: query.onlyChanged ?? false,
          snapshot: undefined,
        },
        items: [],
        sources: [],
      };
    }

    const newSignalIds = new Set(
      (changeSignals?.signals ?? [])
        .filter((signal) => signal.changeType === 'new')
        .map((signal) => signal.jobId),
    );
    const updatedSignalIds = new Set(
      (changeSignals?.signals ?? [])
        .filter((signal) => signal.changeType === 'updated')
        .map((signal) => signal.jobId),
    );

    let filteredJobs = this.jobPostingSearchService.filter(allJobsEntry.jobs, query);

    if (query.onlyChanged) {
      filteredJobs = filteredJobs.filter(
        (job) => newSignalIds.has(job.id) || updatedSignalIds.has(job.id),
      );
    }

    if (query.onlyClosingSoon) {
      filteredJobs = filteredJobs.filter((job) =>
        this.isClosingSoon(job, query.deadlineWindowDays ?? 7),
      );
    }

    const sortedJobs = filteredJobs.slice().sort((left, right) => {
      if (query.sort === 'updated') {
        return right.updatedAt.getTime() - left.updatedAt.getTime();
      }

      return left.period.end.getTime() - right.period.end.getTime();
    });
    const paginated = paginateArray(
      sortedJobs,
      query.page ?? 1,
      query.limit ?? 20,
      20,
    );
    const items = paginated.items.map((job) =>
      this.toOpportunityItem(job, newSignalIds, updatedSignalIds, query),
    );

    return {
      generatedAt,
      snapshot: allJobsEntry.snapshot,
      summary: {
        totalOpenOpportunities: sortedJobs.length,
        companies: new Set(sortedJobs.map((job) => job.company)).size,
        closingSoon: sortedJobs.filter((job) =>
          this.isClosingSoon(job, query.deadlineWindowDays ?? 7),
        ).length,
        newSignals: sortedJobs.filter((job) => newSignalIds.has(job.id)).length,
        updatedSignals: sortedJobs.filter((job) => updatedSignalIds.has(job.id))
          .length,
      },
      meta: {
        ...paginated.meta,
        limit: query.limit ?? 20,
        sort: query.sort ?? 'deadline',
        deadlineWindowDays: query.deadlineWindowDays ?? 7,
        company: query.company,
        keyword: query.keyword,
        onlyClosingSoon: query.onlyClosingSoon ?? false,
        onlyChanged: query.onlyChanged ?? false,
        snapshot: allJobsEntry.snapshot,
      },
      items,
      sources: this.sourceRegistryService
        .list()
        .filter((source) => allJobsEntry.snapshot.sourceIds.includes(source.id))
        .sort((left, right) => left.id.localeCompare(right.id)),
    };
  }

  private toOpportunityItem(
    job: JobPosting,
    newSignalIds: Set<string>,
    updatedSignalIds: Set<string>,
    query: GetOpportunitiesQueryDto,
  ) {
    return {
      id: job.id,
      company: job.company,
      title: job.title,
      department: job.department,
      field: job.field,
      career: job.requirements.career,
      employmentType: job.employmentType,
      locations: [...job.locations],
      skills: [...(job.requirements.skills ?? [])],
      deadline: job.period.end.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      url: job.url,
      signal: {
        isNew: newSignalIds.has(job.id),
        isUpdated: updatedSignalIds.has(job.id),
        closesSoon: this.isClosingSoon(job, query.deadlineWindowDays ?? 7),
        daysRemaining: this.getDaysRemaining(job.period.end),
      },
    };
  }

  private isClosingSoon(job: JobPosting, windowDays: number): boolean {
    const daysRemaining = this.getDaysRemaining(job.period.end);
    return daysRemaining >= 0 && daysRemaining <= windowDays;
  }

  private getDaysRemaining(deadline: Date): number {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
