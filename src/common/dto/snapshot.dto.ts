import { ApiProperty } from '@nestjs/swagger';

export class SnapshotDto {
  @ApiProperty({ description: '내부 스냅샷 수집 시각' })
  collectedAt: string;

  @ApiProperty({ description: '스냅샷이 stale 상태가 되는 시각' })
  staleAt: string;

  @ApiProperty({ description: '스냅샷 TTL(초)' })
  ttlSeconds: number;

  @ApiProperty({ description: '소스 신뢰도(0-1)' })
  confidence: number;

  @ApiProperty({ description: '스냅샷을 구성한 소스 ID', type: [String] })
  sourceIds: string[];
}
