import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { IJobCrawler, JobFilter } from '../interfaces/job-crawler.interface';
import { CompanyType, JobPosting } from '../interfaces/job-posting.interface';

export abstract class BaseCrawler implements IJobCrawler {
  protected readonly logger: Logger;

  abstract readonly company: CompanyType;
  abstract readonly baseUrl: string;
  abstract readonly jobCategories: Record<string, any>;

  constructor(
    protected readonly httpService: HttpService,
    protected readonly configService: ConfigService,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  abstract fetchJobs(filters?: JobFilter): Promise<JobPosting[]>;
  abstract parseJobData(rawData: any): JobPosting;

  isValidPosting(posting: JobPosting): boolean {
    const now = new Date();
    return now >= posting.period.start && now <= posting.period.end;
  }

  protected async fetchWithRetry<T>(
    url: string,
    options: any = {},
    retries = 3,
    delay = 1000,
  ): Promise<T> {
    try {
      const response = await lastValueFrom(
        this.httpService.get<T>(url, options),
      );
      return response.data;
    } catch (error) {
      if (retries > 0) {
        this.logger.warn(
          `Retrying request to ${url}, ${retries} attempts left`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry<T>(url, options, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  protected getHeaders(): Record<string, string> {
    return {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
    };
  }
}
