import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { COMPANY_ENUM } from '../../jobs/constants/job-codes.constant';
import { CompanyType } from '../../jobs/interfaces/job-posting.interface';

function toStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => String(entry).split(','))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export class GetWatchlistPreviewQueryDto {
  @ApiPropertyOptional({
    description: '관심 회사 코드 목록',
    enum: Object.values(COMPANY_ENUM),
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @ArrayMaxSize(10)
  @IsEnum(COMPANY_ENUM, { each: true })
  companies?: CompanyType[];

  @ApiPropertyOptional({
    description: '관심 기술 목록',
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({
    description: '키워드 필터',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: '회사 brief 최대 개수',
    default: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  companyLimit?: number = 3;

  @ApiPropertyOptional({
    description: '기회 미리보기 최대 개수',
    default: 10,
    minimum: 1,
    maximum: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  opportunityLimit?: number = 10;

  @ApiPropertyOptional({
    description: '콘텐츠 미리보기 최대 개수',
    default: 6,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  contentLimit?: number = 6;

  @ApiPropertyOptional({
    description: '신호 미리보기 최대 개수',
    default: 6,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  signalLimit?: number = 6;

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
}
