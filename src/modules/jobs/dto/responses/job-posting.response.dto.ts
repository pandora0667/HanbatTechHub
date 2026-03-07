import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  CareerType,
  CompanyType,
  EmploymentType,
  LocationType,
} from '../../interfaces/job-posting.interface';

class RequirementsDto {
  @ApiProperty({ description: '경력 요건' })
  career: CareerType;

  @ApiProperty({ description: '학력 요건', required: false })
  education?: string;

  @ApiProperty({ description: '기술 스택', required: false, type: [String] })
  skills?: string[];
}

class PeriodDto {
  @ApiProperty({ description: '시작일' })
  @Type(() => Date)
  start: Date;

  @ApiProperty({ description: '마감일' })
  @Type(() => Date)
  end: Date;
}

class SourceDto {
  @ApiProperty({ description: '원본 ID' })
  originalId: string;

  @ApiProperty({ description: '원본 URL' })
  originalUrl: string;
}

export class JobPostingResponseDto {
  @ApiProperty({ description: '채용 공고 ID' })
  id: string;

  @ApiProperty({ description: '회사명' })
  company: CompanyType;

  @ApiProperty({ description: '채용 공고 제목' })
  title: string;

  @ApiProperty({ description: '부서' })
  department: string;

  @ApiProperty({ description: '분야' })
  field: string;

  @ApiProperty({ description: '자격 요건', type: RequirementsDto })
  requirements: RequirementsDto;

  @ApiProperty({ description: '고용 형태' })
  employmentType: EmploymentType;

  @ApiProperty({ description: '근무 지역', type: [String] })
  locations: LocationType[];

  @ApiProperty({ description: '채용 공고 설명', required: false })
  description?: string;

  @ApiProperty({ description: '자격 요건', required: false, type: [String] })
  qualifications?: string[];

  @ApiProperty({ description: '우대 사항', required: false, type: [String] })
  preferences?: string[];

  @ApiProperty({ description: '복리 후생', required: false, type: [String] })
  benefits?: string[];

  @ApiProperty({ description: '채용 기간', type: PeriodDto })
  period: PeriodDto;

  @ApiProperty({ description: '채용 공고 URL' })
  url: string;

  @ApiProperty({ description: '원본 정보', type: SourceDto })
  source: SourceDto;

  @ApiProperty({ description: '생성일' })
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  @Type(() => Date)
  updatedAt: Date;

  @ApiProperty({
    description: '회사별 특수 데이터',
    required: false,
    type: Object,
  })
  companySpecificData?: Record<string, any>;

  @ApiProperty({ description: '태그', required: false, type: [String] })
  tags?: string[];

  @ApiProperty({ description: '직군 분류', required: false })
  jobCategory?: string;

  @ApiProperty({ description: '직군 하위 분류', required: false })
  jobSubCategory?: string;
}
