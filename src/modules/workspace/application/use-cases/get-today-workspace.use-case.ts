import { Injectable } from '@nestjs/common';
import { mergeSnapshotMetadata } from '../../../../common/utils/snapshot.util';
import { BlogService } from '../../../blog/blog.service';
import { NoticeService } from '../../../notice/notice.service';
import { SignalsService } from '../../../signals/signals.service';
import { GetTodayWorkspaceQueryDto } from '../../dto/get-today-workspace-query.dto';
import { TodayWorkspaceResponseDto } from '../../dto/today-workspace.response.dto';
import { TodayWorkspaceOverviewService } from '../../domain/services/today-workspace-overview.service';
import { SnapshotMetadata } from '../../../../common/types/snapshot.types';

@Injectable()
export class GetTodayWorkspaceUseCase {
  constructor(
    private readonly signalsService: SignalsService,
    private readonly blogService: BlogService,
    private readonly noticeService: NoticeService,
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
    ] = await Promise.all([
      this.signalsService.getSourceFreshnessSignals({}),
      this.signalsService.getOpportunityChangeSignals({
        limit: query.changeLimit,
      }),
      this.signalsService.getUpcomingOpportunitySignals({
        limit: query.deadlineLimit,
        days: query.deadlineWindowDays,
      }),
      this.blogService.getAllPosts(1, query.contentLimit),
      this.noticeService.getNotices(1, query.noticeLimit),
    ]);
    const generatedAt = new Date().toISOString();
    const snapshots = [
      latestContent.meta.snapshot,
      latestNotices.meta.snapshot,
      opportunityChanges.snapshot,
      upcomingOpportunities.snapshot,
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
      }),
      sections: {
        freshness,
        opportunityChanges,
        upcomingOpportunities,
        latestContent,
        latestNotices,
      },
    };
  }
}
