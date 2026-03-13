import { Injectable } from '@nestjs/common';
import { BlogResponseDto } from '../../../blog/dto/blog-response.dto';
import { NoticeListResponseDto } from '../../../notice/dto/notice.dto';
import { OpportunityChangeSignalsResponseDto } from '../../../signals/dto/opportunity-change-signals.response.dto';
import { SourceFreshnessSignalsResponseDto } from '../../../signals/dto/source-freshness-signals.response.dto';
import { UpcomingOpportunitySignalsResponseDto } from '../../../signals/dto/upcoming-opportunity-signals.response.dto';

interface BuildTodayWorkspaceOverviewInput {
  freshness: SourceFreshnessSignalsResponseDto;
  opportunityChanges: OpportunityChangeSignalsResponseDto;
  upcomingOpportunities: UpcomingOpportunitySignalsResponseDto;
  latestContent: BlogResponseDto;
  latestNotices: NoticeListResponseDto;
}

@Injectable()
export class TodayWorkspaceOverviewService {
  build(input: BuildTodayWorkspaceOverviewInput) {
    return {
      staleSources: input.freshness.summary.stale,
      missingSources: input.freshness.summary.missing,
      opportunityChanges: input.opportunityChanges.summary.total,
      upcomingOpportunities: input.upcomingOpportunities.summary.total,
      latestContentItems: input.latestContent.items.length,
      latestNoticeItems: input.latestNotices.items.length,
    };
  }
}
