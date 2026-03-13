import { ApiProperty } from '@nestjs/swagger';

class SourceFreshnessSummaryDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  fresh: number;

  @ApiProperty()
  stale: number;

  @ApiProperty()
  missing: number;
}

class SourceFreshnessSignalDto {
  @ApiProperty()
  sourceId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  provider: string;

  @ApiProperty({
    enum: ['opportunity', 'company', 'content', 'institution'],
  })
  context: string;

  @ApiProperty({
    enum: ['api', 'feed', 'html', 'browser'],
  })
  collectionMode: string;

  @ApiProperty({
    enum: ['official_api', 'official_feed', 'public_page', 'browser_automation'],
  })
  tier: string;

  @ApiProperty({
    enum: ['fresh', 'stale', 'missing'],
  })
  status: string;

  @ApiProperty()
  maxCollectionsPerDay: number;

  @ApiProperty()
  confidence: number;

  @ApiProperty()
  collectionUrl: string;

  @ApiProperty({ required: false })
  collectedAt?: string;

  @ApiProperty({ required: false })
  staleAt?: string;

  @ApiProperty({ required: false })
  ageSeconds?: number;
}

export class SourceFreshnessSignalsResponseDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ type: SourceFreshnessSummaryDto })
  summary: SourceFreshnessSummaryDto;

  @ApiProperty({ type: [SourceFreshnessSignalDto] })
  signals: SourceFreshnessSignalDto[];
}
