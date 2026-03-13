import { Injectable } from '@nestjs/common';
import { GetCompanyCompareUseCase } from './application/use-cases/get-company-compare.use-case';
import { GetCompanyCompareQueryDto } from './dto/get-company-compare-query.dto';
import { CompanyCompareResponseDto } from './dto/company-compare.response.dto';

@Injectable()
export class CompareService {
  constructor(
    private readonly getCompanyCompareUseCase: GetCompanyCompareUseCase,
  ) {}

  async compareCompanies(
    query: GetCompanyCompareQueryDto,
  ): Promise<CompanyCompareResponseDto> {
    return this.getCompanyCompareUseCase.execute(query);
  }
}
