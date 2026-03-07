import { Inject, Injectable } from '@nestjs/common';
import { CRAWLER_TOKEN } from '../../crawlers';
import { IJobCrawler } from '../../interfaces/job-crawler.interface';
import { CompanyType } from '../../interfaces/job-posting.interface';
import { JobCrawlerRegistry } from '../../application/ports/job-crawler-registry';

@Injectable()
export class JobCrawlerRegistryService implements JobCrawlerRegistry {
  private readonly crawlers: Map<CompanyType, IJobCrawler>;

  constructor(
    @Inject(CRAWLER_TOKEN) private readonly jobCrawlers: IJobCrawler[],
  ) {
    this.crawlers = new Map(
      jobCrawlers.map((crawler) => [crawler.company, crawler]),
    );
  }

  get(company: CompanyType): IJobCrawler | undefined {
    return this.crawlers.get(company);
  }

  getAll(): IJobCrawler[] {
    return Array.from(this.crawlers.values());
  }

  listCompanies(): CompanyType[] {
    return Array.from(this.crawlers.keys());
  }
}
