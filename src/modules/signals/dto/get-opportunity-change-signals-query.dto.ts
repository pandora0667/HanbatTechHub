import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { COMPANY_ENUM } from '../../jobs/constants/job-codes.constant';
import { JobPostingChangeType } from '../../jobs/domain/models/job-posting-change.model';
import { CompanyType } from '../../jobs/interfaces/job-posting.interface';

const JOB_POSTING_CHANGE_TYPES: JobPostingChangeType[] = [
  'new',
  'updated',
  'removed',
];

export class GetOpportunityChangeSignalsQueryDto {
  @ApiPropertyOptional({
    description: '회사 필터',
    enum: Object.values(COMPANY_ENUM),
  })
  @IsOptional()
  @IsIn(Object.values(COMPANY_ENUM))
  company?: CompanyType;

  @ApiPropertyOptional({
    description: '변화 타입 필터',
    enum: JOB_POSTING_CHANGE_TYPES,
  })
  @IsOptional()
  @IsIn(JOB_POSTING_CHANGE_TYPES)
  changeType?: JobPostingChangeType;

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
