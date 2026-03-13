import { ApiProperty } from '@nestjs/swagger';
import {
  SourceCollectionMode,
  SourceContext,
  SourceTier,
} from '../../../common/types/snapshot.types';

export class SourceRegistryItemDto {
  @ApiProperty({ description: '소스 ID' })
  id: string;

  @ApiProperty({ description: '소스 이름' })
  name: string;

  @ApiProperty({ description: '제공자 이름' })
  provider: string;

  @ApiProperty({
    description: '도메인 컨텍스트',
    enum: ['opportunity', 'company', 'content', 'institution'],
  })
  context: SourceContext;

  @ApiProperty({
    description: '수집 방식',
    enum: ['api', 'feed', 'html', 'browser'],
  })
  collectionMode: SourceCollectionMode;

  @ApiProperty({
    description: '소스 등급',
    enum: ['official_api', 'official_feed', 'public_page', 'browser_automation'],
  })
  tier: SourceTier;

  @ApiProperty({ description: '활성화 여부' })
  active: boolean;

  @ApiProperty({ description: '실제 수집 URL' })
  collectionUrl: string;

  @ApiProperty({ description: '하루 최대 수집 횟수' })
  maxCollectionsPerDay: number;

  @ApiProperty({ description: 'freshness TTL(초)' })
  freshnessTtlSeconds: number;

  @ApiProperty({ description: '신뢰도(0-1)' })
  confidence: number;

  @ApiProperty({ description: '운영 메모', required: false })
  notes?: string;
}

export class SourceRegistryResponseDto {
  @ApiProperty({
    description: '등록된 외부 소스 목록',
    type: [SourceRegistryItemDto],
  })
  sources: SourceRegistryItemDto[];
}
