import { Controller, Get, Param, ParseEnumPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { COMPANY_ENUM } from '../jobs/constants/job-codes.constant';
import { CompanyType } from '../jobs/interfaces/job-posting.interface';
import { CompanyIntelligenceService } from './company-intelligence.service';
import { GetCompanyBriefQueryDto } from './dto/get-company-brief-query.dto';
import { CompanyBriefResponseDto } from './dto/company-brief.response.dto';

@ApiTags('companies')
@Controller('companies')
export class CompanyIntelligenceController {
  constructor(
    private readonly companyIntelligenceService: CompanyIntelligenceService,
  ) {}

  @Get(':company/brief')
  @ApiOperation({
    summary: '회사별 채용·콘텐츠·변화 신호 브리프 조회',
  })
  @ApiResponse({
    status: 200,
    description: '내부 스냅샷 기반 회사 브리프',
    type: CompanyBriefResponseDto,
  })
  async getCompanyBrief(
    @Param('company', new ParseEnumPipe(COMPANY_ENUM)) company: CompanyType,
    @Query() query: GetCompanyBriefQueryDto,
  ): Promise<CompanyBriefResponseDto> {
    return this.companyIntelligenceService.getCompanyBrief(company, query);
  }
}
