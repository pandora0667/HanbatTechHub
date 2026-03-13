import { ApiProperty } from '@nestjs/swagger';
import { SnapshotDto } from '../../../common/dto/snapshot.dto';
import { SourceRegistryItemDto } from '../../source-registry/dto/source-registry-response.dto';

class InstitutionRegistryItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  region: string;

  @ApiProperty()
  audience: string;
}

class InstitutionNoticePreviewDto {
  @ApiProperty()
  nttId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  author: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  link: string;
}

class InstitutionMenuPreviewDto {
  @ApiProperty()
  date: string;

  @ApiProperty({ type: [String] })
  lunch: string[];

  @ApiProperty({ type: [String] })
  dinner: string[];
}

class InstitutionOverviewSummaryDto {
  @ApiProperty()
  regularNotices: number;

  @ApiProperty()
  newNotices: number;

  @ApiProperty()
  featuredNotices: number;

  @ApiProperty()
  todayNotices: number;

  @ApiProperty()
  weeklyMenus: number;

  @ApiProperty()
  lunchAvailableDays: number;

  @ApiProperty()
  dinnerAvailableDays: number;
}

class InstitutionOverviewSectionsDto {
  @ApiProperty({ type: [InstitutionNoticePreviewDto] })
  latestNotices: InstitutionNoticePreviewDto[];

  @ApiProperty({ type: [InstitutionNoticePreviewDto] })
  newNotices: InstitutionNoticePreviewDto[];

  @ApiProperty({ type: [InstitutionNoticePreviewDto] })
  featuredNotices: InstitutionNoticePreviewDto[];

  @ApiProperty({ type: [InstitutionMenuPreviewDto] })
  weeklyMenus: InstitutionMenuPreviewDto[];

  @ApiProperty({ type: [SourceRegistryItemDto] })
  sources: SourceRegistryItemDto[];
}

export class InstitutionRegistryResponseDto {
  @ApiProperty({ type: [InstitutionRegistryItemDto] })
  institutions: InstitutionRegistryItemDto[];
}

export class InstitutionOverviewResponseDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ type: InstitutionRegistryItemDto })
  institution: InstitutionRegistryItemDto;

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;

  @ApiProperty({ type: InstitutionOverviewSummaryDto })
  summary: InstitutionOverviewSummaryDto;

  @ApiProperty({ type: InstitutionOverviewSectionsDto })
  sections: InstitutionOverviewSectionsDto;
}
