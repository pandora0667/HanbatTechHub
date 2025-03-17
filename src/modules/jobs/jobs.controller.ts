import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JobsService, PaginatedResponse } from './services/jobs.service';
import { GetJobsQueryDto } from './dto/requests/get-jobs-query.dto';
import { JobPostingResponseDto } from './dto/responses/job-posting.response.dto';
import { CompanyType } from './interfaces/job-posting.interface';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({ summary: '전체 기술 직군 채용 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '기술 직군 채용 정보 목록',
    type: JobPostingResponseDto,
    isArray: true,
  })
  async getTechJobs(
    @Query() query: GetJobsQueryDto,
  ): Promise<PaginatedResponse<JobPostingResponseDto>> {
    return this.jobsService.getTechJobs(query);
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
    @Param('company') company: CompanyType,
    @Query() query: GetJobsQueryDto,
  ): Promise<PaginatedResponse<JobPostingResponseDto>> {
    return this.jobsService.getCompanyTechJobs(company, query);
  }
}
