import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { COMPANY_ENUM } from '../../jobs/constants/job-codes.constant';
import { CompanyType } from '../../jobs/interfaces/job-posting.interface';

export class GetRadarWorkspaceQueryDto {
  @ApiPropertyOptional({
    description: '회사 필터',
    enum: Object.values(COMPANY_ENUM),
  })
  @IsOptional()
  @IsIn(Object.values(COMPANY_ENUM))
  company?: CompanyType;

  @ApiPropertyOptional({
    description: 'stale/missing 소스 섹션 최대 개수',
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  sourceLimit?: number = 10;

  @ApiPropertyOptional({
    description: '변화 신호 섹션별 최대 개수',
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  changeLimit?: number = 10;

  @ApiPropertyOptional({
    description: '마감 임박 섹션 최대 개수',
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  deadlineLimit?: number = 10;

  @ApiPropertyOptional({
    description: '마감 임박 섹션에서 볼 일수 범위',
    default: 7,
    minimum: 1,
    maximum: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  deadlineWindowDays?: number = 7;
}
