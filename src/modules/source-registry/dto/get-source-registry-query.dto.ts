import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsIn, IsOptional } from 'class-validator';
import {
  SourceCollectionMode,
  SourceContext,
  SourceTier,
} from '../../../common/types/snapshot.types';

const SOURCE_CONTEXTS: SourceContext[] = [
  'opportunity',
  'company',
  'content',
  'institution',
];
const SOURCE_COLLECTION_MODES: SourceCollectionMode[] = [
  'api',
  'feed',
  'html',
  'browser',
];
const SOURCE_TIERS: SourceTier[] = [
  'official_api',
  'official_feed',
  'public_page',
  'browser_automation',
];

export class GetSourceRegistryQueryDto {
  @ApiPropertyOptional({
    description: '도메인 컨텍스트 필터',
    enum: SOURCE_CONTEXTS,
  })
  @IsOptional()
  @IsIn(SOURCE_CONTEXTS)
  context?: SourceContext;

  @ApiPropertyOptional({
    description: '수집 방식 필터',
    enum: SOURCE_COLLECTION_MODES,
  })
  @IsOptional()
  @IsIn(SOURCE_COLLECTION_MODES)
  collectionMode?: SourceCollectionMode;

  @ApiPropertyOptional({
    description: '소스 등급 필터',
    enum: SOURCE_TIERS,
  })
  @IsOptional()
  @IsIn(SOURCE_TIERS)
  tier?: SourceTier;

  @ApiPropertyOptional({
    description: '활성화 여부 필터',
    example: 'true',
  })
  @IsOptional()
  @IsBooleanString()
  active?: 'true' | 'false';
}
