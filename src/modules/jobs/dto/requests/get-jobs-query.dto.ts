import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  CAREER_TYPE,
  EMPLOYMENT_TYPE,
  LOCATION_TYPE,
} from '../../constants/job-codes.constant';
import {
  CareerType,
  EmploymentType,
  LocationType,
} from '../../interfaces/job-posting.interface';

export class GetJobsQueryDto {
  @ApiProperty({ required: false, description: '부서 (예: Tech)' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ required: false, description: '분야 (예: Backend)' })
  @IsString()
  @IsOptional()
  field?: string;

  @ApiProperty({ required: false, enum: CAREER_TYPE, description: '경력 구분' })
  @IsEnum(CAREER_TYPE)
  @IsOptional()
  career?: CareerType;

  @ApiProperty({
    required: false,
    enum: EMPLOYMENT_TYPE,
    description: '고용 형태',
  })
  @IsEnum(EMPLOYMENT_TYPE)
  @IsOptional()
  employmentType?: EmploymentType;

  @ApiProperty({
    required: false,
    enum: LOCATION_TYPE,
    description: '근무 지역',
  })
  @IsEnum(LOCATION_TYPE)
  @IsOptional()
  location?: LocationType;

  @ApiProperty({ required: false, description: '검색어' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiProperty({ required: false, default: 1, description: '페이지 번호' })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    required: false,
    default: 10,
    description: '페이지당 항목 수',
  })
  @IsOptional()
  limit?: number = 10;
}
