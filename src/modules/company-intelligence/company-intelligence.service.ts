import { Injectable } from '@nestjs/common';
import { CompanyType } from '../jobs/interfaces/job-posting.interface';
import { GetCompanyBriefUseCase } from './application/use-cases/get-company-brief.use-case';
import { GetCompanyBriefQueryDto } from './dto/get-company-brief-query.dto';
import { CompanyBriefResponseDto } from './dto/company-brief.response.dto';

@Injectable()
export class CompanyIntelligenceService {
  constructor(
    private readonly getCompanyBriefUseCase: GetCompanyBriefUseCase,
  ) {}

  async getCompanyBrief(
    company: CompanyType,
    query: GetCompanyBriefQueryDto,
  ): Promise<CompanyBriefResponseDto> {
    return this.getCompanyBriefUseCase.execute(company, query);
  }
}
