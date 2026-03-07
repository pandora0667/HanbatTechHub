import { Inject, Injectable } from '@nestjs/common';
import { SupportedCompaniesResponseDto } from '../../dto/responses/supported-companies.response.dto';
import {
  JOB_CRAWLER_REGISTRY,
  JobCrawlerRegistry,
} from '../ports/job-crawler-registry';

@Injectable()
export class GetSupportedCompaniesUseCase {
  constructor(
    @Inject(JOB_CRAWLER_REGISTRY)
    private readonly jobCrawlerRegistry: JobCrawlerRegistry,
  ) {}

  execute(): SupportedCompaniesResponseDto {
    const companies = this.jobCrawlerRegistry.listCompanies().map((code) => ({
      code,
      name: code,
    }));

    return { companies };
  }
}
