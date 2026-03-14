import { Injectable } from '@nestjs/common';
import { mergeSnapshotMetadata } from '../../../../common/utils/snapshot.util';
import { SignalsService } from '../../../signals/signals.service';
import { GetInstitutionOpportunityBoardUseCase } from '../../../institution-intelligence/application/use-cases/get-institution-opportunity-board.use-case';
import { GetTodayWorkspaceQueryDto } from '../../dto/get-today-workspace-query.dto';
import { TodayWorkspaceResponseDto } from '../../dto/today-workspace.response.dto';
import { TodayWorkspaceOverviewService } from '../../domain/services/today-workspace-overview.service';
import { SnapshotMetadata } from '../../../../common/types/snapshot.types';
import { WorkspaceSectionBuilderService } from '../services/workspace-section-builder.service';

@Injectable()
export class GetTodayWorkspaceUseCase {
  constructor(
    private readonly signalsService: SignalsService,
    private readonly getInstitutionOpportunityBoardUseCase: GetInstitutionOpportunityBoardUseCase,
    private readonly workspaceSectionBuilderService: WorkspaceSectionBuilderService,
    private readonly todayWorkspaceOverviewService: TodayWorkspaceOverviewService,
  ) {}

  async execute(
    query: GetTodayWorkspaceQueryDto = {},
  ): Promise<TodayWorkspaceResponseDto> {
    const [
      freshness,
      opportunityChanges,
      upcomingOpportunities,
      latestContent,
      latestNotices,
      institutionOpportunities,
    ] = await Promise.all([
      this.signalsService.getSourceFreshnessSignals({}),
      this.signalsService.getOpportunityChangeSignals({
        limit: query.changeLimit,
      }),
      this.signalsService.getUpcomingOpportunitySignals({
        limit: query.deadlineLimit,
        days: query.deadlineWindowDays,
      }),
      this.workspaceSectionBuilderService.getLatestContent(query.contentLimit ?? 5),
      this.workspaceSectionBuilderService.getLatestNotices(query.noticeLimit ?? 5),
      this.getInstitutionOpportunityBoardUseCase.execute({
        institutions: query.institutions,
        rolloutWave: query.institutions ? undefined : 1,
        limit: query.institutionLimit ?? 5,
        page: 1,
      }),
    ]);
    const generatedAt = new Date().toISOString();
    const snapshots = [
      latestContent.meta.snapshot,
      latestNotices.meta.snapshot,
      opportunityChanges.snapshot,
      upcomingOpportunities.snapshot,
      institutionOpportunities.snapshot,
    ].filter(
      (snapshot): snapshot is SnapshotMetadata => snapshot !== undefined,
    );

    return {
      generatedAt,
      snapshot: mergeSnapshotMetadata(snapshots),
      overview: this.todayWorkspaceOverviewService.build({
        freshness,
        opportunityChanges,
        upcomingOpportunities,
        latestContent,
        latestNotices,
        institutionOpportunities,
      }),
      sections: {
        freshness,
        opportunityChanges,
        upcomingOpportunities,
        latestContent,
        latestNotices,
        institutionOpportunities,
      },
    };
  }
}
