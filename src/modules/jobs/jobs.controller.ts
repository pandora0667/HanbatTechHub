import { Controller, Get, Query, Param, ParseEnumPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JobsService, PaginatedResponse } from './services/jobs.service';
import { GetJobsQueryDto } from './dto/requests/get-jobs-query.dto';
import { JobPostingResponseDto } from './dto/responses/job-posting.response.dto';
import { SupportedCompaniesResponseDto } from './dto/responses/supported-companies.response.dto';
import { CompanyType } from './interfaces/job-posting.interface';
import { COMPANY_ENUM } from './constants/job-codes.constant';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({ summary: '지원하는 회사 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '지원하는 회사 목록',
    type: SupportedCompaniesResponseDto,
  })
  async getSupportedCompanies(): Promise<SupportedCompaniesResponseDto> {
    return this.jobsService.getSupportedCompanies();
  }

  @Get(':company')
  @ApiOperation({ summary: '특정 회사의 기술 직군 채용 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '특정 회사의 기술 직군 채용 정보 목록',
    type: JobPostingResponseDto,
    isArray: true,
  })
  async getCompanyTechJobs(
    @Param('company', new ParseEnumPipe(COMPANY_ENUM)) company: CompanyType,
    @Query() query: GetJobsQueryDto,
  ): Promise<PaginatedResponse<JobPostingResponseDto>> {
    return this.jobsService.getCompanyTechJobs(company, query);
  }
}
