import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  CAREER_TYPE,
  COMPANY_ENUM,
  EMPLOYMENT_TYPE,
  LOCATION_TYPE,
} from '../../jobs/constants/job-codes.constant';
import {
  CareerType,
  CompanyType,
  EmploymentType,
  LocationType,
} from '../../jobs/interfaces/job-posting.interface';

export const OPPORTUNITY_SORT = {
  DEADLINE: 'deadline',
  UPDATED: 'updated',
} as const;

export type OpportunitySortType =
  (typeof OPPORTUNITY_SORT)[keyof typeof OPPORTUNITY_SORT];

function toBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  return undefined;
}

export class GetOpportunitiesQueryDto {
  @ApiPropertyOptional({
    description: '회사 코드 필터',
    enum: COMPANY_ENUM,
  })
  @IsOptional()
  @IsEnum(COMPANY_ENUM)
  company?: CompanyType;

  @ApiPropertyOptional({ description: '부서 필터' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: '분야 필터' })
  @IsOptional()
  @IsString()
  field?: string;

  @ApiPropertyOptional({
    description: '경력 구분 필터',
    enum: CAREER_TYPE,
  })
  @IsOptional()
  @IsEnum(CAREER_TYPE)
  career?: CareerType;

  @ApiPropertyOptional({
    description: '고용 형태 필터',
    enum: EMPLOYMENT_TYPE,
  })
  @IsOptional()
  @IsEnum(EMPLOYMENT_TYPE)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({
    description: '근무 지역 필터',
    enum: LOCATION_TYPE,
  })
  @IsOptional()
  @IsEnum(LOCATION_TYPE)
  location?: LocationType;

  @ApiPropertyOptional({ description: '검색어' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: '마감 임박 공고만 노출',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  onlyClosingSoon?: boolean = false;

  @ApiPropertyOptional({
    description: '변화 신호가 있는 공고만 노출',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  onlyChanged?: boolean = false;

  @ApiPropertyOptional({
    description: '정렬 기준',
    enum: Object.values(OPPORTUNITY_SORT),
    default: OPPORTUNITY_SORT.DEADLINE,
  })
  @IsOptional()
  @IsEnum(OPPORTUNITY_SORT)
  sort?: OpportunitySortType = OPPORTUNITY_SORT.DEADLINE;

  @ApiPropertyOptional({
    description: '마감 임박 판단 일수',
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
