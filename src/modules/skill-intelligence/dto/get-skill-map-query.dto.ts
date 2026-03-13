import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { COMPANY_ENUM } from '../../jobs/constants/job-codes.constant';
import { CompanyType } from '../../jobs/interfaces/job-posting.interface';

export class GetSkillMapQueryDto {
  @ApiPropertyOptional({
    description: '회사 필터',
    enum: Object.values(COMPANY_ENUM),
  })
  @IsOptional()
  @IsIn(Object.values(COMPANY_ENUM))
  company?: CompanyType;

  @ApiPropertyOptional({
    description: '반환할 최대 기술 개수',
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

  @ApiPropertyOptional({
    description: '최소 등장 채용 수',
    default: 1,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  minDemand?: number = 1;

  @ApiPropertyOptional({
    description: '기술별 샘플 직무 수',
    default: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  sampleLimit?: number = 3;
}
