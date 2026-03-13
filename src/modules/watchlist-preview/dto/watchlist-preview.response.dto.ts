import { ApiProperty } from '@nestjs/swagger';
import { SnapshotDto } from '../../../common/dto/snapshot.dto';
import { SourceRegistryItemDto } from '../../source-registry/dto/source-registry-response.dto';

class WatchlistSummaryDto {
  @ApiProperty()
  companiesTracked: number;

  @ApiProperty()
  skillsTracked: number;

  @ApiProperty()
  matchedOpportunities: number;

  @ApiProperty()
  matchedContent: number;

  @ApiProperty()
  changeSignals: number;

  @ApiProperty()
  deadlineSignals: number;
}

class WatchlistCompanyPreviewDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  openJobs: number;

  @ApiProperty()
  newJobs: number;

  @ApiProperty()
  closingSoonJobs: number;

  @ApiProperty()
  latestContentItems: number;
}

class WatchlistOpportunityPreviewDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  company: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  field: string;

  @ApiProperty({ type: [String] })
  skills: string[];

  @ApiProperty()
  deadline: string;

  @ApiProperty()
  url: string;
}

class WatchlistContentPreviewDto {
  @ApiProperty()
  company: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  link: string;

  @ApiProperty()
  publishDate: string;
}

class WatchlistSignalPreviewDto {
  @ApiProperty()
  company: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  emphasis: string;
}

class WatchlistMetaDto {
  @ApiProperty({ type: [String] })
  companies: string[];

  @ApiProperty({ type: [String] })
  skills: string[];

  @ApiProperty({ required: false })
  keyword?: string;
}

class WatchlistSectionsDto {
  @ApiProperty({ type: [WatchlistCompanyPreviewDto] })
  companies: WatchlistCompanyPreviewDto[];

  @ApiProperty({ type: [WatchlistOpportunityPreviewDto] })
  opportunities: WatchlistOpportunityPreviewDto[];

  @ApiProperty({ type: [WatchlistContentPreviewDto] })
  content: WatchlistContentPreviewDto[];

  @ApiProperty({ type: [WatchlistSignalPreviewDto] })
  recentChanges: WatchlistSignalPreviewDto[];

  @ApiProperty({ type: [WatchlistSignalPreviewDto] })
  upcomingDeadlines: WatchlistSignalPreviewDto[];
}

export class WatchlistPreviewResponseDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;

  @ApiProperty({ type: WatchlistSummaryDto })
  summary: WatchlistSummaryDto;

  @ApiProperty({ type: WatchlistMetaDto })
  meta: WatchlistMetaDto;

  @ApiProperty({ type: WatchlistSectionsDto })
  sections: WatchlistSectionsDto;

  @ApiProperty({ type: [SourceRegistryItemDto] })
  sources: SourceRegistryItemDto[];
}
