import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsEnum,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  INSTITUTION_OPPORTUNITY_DISCOVERY_MODES,
  INSTITUTION_OPPORTUNITY_SERVICE_TYPES,
  InstitutionOpportunityDiscoveryMode,
} from '../constants/institution-opportunity.constant';
import { INSTITUTION_ENUM, InstitutionType } from '../constants/institution-registry.constant';
import { InstitutionServiceType } from '../constants/institution-service-type.enum';

export class GetInstitutionOpportunitiesQueryDto {
  @ApiPropertyOptional({
    description: '서비스 타입 필터',
    enum: INSTITUTION_OPPORTUNITY_SERVICE_TYPES,
  })
  @IsOptional()
  @IsIn(INSTITUTION_OPPORTUNITY_SERVICE_TYPES)
  serviceType?: InstitutionServiceType;

  @ApiPropertyOptional({ description: '검색어' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: '페이지 번호',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지당 항목 수',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class GetInstitutionOpportunityBoardQueryDto extends GetInstitutionOpportunitiesQueryDto {
  @ApiPropertyOptional({
    description: 'institution 필터(csv)',
    example: 'HANBAT,SNU,INU',
  })
  @IsOptional()
  @IsString()
  institutions?: string;

  @ApiPropertyOptional({
    description: 'rollout wave 필터',
    enum: [1, 2, 3],
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2, 3])
  rolloutWave?: 1 | 2 | 3;

  @ApiPropertyOptional({
    description: 'region substring 필터',
  })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({
    description: 'discovery mode 필터',
    enum: Object.values(INSTITUTION_OPPORTUNITY_DISCOVERY_MODES),
  })
  @IsOptional()
  @IsEnum(INSTITUTION_OPPORTUNITY_DISCOVERY_MODES)
  mode?: InstitutionOpportunityDiscoveryMode;
}

export function parseInstitutionFilter(
  institutions?: string,
): InstitutionType[] | undefined {
  if (!institutions) {
    return undefined;
  }

  const parsed = institutions
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter((value): value is InstitutionType =>
      Object.values(INSTITUTION_ENUM).includes(value as InstitutionType),
    );

  return parsed.length > 0 ? parsed : undefined;
}
