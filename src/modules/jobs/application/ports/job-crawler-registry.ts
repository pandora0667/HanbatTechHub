import { CompanyType } from '../../interfaces/job-posting.interface';
import { IJobCrawler } from '../../interfaces/job-crawler.interface';

export const JOB_CRAWLER_REGISTRY = 'JOB_CRAWLER_REGISTRY';

export interface JobCrawlerRegistry {
  get(company: CompanyType): IJobCrawler | undefined;
  getAll(): IJobCrawler[];
  listCompanies(): CompanyType[];
}
