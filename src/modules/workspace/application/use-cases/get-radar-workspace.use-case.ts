import { Injectable } from '@nestjs/common';
import { SnapshotMetadata } from '../../../../common/types/snapshot.types';
import { mergeSnapshotMetadata } from '../../../../common/utils/snapshot.util';
import { SignalsService } from '../../../signals/signals.service';
import { GetRadarWorkspaceQueryDto } from '../../dto/get-radar-workspace-query.dto';
import { RadarWorkspaceResponseDto } from '../../dto/radar-workspace.response.dto';
import { RadarWorkspaceOverviewService } from '../../domain/services/radar-workspace-overview.service';

@Injectable()
export class GetRadarWorkspaceUseCase {
  constructor(
    private readonly signalsService: SignalsService,
    private readonly radarWorkspaceOverviewService: RadarWorkspaceOverviewService,
  ) {}

  async execute(
    query: GetRadarWorkspaceQueryDto = {},
  ): Promise<RadarWorkspaceResponseDto> {
    const [
      staleSources,
      missingSources,
      newOpportunities,
      updatedOpportunities,
      removedOpportunities,
      upcomingDeadlines,
    ] = await Promise.all([
      this.signalsService.getSourceFreshnessSignals({
        status: 'stale',
      }),
      this.signalsService.getSourceFreshnessSignals({
        status: 'missing',
      }),
      this.signalsService.getOpportunityChangeSignals({
        company: query.company,
        changeType: 'new',
        limit: query.changeLimit,
      }),
      this.signalsService.getOpportunityChangeSignals({
        company: query.company,
        changeType: 'updated',
        limit: query.changeLimit,
      }),
      this.signalsService.getOpportunityChangeSignals({
        company: query.company,
        changeType: 'removed',
        limit: query.changeLimit,
      }),
      this.signalsService.getUpcomingOpportunitySignals({
        days: query.deadlineWindowDays,
        limit: query.deadlineLimit,
      }),
    ]);
    const generatedAt = new Date().toISOString();
    const snapshots = [
      newOpportunities.snapshot,
      updatedOpportunities.snapshot,
      removedOpportunities.snapshot,
      upcomingDeadlines.snapshot,
    ].filter(
      (snapshot): snapshot is SnapshotMetadata => snapshot !== undefined,
    );

    staleSources.signals = staleSources.signals.slice(0, query.sourceLimit ?? 10);
    staleSources.summary.total = staleSources.signals.length;
    staleSources.summary.stale = staleSources.signals.length;
    staleSources.summary.fresh = 0;
    staleSources.summary.missing = 0;

    missingSources.signals = missingSources.signals.slice(
      0,
      query.sourceLimit ?? 10,
    );
    missingSources.summary.total = missingSources.signals.length;
    missingSources.summary.missing = missingSources.signals.length;
    missingSources.summary.fresh = 0;
    missingSources.summary.stale = 0;

    return {
      generatedAt,
      snapshot: mergeSnapshotMetadata(snapshots),
      overview: this.radarWorkspaceOverviewService.build({
        staleSources,
        missingSources,
        newOpportunities,
        updatedOpportunities,
        removedOpportunities,
        upcomingDeadlines,
      }),
      sections: {
        staleSources,
        missingSources,
        newOpportunities,
        updatedOpportunities,
        removedOpportunities,
        upcomingDeadlines,
      },
    };
  }
}
