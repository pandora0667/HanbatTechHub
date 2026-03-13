import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  Max,
  Min,
} from 'class-validator';
import { COMPANY_ENUM } from '../../jobs/constants/job-codes.constant';
import { CompanyType } from '../../jobs/interfaces/job-posting.interface';

function toCompanyArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => String(entry).split(','));
  }

  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export class GetCompanyCompareQueryDto {
  @ApiProperty({
    description: '비교할 회사 코드 목록',
    enum: Object.values(COMPANY_ENUM),
    isArray: true,
    example: ['NAVER', 'KAKAO'],
  })
  @Transform(({ value }) => toCompanyArray(value))
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @IsIn(Object.values(COMPANY_ENUM), { each: true })
  companies: CompanyType[];

  @ApiProperty({
    description: '회사별 대표 채용 공고 최대 개수',
    default: 3,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  jobLimit: number = 3;

  @ApiProperty({
    description: '회사별 대표 콘텐츠 최대 개수',
    default: 2,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  contentLimit: number = 2;

  @ApiProperty({
    description: '회사별 변화 신호 최대 개수',
    default: 5,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  changeLimit: number = 5;

  @ApiProperty({
    description: '회사별 마감 임박 채용 최대 개수',
    default: 3,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  deadlineLimit: number = 3;

  @ApiProperty({
    description: '마감 임박 판단 일수',
    default: 7,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  deadlineWindowDays: number = 7;

  @ApiProperty({
    description: '회사별 노출할 상위 기술 개수',
    default: 5,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  skillLimit: number = 5;

  @ApiProperty({
    description: '기술 수요 집계 최소 등장 횟수',
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  minSkillDemand: number = 1;
}
