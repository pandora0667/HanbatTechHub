import { Injectable } from '@nestjs/common';
import { JobPosting } from '../../../jobs/interfaces/job-posting.interface';
import { JobMarketHistoryEntry } from '../../../jobs/domain/models/job-market-history.model';

interface MarketChangeSignal {
  jobId: string;
  changeType: string;
}

interface MarketDeadlineSignal {
  id: string;
}

interface MarketMomentumValue {
  name: string;
  currentCount: number;
  baselineCount: number;
  delta: number;
  direction: 'up' | 'down' | 'flat';
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

  buildTrendSection(history: JobMarketHistoryEntry[], limit: number) {
    if (history.length === 0) {
      return {
        summary: {
          historyPoints: 0,
          baselineCollectedAt: undefined,
          latestCollectedAt: undefined,
          totalOpenOpportunitiesDelta: 0,
          companiesHiringDelta: 0,
          fieldsTrackedDelta: 0,
          skillsTrackedDelta: 0,
        },
        timeline: [],
        companyMomentum: [],
        fieldMomentum: [],
        skillMomentum: [],
      };
    }

    const latest = history[0];
    const baseline = history[history.length - 1];

    return {
      summary: {
        historyPoints: history.length,
        baselineCollectedAt: baseline.snapshot.collectedAt,
        latestCollectedAt: latest.snapshot.collectedAt,
        totalOpenOpportunitiesDelta:
          latest.summary.totalOpenOpportunities -
          baseline.summary.totalOpenOpportunities,
        companiesHiringDelta:
          latest.summary.companiesHiring - baseline.summary.companiesHiring,
        fieldsTrackedDelta:
          latest.summary.fieldsTracked - baseline.summary.fieldsTracked,
        skillsTrackedDelta:
          latest.summary.skillsTracked - baseline.summary.skillsTracked,
      },
      timeline: [...history]
        .reverse()
        .map((entry) => ({
          collectedAt: entry.snapshot.collectedAt,
          totalOpenOpportunities: entry.summary.totalOpenOpportunities,
          companiesHiring: entry.summary.companiesHiring,
        })),
      companyMomentum: this.buildMomentum(
        latest.companies.map((item) => ({
          key: item.company,
          label: item.company,
          count: item.openJobs,
        })),
        baseline.companies.map((item) => ({
          key: item.company,
          label: item.company,
          count: item.openJobs,
        })),
        limit,
      ),
      fieldMomentum: this.buildMomentum(
        latest.fields.map((item) => ({
          key: item.field,
          label: item.field,
          count: item.openJobs,
        })),
        baseline.fields.map((item) => ({
          key: item.field,
          label: item.field,
          count: item.openJobs,
        })),
        limit,
      ),
      skillMomentum: this.buildMomentum(
        latest.skills.map((item) => ({
          key: item.skill,
          label: item.skill,
          count: item.demandCount,
        })),
        baseline.skills.map((item) => ({
          key: item.skill,
          label: item.skill,
          count: item.demandCount,
        })),
        limit,
      ),
    };
  }

  private buildMomentum(
    currentItems: Array<{ key: string; label: string; count: number }>,
    baselineItems: Array<{ key: string; label: string; count: number }>,
    limit: number,
  ): MarketMomentumValue[] {
    const baselineMap = new Map(
      baselineItems.map((item) => [item.key, item.count] as const),
    );

    return currentItems
      .map((item) => {
        const baselineCount = baselineMap.get(item.key) ?? 0;
        const delta = item.count - baselineCount;

        return {
          name: item.label,
          currentCount: item.count,
          baselineCount,
          delta,
          direction: this.getDirection(delta),
        };
      })
      .sort((left, right) => {
        const rightMagnitude = Math.abs(right.delta);
        const leftMagnitude = Math.abs(left.delta);

        if (rightMagnitude !== leftMagnitude) {
          return rightMagnitude - leftMagnitude;
        }

        if (right.currentCount !== left.currentCount) {
          return right.currentCount - left.currentCount;
        }

        return left.name.localeCompare(right.name);
      })
      .slice(0, limit);
  }

  private getDirection(delta: number): 'up' | 'down' | 'flat' {
    if (delta > 0) {
      return 'up';
    }

    if (delta < 0) {
      return 'down';
    }

    return 'flat';
  }
}
