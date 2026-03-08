import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseJobCrawler } from './base-job.crawler';
import {
  JobPosting,
  LocationType,
  EmploymentType,
} from '../interfaces/job-posting.interface';
import {
  COMPANY_ENUM,
  CAREER_TYPE,
  EMPLOYMENT_TYPE,
  LOCATION_TYPE,
} from '../constants/job-codes.constant';
import { JobSearchQuery } from '../domain/types/job-search-query.type';
import { HttpClientUtil } from '../utils/http-client.util';

interface LinePageDataResponse {
  result?: {
    data?: {
      allStrapiJobs?: {
        edges?: Array<{
          node: LineJobNode;
        }>;
      };
    };
  };
}

interface LineJobNode {
  strapiId: number;
  publish?: boolean;
  is_public?: boolean;
  is_filters_public?: boolean;
  until_filled?: boolean;
  start_date?: string;
  end_date?: string;
  title?: string;
  title_en?: string;
  employment_type?: Array<{
    name: string;
  }>;
  job_unit?: Array<{
    name: string;
  }>;
  job_fields?: Array<{
    name: string;
  }>;
  companies?: Array<{
    name: string;
  }>;
  cities?: Array<{
    name: string;
  }>;
  regions?: Array<{
    name: string;
  }>;
}

@Injectable()
export class LineCrawler extends BaseJobCrawler {
  protected readonly logger = new Logger(LineCrawler.name);
  private static readonly PAGE_DATA_URL =
    'https://careers.linecorp.com/page-data/ko/jobs/page-data.json';
  private static readonly TARGET_DEPARTMENT = 'Engineering';
  private static readonly TARGET_REGION = 'East Asia';
  private static readonly TARGET_CITIES = ['Gwacheon', 'Bundang'];

  constructor(
    protected readonly httpClient: HttpClientUtil,
    protected readonly configService: ConfigService,
  ) {
    super(
      COMPANY_ENUM.LINE,
      httpClient,
      'https://careers.linecorp.com/ko/jobs',
    );
  }

  async fetchJobs(_query?: JobSearchQuery): Promise<JobPosting[]> {
    this.logger.debug('Starting to fetch LINE jobs...');

    try {
      const url = this.buildUrl();
      this.logger.debug(`Fetching jobs from: ${url}`);

      const response = await this.httpClient.get<LinePageDataResponse>(url, {
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
          'User-Agent': this.httpClient.getRandomUserAgent(),
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      const jobs = this.parseJobListings(response);

      if (jobs.length === 0) {
        this.logger.warn('No jobs found in LINE page-data response');
      } else {
        this.logger.debug(`Successfully parsed ${jobs.length} LINE jobs`);
      }

      return jobs;
    } catch (error) {
      this.handleError('Failed to fetch LINE jobs', error);
      return [];
    }
  }

  private buildUrl(): string {
    const params = new URLSearchParams({
      ca: LineCrawler.TARGET_DEPARTMENT,
      ci: LineCrawler.TARGET_CITIES.join(','),
      co: LineCrawler.TARGET_REGION,
    });

    const url = `${LineCrawler.PAGE_DATA_URL}?${params.toString()}`;
    this.logger.debug(`Built URL: ${url}`);
    return url;
  }

  private parseJobListings(response: LinePageDataResponse): JobPosting[] {
    try {
      const edges = response.result?.data?.allStrapiJobs?.edges ?? [];
      const jobs = edges
        .map((edge) => edge.node)
        .filter((job): job is LineJobNode => Boolean(job))
        .filter((job) => this.isTargetJob(job))
        .map((job) => this.transformJob(job))
        .filter((job): job is JobPosting => job !== null);

      this.logger.debug(`Parsed ${jobs.length} engineering jobs from LINE`);
      return jobs;
    } catch (err) {
      this.handleError('Failed to parse job listings', err);
      return [];
    }
  }

  private isTargetJob(job: LineJobNode): boolean {
    const isPublic = Boolean(
      job.publish && job.is_public && job.is_filters_public,
    );
    const hasEngineeringUnit = (job.job_unit ?? []).some(({ name }) =>
      name.includes(LineCrawler.TARGET_DEPARTMENT),
    );
    const hasTargetRegion = (job.regions ?? []).some(
      ({ name }) => name === LineCrawler.TARGET_REGION,
    );
    const hasTargetCity = (job.cities ?? []).some(({ name }) =>
      LineCrawler.TARGET_CITIES.includes(name),
    );

    return isPublic && hasEngineeringUnit && hasTargetRegion && hasTargetCity;
  }

  private transformJob(job: LineJobNode): JobPosting | null {
    const id = String(job.strapiId);
    const title = job.title_en?.trim() || job.title?.trim() || '';
    const departments = (job.job_unit ?? [])
      .map(({ name }) => name.trim())
      .filter(Boolean);
    const fields = (job.job_fields ?? [])
      .map(({ name }) => name.trim())
      .filter(Boolean);
    const companyNames = (job.companies ?? [])
      .map(({ name }) => name.trim())
      .filter(Boolean);
    const cities = (job.cities ?? [])
      .map(({ name }) => name.trim())
      .filter(Boolean);
    const employmentType = this.mapEmploymentType(
      job.employment_type?.[0]?.name ?? '',
    );
    const locations = cities
      .map((city) => this.mapLocationType(city))
      .filter((location, index, values) => values.indexOf(location) === index);
    const startDate = job.start_date ? new Date(job.start_date) : new Date();
    const endDate = this.parseEndDate(job);
    const department =
      departments.find((name) =>
        name.includes(LineCrawler.TARGET_DEPARTMENT),
      ) ?? departments.join(', ');
    const field = fields.join(', ') || department;

    const jobTemplate = this.createJobPostingTemplate();
    const now = new Date();
    const posting: JobPosting = {
      ...jobTemplate,
      id,
      title,
      company: this.company,
      department,
      field,
      requirements: {
        ...jobTemplate.requirements,
        career: CAREER_TYPE.ANY,
        skills: fields,
      },
      employmentType,
      locations,
      description: companyNames.join(', '),
      period: {
        start: startDate,
        end: endDate,
      },
      url: this.getJobDetailUrl(id),
      source: {
        originalId: id,
        originalUrl: this.getJobDetailUrl(id),
      },
      createdAt: jobTemplate.createdAt ?? now,
      updatedAt: jobTemplate.updatedAt ?? now,
      tags: [...departments, ...fields, ...companyNames],
      jobCategory: this.inferJobCategory(title, field),
      rawData: job,
    };

    return this.validateJob(posting) ? posting : null;
  }

  private parseEndDate(job: LineJobNode): Date {
    if (job.until_filled) {
      return new Date('2099-12-31T00:00:00.000Z');
    }

    if (job.end_date) {
      const parsed = new Date(job.end_date);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return this.getDateMonthLater(1);
  }

  private mapEmploymentType(type: string): EmploymentType {
    if (type.includes('Intern')) {
      return EMPLOYMENT_TYPE.INTERN;
    }

    if (type.includes('Temporary') || type.includes('Contract')) {
      return EMPLOYMENT_TYPE.CONTRACT;
    }

    return EMPLOYMENT_TYPE.FULL_TIME;
  }

  private mapLocationType(location: string): LocationType {
    switch (location) {
      case 'Bundang':
      case 'Gwacheon':
        return LOCATION_TYPE.BUNDANG;
      case 'Seoul':
        return LOCATION_TYPE.SEOUL;
      default:
        return LOCATION_TYPE.GLOBAL;
    }
  }

  getJobDetailUrl(jobId: string): string {
    return `${this.baseUrl}/${jobId}`;
  }
}
