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

  @ApiProperty()
  historyPoints: number;
}

class ContentTrendHistorySummaryDto {
  @ApiProperty()
  historyPoints: number;

  @ApiProperty()
  windowDays: number;

  @ApiProperty({ required: false })
  baselineCollectedAt?: string;

  @ApiProperty({ required: false })
  latestCollectedAt?: string;

  @ApiProperty()
  totalItemsDelta: number;

  @ApiProperty()
  topicsTrackedDelta: number;
}

class ContentTrendTimelinePointDto {
  @ApiProperty()
  collectedAt: string;

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  companies: number;

  @ApiProperty()
  topicsTracked: number;
}

class ContentTrendMomentumItemDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  currentCount: number;

  @ApiProperty()
  baselineCount: number;

  @ApiProperty()
  delta: number;

  @ApiProperty({ enum: ['up', 'down', 'flat'] })
  direction: 'up' | 'down' | 'flat';
}

class ContentTrendHistoryDto {
  @ApiProperty({ type: ContentTrendHistorySummaryDto })
  summary: ContentTrendHistorySummaryDto;

  @ApiProperty({ type: [ContentTrendTimelinePointDto] })
  timeline: ContentTrendTimelinePointDto[];

  @ApiProperty({ type: [ContentTrendMomentumItemDto] })
  companyMomentum: ContentTrendMomentumItemDto[];

  @ApiProperty({ type: [ContentTrendMomentumItemDto] })
  topicMomentum: ContentTrendMomentumItemDto[];
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

  @ApiProperty({ type: ContentTrendHistoryDto })
  history: ContentTrendHistoryDto;

  @ApiProperty({ type: [SourceRegistryItemDto] })
  sources: SourceRegistryItemDto[];
}
