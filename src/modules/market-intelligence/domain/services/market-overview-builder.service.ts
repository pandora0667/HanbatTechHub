import { Injectable } from '@nestjs/common';
import { JobPosting } from '../../../jobs/interfaces/job-posting.interface';

interface MarketChangeSignal {
  jobId: string;
  changeType: string;
}

interface MarketDeadlineSignal {
  id: string;
}

@Injectable()
export class MarketOverviewBuilderService {
  buildTopCompanies(
    jobs: JobPosting[],
    changeSignals: MarketChangeSignal[],
    deadlineSignals: MarketDeadlineSignal[],
    limit: number,
  ) {
    const newJobIds = new Set(
      changeSignals
        .filter((signal) => signal.changeType === 'new')
        .map((signal) => signal.jobId),
    );
    const updatedJobIds = new Set(
      changeSignals
        .filter((signal) => signal.changeType === 'updated')
        .map((signal) => signal.jobId),
    );
    const closingSoonJobIds = new Set(deadlineSignals.map((signal) => signal.id));
    const stats = new Map<
      string,
      {
        openJobs: number;
        newJobs: number;
        updatedJobs: number;
        closingSoonJobs: number;
      }
    >();

    for (const job of jobs) {
      const companyStat = stats.get(job.company) ?? {
        openJobs: 0,
        newJobs: 0,
        updatedJobs: 0,
        closingSoonJobs: 0,
      };

      companyStat.openJobs += 1;

      if (newJobIds.has(job.id)) {
        companyStat.newJobs += 1;
      }

      if (updatedJobIds.has(job.id)) {
        companyStat.updatedJobs += 1;
      }

      if (closingSoonJobIds.has(job.id)) {
        companyStat.closingSoonJobs += 1;
      }

      stats.set(job.company, companyStat);
    }

    return Array.from(stats.entries())
      .map(([company, stat]) => ({
        company,
        ...stat,
      }))
      .sort((left, right) => {
        if (right.openJobs !== left.openJobs) {
          return right.openJobs - left.openJobs;
        }

        return right.newJobs - left.newJobs;
      })
      .slice(0, limit);
  }

  buildTopFields(jobs: JobPosting[], limit: number) {
    const stats = new Map<
      string,
      {
        openJobs: number;
        companies: Set<string>;
      }
    >();

    for (const job of jobs) {
      const fieldStat = stats.get(job.field) ?? {
        openJobs: 0,
        companies: new Set<string>(),
      };

      fieldStat.openJobs += 1;
      fieldStat.companies.add(job.company);
      stats.set(job.field, fieldStat);
    }

    return Array.from(stats.entries())
      .map(([field, stat]) => ({
        field,
        openJobs: stat.openJobs,
        companies: stat.companies.size,
      }))
      .sort((left, right) => {
        if (right.openJobs !== left.openJobs) {
          return right.openJobs - left.openJobs;
        }

        return right.companies - left.companies;
      })
      .slice(0, limit);
  }
}
