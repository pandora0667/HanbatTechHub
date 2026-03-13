import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { COMPANY_ENUM } from '../jobs/constants/job-codes.constant';
import { CompanyType } from '../jobs/interfaces/job-posting.interface';
import { CompanyResearchResponseDto } from './dto/company-research.response.dto';
import { GetCompanyResearchQueryDto } from './dto/get-company-research-query.dto';
import { ResearchService } from './research.service';

@ApiTags('research')
@Controller('research')
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Get('companies/:company')
  @ApiOperation({
    summary: '회사별 deterministic research brief 조회',
  })
  @ApiParam({
    name: 'company',
    enum: Object.values(COMPANY_ENUM),
    description: '회사 코드',
  })
  @ApiResponse({
    status: 200,
    description: '회사별 리서치 브리프',
    type: CompanyResearchResponseDto,
  })
  async getCompanyResearch(
    @Param('company') company: CompanyType,
    @Query() query: GetCompanyResearchQueryDto,
  ): Promise<CompanyResearchResponseDto> {
    return this.researchService.getCompanyResearch(company, query);
  }
}
