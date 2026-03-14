import { ApiProperty } from '@nestjs/swagger';
import { SnapshotDto } from '../../../common/dto/snapshot.dto';
import { BlogResponseDto } from '../../blog/dto/blog-response.dto';
import { InstitutionOpportunitiesResponseDto } from '../../institution-intelligence/dto/institution.response.dto';
import { NoticeListResponseDto } from '../../notice/dto/notice.dto';
import { OpportunityChangeSignalsResponseDto } from '../../signals/dto/opportunity-change-signals.response.dto';
import { SourceFreshnessSignalsResponseDto } from '../../signals/dto/source-freshness-signals.response.dto';
import { UpcomingOpportunitySignalsResponseDto } from '../../signals/dto/upcoming-opportunity-signals.response.dto';

class TodayWorkspaceOverviewDto {
  @ApiProperty()
  staleSources: number;

  @ApiProperty()
  missingSources: number;

  @ApiProperty()
  opportunityChanges: number;

  @ApiProperty()
  upcomingOpportunities: number;

  @ApiProperty()
  latestContentItems: number;

  @ApiProperty()
  latestNoticeItems: number;

  @ApiProperty()
  institutionOpportunityItems: number;
}

class TodayWorkspaceSectionsDto {
  @ApiProperty({ type: SourceFreshnessSignalsResponseDto })
  freshness: SourceFreshnessSignalsResponseDto;

  @ApiProperty({ type: OpportunityChangeSignalsResponseDto })
  opportunityChanges: OpportunityChangeSignalsResponseDto;

  @ApiProperty({ type: UpcomingOpportunitySignalsResponseDto })
  upcomingOpportunities: UpcomingOpportunitySignalsResponseDto;

  @ApiProperty({ type: BlogResponseDto })
  latestContent: BlogResponseDto;

  @ApiProperty({ type: NoticeListResponseDto })
  latestNotices: NoticeListResponseDto;

  @ApiProperty({ type: InstitutionOpportunitiesResponseDto })
  institutionOpportunities: InstitutionOpportunitiesResponseDto;
}

export class TodayWorkspaceResponseDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;

  @ApiProperty({ type: TodayWorkspaceOverviewDto })
  overview: TodayWorkspaceOverviewDto;

  @ApiProperty({ type: TodayWorkspaceSectionsDto })
  sections: TodayWorkspaceSectionsDto;
}
