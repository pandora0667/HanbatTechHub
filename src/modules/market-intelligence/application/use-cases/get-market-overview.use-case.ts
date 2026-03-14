import { Inject, Injectable } from '@nestjs/common';
import { JobPostingSnapshotReaderService } from '../../../jobs/application/services/job-posting-snapshot-reader.service';
import {
  JOB_POSTING_CACHE_REPOSITORY,
  JobPostingCacheRepository,
} from '../../../jobs/application/ports/job-posting-cache.repository';
import { JobMarketHistoryBuilderService } from '../../../jobs/domain/services/job-market-history-builder.service';
import { SkillIntelligenceService } from '../../../skill-intelligence/skill-intelligence.service';
import { SignalsService } from '../../../signals/signals.service';
import { SourceRegistryService } from '../../../source-registry/source-registry.service';
import { GetMarketOverviewQueryDto } from '../../dto/get-market-overview-query.dto';
import { MarketOverviewResponseDto } from '../../dto/market-overview.response.dto';
import { MarketOverviewBuilderService } from '../../domain/services/market-overview-builder.service';

@Injectable()
export class GetMarketOverviewUseCase {
  constructor(
    private readonly jobPostingSnapshotReaderService: JobPostingSnapshotReaderService,
    @Inject(JOB_POSTING_CACHE_REPOSITORY)
    private readonly jobPostingCacheRepository: JobPostingCacheRepository,
    private readonly jobMarketHistoryBuilderService: JobMarketHistoryBuilderService,
    private readonly skillIntelligenceService: SkillIntelligenceService,
    private readonly signalsService: SignalsService,
    private readonly sourceRegistryService: SourceRegistryService,
    private readonly marketOverviewBuilderService: MarketOverviewBuilderService,
  ) {}

  async execute(
    query: GetMarketOverviewQueryDto,
  ): Promise<MarketOverviewResponseDto> {
    const historyLimit = query.historyPoints ?? 10;
    const trendLimit = query.trendLimit ?? 5;
    const [
      allJobsEntry,
      marketHistory,
      changeSignals,
      deadlineSignals,
      freshnessSignals,
      skillMap,
    ] =
      await Promise.all([
        this.jobPostingSnapshotReaderService.getResolvedAllJobs(),
        this.jobPostingCacheRepository.getJobMarketHistory(historyLimit),
        this.signalsService.getOpportunityChangeSignals({ limit: 500 }),
        this.signalsService.getUpcomingOpportunitySignals({
          days: query.deadlineWindowDays,
          limit: 500,
        }),
        this.signalsService.getSourceFreshnessSignals({}),
        this.skillIntelligenceService.getSkillMap({
          limit: query.topSkillLimit,
          minDemand: 1,
          sampleLimit: 2,
        }),
      ]);
    const jobs = allJobsEntry?.jobs ?? [];
    const effectiveHistory = this.buildEffectiveHistory(
      allJobsEntry,
      marketHistory,
      historyLimit,
    );
    const generatedAt = new Date().toISOString();
    const sources = allJobsEntry
      ? this.sourceRegistryService
          .list()
          .filter((source) => allJobsEntry.snapshot.sourceIds.includes(source.id))
          .sort((left, right) => left.id.localeCompare(right.id))
      : [];

    return {
      generatedAt,
      snapshot: allJobsEntry?.snapshot,
      summary: {
        totalOpenOpportunities: jobs.length,
        companiesHiring: new Set(jobs.map((job) => job.company)).size,
        fieldsTracked: new Set(jobs.map((job) => job.field)).size,
        skillsTracked: skillMap.summary.totalSkills,
        newSignals: changeSignals.summary.created,
        updatedSignals: changeSignals.summary.updated,
        closingSoonOpportunities: deadlineSignals.summary.total,
        freshSources: freshnessSignals.summary.fresh,
        staleSources: freshnessSignals.summary.stale,
        missingSources: freshnessSignals.summary.missing,
        historyPoints: effectiveHistory.length,
      },
      sections: {
        topCompanies: this.marketOverviewBuilderService.buildTopCompanies(
          jobs,
          changeSignals.signals,
          deadlineSignals.signals,
          query.topCompanyLimit ?? 5,
        ),
        topSkills: skillMap.skills.map((skill) => ({
          skill: skill.skill,
          demandCount: skill.demandCount,
          companyCount: skill.companyCount,
        })),
        topFields: this.marketOverviewBuilderService.buildTopFields(
          jobs,
          query.topFieldLimit ?? 8,
        ),
        staleSources: freshnessSignals.signals
          .filter((signal) => signal.status !== 'fresh')
          .slice(0, query.staleSourceLimit ?? 5)
          .map((signal) => ({
            sourceId: signal.sourceId,
            name: signal.name,
            provider: signal.provider,
            status: signal.status,
            confidence: signal.confidence,
            collectedAt: signal.collectedAt,
          })),
        trends: this.marketOverviewBuilderService.buildTrendSection(
          effectiveHistory,
          trendLimit,
        ),
      },
      sources,
    };
  }

  private buildEffectiveHistory(
    allJobsEntry: Awaited<
      ReturnType<JobPostingSnapshotReaderService['getResolvedAllJobs']>
    >,
    history: Awaited<
      ReturnType<JobPostingCacheRepository['getJobMarketHistory']>
    >,
    limit: number,
  ) {
    if (!allJobsEntry) {
      return history.slice(0, limit);
    }

    const currentSummary = this.jobMarketHistoryBuilderService.build(allJobsEntry);
    if (history[0]?.snapshot.collectedAt === currentSummary.snapshot.collectedAt) {
      return history.slice(0, limit);
    }

    return [currentSummary, ...history].slice(0, limit);
  }
}
