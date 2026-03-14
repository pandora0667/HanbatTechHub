import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  INSTITUTION_OPPORTUNITY_DISCOVERY_MODES,
  INSTITUTION_OPPORTUNITY_SERVICE_TYPES,
  InstitutionOpportunityDiscoveryMode,
} from '../../institution-intelligence/constants/institution-opportunity.constant';
import { InstitutionServiceType } from '../../institution-intelligence/constants/institution-service-type.enum';
import { InstitutionOpportunityChangeType } from '../domain/models/institution-opportunity-change-signal.model';

export class GetInstitutionOpportunityChangeSignalsQueryDto {
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
    description: 'service type 필터',
    enum: INSTITUTION_OPPORTUNITY_SERVICE_TYPES,
  })
  @IsOptional()
  @IsIn(INSTITUTION_OPPORTUNITY_SERVICE_TYPES)
  serviceType?: InstitutionServiceType;

  @ApiPropertyOptional({
    description: 'change type 필터',
    enum: ['new', 'updated', 'removed'],
  })
  @IsOptional()
  @IsIn(['new', 'updated', 'removed'])
  changeType?: InstitutionOpportunityChangeType;

  @ApiPropertyOptional({
    description: '현재 discovery mode 필터',
    enum: Object.values(INSTITUTION_OPPORTUNITY_DISCOVERY_MODES),
  })
  @IsOptional()
  @IsEnum(INSTITUTION_OPPORTUNITY_DISCOVERY_MODES)
  mode?: InstitutionOpportunityDiscoveryMode;

  @ApiPropertyOptional({
    description: '최대 반환 개수',
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
