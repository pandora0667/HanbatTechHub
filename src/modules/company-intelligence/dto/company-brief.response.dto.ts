import { ApiProperty } from '@nestjs/swagger';
import { SnapshotDto } from '../../../common/dto/snapshot.dto';
import { SourceRegistryItemDto } from '../../source-registry/dto/source-registry-response.dto';
import { OpportunityChangeSignalsResponseDto } from '../../signals/dto/opportunity-change-signals.response.dto';
import { UpcomingOpportunitySignalsResponseDto } from '../../signals/dto/upcoming-opportunity-signals.response.dto';

class CompanyBriefJobDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  department: string;

  @ApiProperty()
  field: string;

  @ApiProperty({ type: [String] })
  locations: string[];

  @ApiProperty()
  deadline: string;

  @ApiProperty()
  url: string;
}

class CompanyBriefContentItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  link: string;

  @ApiProperty({ required: false })
  author?: string;

  @ApiProperty()
  publishDate: string;
}

class CompanyBriefIdentityDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  provider: string;
}

class CompanyBriefOverviewDto {
  @ApiProperty()
  openJobs: number;

  @ApiProperty()
  newJobs: number;

  @ApiProperty()
  updatedJobs: number;

  @ApiProperty()
  removedJobs: number;

  @ApiProperty()
  closingSoonJobs: number;

  @ApiProperty()
  latestContentItems: number;
}

class CompanyBriefContentSectionDto {
  @ApiProperty()
  available: boolean;

  @ApiProperty({ type: [CompanyBriefContentItemDto] })
  items: CompanyBriefContentItemDto[];

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;
}

class CompanyBriefJobsSectionDto {
  @ApiProperty({ type: [CompanyBriefJobDto] })
  items: CompanyBriefJobDto[];

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;
}

class CompanyBriefSectionsDto {
  @ApiProperty({ type: CompanyBriefJobsSectionDto })
  jobs: CompanyBriefJobsSectionDto;

  @ApiProperty({ type: CompanyBriefContentSectionDto })
  latestContent: CompanyBriefContentSectionDto;

  @ApiProperty({ type: OpportunityChangeSignalsResponseDto })
  recentChanges: OpportunityChangeSignalsResponseDto;

  @ApiProperty({ type: UpcomingOpportunitySignalsResponseDto })
  upcomingDeadlines: UpcomingOpportunitySignalsResponseDto;

  @ApiProperty({ type: [SourceRegistryItemDto] })
  sources: SourceRegistryItemDto[];
}

export class CompanyBriefResponseDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ type: CompanyBriefIdentityDto })
  company: CompanyBriefIdentityDto;

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;

  @ApiProperty({ type: CompanyBriefOverviewDto })
  overview: CompanyBriefOverviewDto;

  @ApiProperty({ type: CompanyBriefSectionsDto })
  sections: CompanyBriefSectionsDto;
}
