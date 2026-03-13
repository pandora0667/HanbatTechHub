import { Injectable } from '@nestjs/common';
import { JobPostingSnapshotReaderService } from '../../../jobs/application/services/job-posting-snapshot-reader.service';
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
    private readonly skillIntelligenceService: SkillIntelligenceService,
    private readonly signalsService: SignalsService,
    private readonly sourceRegistryService: SourceRegistryService,
    private readonly marketOverviewBuilderService: MarketOverviewBuilderService,
  ) {}

  async execute(
    query: GetMarketOverviewQueryDto,
  ): Promise<MarketOverviewResponseDto> {
    const [allJobsEntry, changeSignals, deadlineSignals, freshnessSignals, skillMap] =
      await Promise.all([
        this.jobPostingSnapshotReaderService.getResolvedAllJobs(),
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
      },
      sources,
    };
  }
}
