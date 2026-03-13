import { Injectable } from '@nestjs/common';
import { JobPostingSnapshotReaderService } from '../../../jobs/application/services/job-posting-snapshot-reader.service';
import { OpportunitySignalBuilderService } from '../../domain/services/opportunity-signal-builder.service';
import { OpportunitySignalResult } from '../../domain/models/opportunity-signal.model';
import { CompanyType } from '../../../jobs/interfaces/job-posting.interface';

export interface GetUpcomingOpportunitySignalsQuery {
  company?: CompanyType;
  days?: number;
  limit?: number;
}

@Injectable()
export class GetUpcomingOpportunitySignalsUseCase {
  constructor(
    private readonly jobPostingSnapshotReaderService: JobPostingSnapshotReaderService,
    private readonly opportunitySignalBuilderService: OpportunitySignalBuilderService,
  ) {}

  async execute(
    query: GetUpcomingOpportunitySignalsQuery = {},
  ): Promise<OpportunitySignalResult> {
    const jobsEntry = query.company
      ? await this.jobPostingSnapshotReaderService.getResolvedCompanyJobs(
          query.company,
        )
      : await this.jobPostingSnapshotReaderService.getResolvedAllJobs();
    const filteredJobs = jobsEntry?.jobs ?? [];

    return this.opportunitySignalBuilderService.buildUpcomingJobDeadlineSignals({
      jobs: filteredJobs,
      snapshot: jobsEntry?.snapshot,
      windowDays: query.days ?? 7,
      limit: query.limit ?? 10,
    });
  }
}
