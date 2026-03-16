import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { JOB_CRAWLING_CONFIG } from '../../constants/redis.constant';
import {
  JOB_CRAWLER_REGISTRY,
  JobCrawlerRegistry,
} from '../ports/job-crawler-registry';
import { CompanyType, JobPosting } from '../../interfaces/job-posting.interface';
import { JobCrawlerExecutionService } from './job-crawler-execution.service';
import { IJobCrawler } from '../../interfaces/job-crawler.interface';
import { SourceRuntimeRecorderService } from '../../../source-registry/application/services/source-runtime-recorder.service';
import { getJobSourceDescriptor } from '../../constants/job-source.constant';

@Injectable()
export class JobPostingCollectorService {
  private readonly logger = new Logger(JobPostingCollectorService.name);

  constructor(
    @Inject(JOB_CRAWLER_REGISTRY)
    private readonly jobCrawlerRegistry: JobCrawlerRegistry,
    private readonly jobCrawlerExecutionService: JobCrawlerExecutionService,
    private readonly sourceRuntimeRecorderService: SourceRuntimeRecorderService,
  ) {}

  async fetchCompanyJobs(company: CompanyType): Promise<JobPosting[]> {
    const crawler = this.requireCrawler(company);
    const sourceId = getJobSourceDescriptor(company).id;

    try {
      const jobs = await this.jobCrawlerExecutionService.executeWithRetry(
        () => crawler.fetchJobs(),
        `Fetching jobs for ${company}`,
      );
      await this.sourceRuntimeRecorderService.recordSuccess(sourceId);
      return jobs;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await this.sourceRuntimeRecorderService.recordFailure(
        sourceId,
        errorMessage,
      );
      throw error;
    }
  }

  async fetchAllJobs(options?: {
    company?: CompanyType;
    continueOnError?: boolean;
    coolDownBetweenRuns?: boolean;
  }): Promise<JobPosting[]> {
    const jobsByCompany = await this.fetchJobsByCompany(options);
    return jobsByCompany.flatMap(({ jobs }) => jobs);
  }

  async fetchJobsByCompany(options?: {
    company?: CompanyType;
    continueOnError?: boolean;
    coolDownBetweenRuns?: boolean;
  }): Promise<Array<{ company: CompanyType; jobs: JobPosting[] }>> {
    const crawlers = options?.company
      ? [this.requireCrawler(options.company)]
      : this.jobCrawlerRegistry.getAll();
    const results: Array<{ company: CompanyType; jobs: JobPosting[] }> = [];

    for (const [index, crawler] of crawlers.entries()) {
      const sourceId = getJobSourceDescriptor(crawler.company).id;
      try {
        const jobs = await this.jobCrawlerExecutionService.executeWithRetry(
          () => crawler.fetchJobs(),
          `Fetching jobs for ${crawler.company}`,
        );
        await this.sourceRuntimeRecorderService.recordSuccess(sourceId);
        results.push({ company: crawler.company, jobs });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        await this.sourceRuntimeRecorderService.recordFailure(
          sourceId,
          errorMessage,
        );
        if (!options?.continueOnError) {
          throw error;
        }

        this.logger.error(
          `Failed to fetch jobs for ${crawler.company}: ${errorMessage}`,
        );
      }

      if (options?.coolDownBetweenRuns && index < crawlers.length - 1) {
        await this.coolDownBetweenCrawlerRuns();
      }
    }

    return results;
  }

  private requireCrawler(company: CompanyType): IJobCrawler {
    const crawler = this.jobCrawlerRegistry.get(company);

    if (!crawler) {
      throw new NotFoundException(`Crawler not found for company: ${company}`);
    }

    return crawler;
  }

  private async coolDownBetweenCrawlerRuns(): Promise<void> {
    if (JOB_CRAWLING_CONFIG.REQUEST_DELAY <= 0) {
      return;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, JOB_CRAWLING_CONFIG.REQUEST_DELAY),
    );
  }
}
