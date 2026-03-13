import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { COMPANY_ENUM } from '../../jobs/constants/job-codes.constant';
import { CompanyType } from '../../jobs/interfaces/job-posting.interface';

export class GetUpcomingOpportunitySignalsQueryDto {
  @ApiPropertyOptional({
    description: '회사 필터',
    enum: Object.values(COMPANY_ENUM),
  })
  @IsOptional()
  @IsIn(Object.values(COMPANY_ENUM))
  company?: CompanyType;

  @ApiPropertyOptional({
    description: '마감 임박 신호를 볼 일수 범위',
    default: 7,
    minimum: 1,
    maximum: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  days?: number = 7;

  @ApiPropertyOptional({
    description: '반환할 최대 신호 수',
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
