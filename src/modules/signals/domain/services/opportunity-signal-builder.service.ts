import { Injectable } from '@nestjs/common';
import { JobPosting } from '../../../jobs/interfaces/job-posting.interface';
import {
  OpportunitySignal,
  OpportunitySignalResult,
  OpportunitySignalSeverity,
  OpportunitySignalSummary,
} from '../models/opportunity-signal.model';
import { SnapshotMetadata } from '../../../../common/types/snapshot.types';

@Injectable()
export class OpportunitySignalBuilderService {
  buildUpcomingJobDeadlineSignals(params: {
    jobs: JobPosting[];
    windowDays: number;
    limit: number;
    snapshot?: SnapshotMetadata;
    now?: Date;
  }): OpportunitySignalResult {
    const now = params.now ?? new Date();
    const cutoff = new Date(now.getTime() + params.windowDays * 24 * 60 * 60 * 1000);

    const signals = params.jobs
      .map((job) => this.toDeadlineSignal(job, now))
      .filter((signal): signal is OpportunitySignal => Boolean(signal))
      .filter((signal) => new Date(signal.deadline).getTime() <= cutoff.getTime())
      .sort(
        (left, right) =>
          new Date(left.deadline).getTime() - new Date(right.deadline).getTime(),
      )
      .slice(0, params.limit);

    return {
      generatedAt: now.toISOString(),
      snapshot: params.snapshot,
      summary: this.summarize(signals, params.windowDays),
      signals,
    };
  }

  private toDeadlineSignal(
    job: JobPosting,
    now: Date,
  ): OpportunitySignal | null {
    const deadline = new Date(job.period.end);

    if (Number.isNaN(deadline.getTime()) || deadline.getTime() < now.getTime()) {
      return null;
    }

    const daysRemaining = Math.ceil(
      (deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
    );
    const severity = this.resolveSeverity(daysRemaining);

    return {
      type: 'job_deadline',
      severity,
      id: job.id,
      company: job.company,
      title: job.title,
      department: job.department,
      field: job.field,
      deadline: deadline.toISOString(),
      daysRemaining,
      url: job.url,
      locations: [...job.locations],
    };
  }

  private resolveSeverity(daysRemaining: number): OpportunitySignalSeverity {
    if (daysRemaining <= 1) {
      return 'closing_today';
    }

    if (daysRemaining <= 3) {
      return 'closing_soon';
    }

    return 'watch';
  }

  private summarize(
    signals: OpportunitySignal[],
    windowDays: number,
  ): OpportunitySignalSummary {
    return signals.reduce<OpportunitySignalSummary>(
      (summary, signal) => {
        summary.total += 1;

        if (signal.severity === 'closing_today') {
          summary.closingToday += 1;
        } else if (signal.severity === 'closing_soon') {
          summary.closingSoon += 1;
        } else {
          summary.watch += 1;
        }

        return summary;
      },
      {
        total: 0,
        closingToday: 0,
        closingSoon: 0,
        watch: 0,
        windowDays,
      },
    );
  }
}
