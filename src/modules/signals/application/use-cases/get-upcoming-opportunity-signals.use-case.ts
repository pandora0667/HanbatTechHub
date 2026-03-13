import { Inject, Injectable } from '@nestjs/common';
import {
  JOB_POSTING_CACHE_REPOSITORY,
  JobPostingCacheRepository,
} from '../../../jobs/application/ports/job-posting-cache.repository';
import { OpportunitySignalBuilderService } from '../../domain/services/opportunity-signal-builder.service';
import { OpportunitySignalResult } from '../../domain/models/opportunity-signal.model';

export interface GetUpcomingOpportunitySignalsQuery {
  days?: number;
  limit?: number;
}

@Injectable()
export class GetUpcomingOpportunitySignalsUseCase {
  constructor(
    @Inject(JOB_POSTING_CACHE_REPOSITORY)
    private readonly jobPostingCacheRepository: JobPostingCacheRepository,
    private readonly opportunitySignalBuilderService: OpportunitySignalBuilderService,
  ) {}

  async execute(
    query: GetUpcomingOpportunitySignalsQuery = {},
  ): Promise<OpportunitySignalResult> {
    const allJobs = await this.jobPostingCacheRepository.getAllJobs();

    return this.opportunitySignalBuilderService.buildUpcomingJobDeadlineSignals({
      jobs: allJobs?.jobs ?? [],
      snapshot: allJobs?.snapshot,
      windowDays: query.days ?? 7,
      limit: query.limit ?? 10,
    });
  }
}
