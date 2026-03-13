import { Inject, Injectable } from '@nestjs/common';
import {
  JOB_POSTING_CACHE_REPOSITORY,
  JobPostingCacheRepository,
} from '../../../jobs/application/ports/job-posting-cache.repository';
import {
  JobPostingChangeResult,
  JobPostingChangeSignal,
  JobPostingChangeSummary,
  JobPostingChangeType,
} from '../../../jobs/domain/models/job-posting-change.model';
import { CompanyType } from '../../../jobs/interfaces/job-posting.interface';

export interface GetOpportunityChangeSignalsQuery {
  company?: CompanyType;
  changeType?: JobPostingChangeType;
  limit?: number;
}

@Injectable()
export class GetOpportunityChangeSignalsUseCase {
  constructor(
    @Inject(JOB_POSTING_CACHE_REPOSITORY)
    private readonly jobPostingCacheRepository: JobPostingCacheRepository,
  ) {}

  async execute(
    query: GetOpportunityChangeSignalsQuery = {},
  ): Promise<JobPostingChangeResult> {
    const stored = await this.jobPostingCacheRepository.getJobChangeSignals();

    if (!stored) {
      return this.createEmptyResult();
    }

    let signals = stored.signals;

    if (query.company) {
      signals = signals.filter((signal) => signal.company === query.company);
    }

    if (query.changeType) {
      signals = signals.filter((signal) => signal.changeType === query.changeType);
    }

    if (query.limit) {
      signals = signals.slice(0, query.limit);
    }

    return {
      ...stored,
      summary: this.summarize(signals),
      signals,
    };
  }

  private createEmptyResult(): JobPostingChangeResult {
    return {
      generatedAt: new Date().toISOString(),
      summary: {
        total: 0,
        created: 0,
        updated: 0,
        removed: 0,
      },
      signals: [],
    };
  }

  private summarize(signals: JobPostingChangeSignal[]): JobPostingChangeSummary {
    return signals.reduce<JobPostingChangeSummary>(
      (summary, signal) => {
        summary.total += 1;

        if (signal.changeType === 'new') {
          summary.created += 1;
        } else if (signal.changeType === 'updated') {
          summary.updated += 1;
        } else {
          summary.removed += 1;
        }

        return summary;
      },
      {
        total: 0,
        created: 0,
        updated: 0,
        removed: 0,
      },
    );
  }
}
