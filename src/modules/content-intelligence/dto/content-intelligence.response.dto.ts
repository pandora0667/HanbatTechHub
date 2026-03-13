import { ApiProperty } from '@nestjs/swagger';
import { SnapshotDto } from '../../../common/dto/snapshot.dto';
import { SourceRegistryItemDto } from '../../source-registry/dto/source-registry-response.dto';

class ContentFeedItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  company: string;

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

class ContentFeedSummaryDto {
  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  companies: number;

  @ApiProperty()
  filtered: boolean;
}

class ContentFeedMetaDto {
  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  currentPage: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPreviousPage: boolean;

  @ApiProperty()
  limit: number;

  @ApiProperty({ required: false })
  company?: string;

  @ApiProperty({ required: false })
  keyword?: string;

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;
}

class ContentTrendItemDto {
  @ApiProperty()
  topic: string;

  @ApiProperty()
  mentions: number;

  @ApiProperty()
  companies: number;

  @ApiProperty({ type: [String] })
  sampleTitles: string[];
}

class ContentTrendSummaryDto {
  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  companies: number;

  @ApiProperty()
  windowDays: number;

  @ApiProperty()
  totalTopics: number;
}

export class ContentFeedResponseDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ type: ContentFeedSummaryDto })
  summary: ContentFeedSummaryDto;

  @ApiProperty({ type: ContentFeedMetaDto })
  meta: ContentFeedMetaDto;

  @ApiProperty({ type: [ContentFeedItemDto] })
  items: ContentFeedItemDto[];

  @ApiProperty({ type: [SourceRegistryItemDto] })
  sources: SourceRegistryItemDto[];
}

export class ContentTrendsResponseDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;

  @ApiProperty({ type: ContentTrendSummaryDto })
  summary: ContentTrendSummaryDto;

  @ApiProperty({ type: [ContentTrendItemDto] })
  trends: ContentTrendItemDto[];

  @ApiProperty({ type: [SourceRegistryItemDto] })
  sources: SourceRegistryItemDto[];
}
