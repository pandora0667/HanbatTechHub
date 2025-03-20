import { ApiProperty } from '@nestjs/swagger';
import { CompanyType } from '../../interfaces/job-posting.interface';

export class SupportedCompanyDto {
  @ApiProperty({ description: '회사 코드' })
  code: CompanyType;

  @ApiProperty({ description: '회사명' })
  name: string;
}

export class SupportedCompaniesResponseDto {
  @ApiProperty({
    description: '지원하는 회사 목록',
    type: [SupportedCompanyDto],
  })
  companies: SupportedCompanyDto[];
}
