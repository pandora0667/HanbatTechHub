import { ApiProperty } from '@nestjs/swagger';
import { SourceCollectionMode, SourceContext, SourceRiskTier, SourceState, SourceTier } from '../../../common/types/snapshot.types';
import { SourceRuntimeStatus } from '../types/source-runtime.type';

class SourceHealthItemDto {
  @ApiProperty()
  sourceId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  provider: string;

  @ApiProperty({ enum: ['opportunity', 'company', 'content', 'institution'] })
  context: SourceContext;

  @ApiProperty({ enum: ['api', 'feed', 'html', 'browser'] })
  collectionMode: SourceCollectionMode;

  @ApiProperty({
    enum: ['official_api', 'official_feed', 'public_page', 'browser_automation'],
  })
  tier: SourceTier;

  @ApiProperty({ enum: ['active', 'paused', 'disabled'] })
  state: SourceState;

  @ApiProperty({ enum: ['low', 'medium', 'high'] })
  riskTier: SourceRiskTier;

  @ApiProperty()
  safeCollectionPolicy: string;

  @ApiProperty()
  maxCollectionsPerDay: number;

  @ApiProperty()
  minimumIntervalHours: number;

  @ApiProperty()
  confidence: number;

  @ApiProperty({ enum: ['active', 'paused', 'disabled'] })
  effectiveState: SourceState;

  @ApiProperty({ enum: ['unknown', 'healthy', 'degraded', 'failing'] })
  runtimeStatus: SourceRuntimeStatus;

  @ApiProperty({ enum: ['fresh', 'stale', 'missing'] })
  freshnessStatus: string;

  @ApiProperty({ required: false })
  lastSuccessAt?: string;

  @ApiProperty({ required: false, nullable: true })
  lastFailureAt?: string | null;

  @ApiProperty()
  failureCount: number;

  @ApiProperty()
  consecutiveFailures: number;

  @ApiProperty({ required: false })
  lastErrorMessage?: string;

  @ApiProperty({ required: false })
  nextEligibleCollectionAt?: string;
}

export class SourceHealthResponseDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ type: [SourceHealthItemDto] })
  sources: SourceHealthItemDto[];
}
