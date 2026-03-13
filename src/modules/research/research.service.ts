import { Injectable } from '@nestjs/common';
import { CompanyType } from '../jobs/interfaces/job-posting.interface';
import { CompanyResearchResponseDto } from './dto/company-research.response.dto';
import { GetCompanyResearchQueryDto } from './dto/get-company-research-query.dto';
import { GetCompanyResearchUseCase } from './application/use-cases/get-company-research.use-case';

@Injectable()
export class ResearchService {
  constructor(
    private readonly getCompanyResearchUseCase: GetCompanyResearchUseCase,
  ) {}

  async getCompanyResearch(
    company: CompanyType,
    query: GetCompanyResearchQueryDto,
  ): Promise<CompanyResearchResponseDto> {
    return this.getCompanyResearchUseCase.execute(company, query);
  }
}
