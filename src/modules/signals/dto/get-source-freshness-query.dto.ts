import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { GetSourceRegistryQueryDto } from '../../source-registry/dto/get-source-registry-query.dto';
import { SourceFreshnessStatus } from '../domain/models/source-freshness-signal.model';

const SOURCE_FRESHNESS_STATUSES: SourceFreshnessStatus[] = [
  'fresh',
  'stale',
  'missing',
];

export class GetSourceFreshnessQueryDto extends GetSourceRegistryQueryDto {
  @ApiPropertyOptional({
    description: 'freshness 상태 필터',
    enum: SOURCE_FRESHNESS_STATUSES,
  })
  @IsOptional()
  @IsIn(SOURCE_FRESHNESS_STATUSES)
  status?: SourceFreshnessStatus;
}
