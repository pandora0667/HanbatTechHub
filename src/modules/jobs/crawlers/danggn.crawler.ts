import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseJobCrawler } from './base-job.crawler';
import { GetJobsQueryDto } from '../dto/requests/get-jobs-query.dto';
import { JobPosting } from '../interfaces/job-posting.interface';
import {
  COMPANY_ENUM,
  CAREER_TYPE,
  EMPLOYMENT_TYPE,
  LOCATION_TYPE,
} from '../constants/job-codes.constant';
import { HttpClientUtil } from '../utils/http-client.util';
import * as cheerio from 'cheerio';

@Injectable()
export class DanggnCrawler extends BaseJobCrawler {
  protected readonly logger = new Logger(DanggnCrawler.name);
  public readonly baseUrl = 'https://about.daangn.com/jobs';

  constructor(
    protected readonly httpClient: HttpClientUtil,
    protected readonly configService: ConfigService,
  ) {
    super(COMPANY_ENUM.DANGGN, httpClient, 'https://about.daangn.com/jobs');
  }

  async fetchJobs(_query?: GetJobsQueryDto): Promise<JobPosting[]> {
    this.logger.debug('Starting to fetch Danggn jobs...');

    try {
      const url = this.buildUrl(_query);
      this.logger.debug(`Fetching jobs from: ${url}`);

      const response = await this.httpClient.get(url, {
        headers: {
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
          'User-Agent': this.httpClient.getRandomUserAgent(),
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (!response || typeof response !== 'string') {
        throw new Error('Invalid response data');
      }

      this.logger.debug('Response received, length:', response.length);

      // HTML 파싱
      const jobs = this.parseJobListings(response);

      if (jobs.length === 0) {
        this.logger.warn('No jobs found in the parsed HTML');
      } else {
        this.logger.debug(`Successfully parsed ${jobs.length} jobs`);
      }

      return jobs;
    } catch (error) {
      this.handleError('Failed to fetch Danggn jobs', error);
      return [];
    }
  }

  private buildUrl(_query?: GetJobsQueryDto): string {
    return this.baseUrl;
  }

  private parseJobListings(html: string): JobPosting[] {
    try {
      const $ = cheerio.load(html);
      const jobs: JobPosting[] = [];

      $('.c-deAcZv').each((_, element) => {
        const $el = $(element);
        const title = $el.find('.c-boyXyq').text().trim();
        const employmentType = $el.find('.c-kolfYf').last().text().trim();
        const url = $el.find('a').attr('href');

        // IT 직군 필터링
        if (
          title.includes('Software Engineer') ||
          title.includes('Security Engineer') ||
          title.includes('Site Reliability Engineer') ||
          title.includes('Test Automation Engineer') ||
          title.includes('Application Security Engineer') ||
          title.includes('Information Security Manager')
        ) {
          const jobId = url?.split('/').filter(Boolean).pop() || '';
          const jobUrl = url ? `${this.baseUrl}${url}` : this.baseUrl;
          const job: JobPosting = {
            id: jobId,
            company: this.company,
            title,
            department: this.extractDepartment(title),
            field: this.extractField(title),
            requirements: {
              career: CAREER_TYPE.ANY,
              skills: this.extractSkills(title),
            },
            employmentType: this.mapEmploymentType(employmentType),
            locations: [LOCATION_TYPE.SEOUL],
            period: {
              start: new Date(),
              end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
            },
            url: jobUrl,
            source: {
              originalId: jobId,
              originalUrl: jobUrl,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: [],
            jobCategory: this.extractJobCategory(title),
          };

          jobs.push(job);
        }
      });

      return jobs;
    } catch (err) {
      this.handleError('Failed to parse job listings', err);
      return [];
    }
  }

  private extractDepartment(title: string): string {
    if (title.includes('당근페이')) {
      return '당근페이';
    }
    return '당근';
  }

  private extractField(title: string): string {
    if (title.includes('Frontend')) return 'Frontend';
    if (title.includes('Backend')) return 'Backend';
    if (title.includes('Android')) return 'Android';
    if (title.includes('iOS')) return 'iOS';
    if (title.includes('Security')) return 'Security';
    if (title.includes('Site Reliability')) return 'Infrastructure';
    if (title.includes('Test Automation')) return 'QA';
    if (title.includes('Data')) return 'Data';
    if (title.includes('Machine Learning')) return 'ML';
    return 'Engineering';
  }

  private extractSkills(title: string): string[] {
    const skills: string[] = [];
    if (title.includes('Kotlin')) skills.push('Kotlin');
    if (title.includes('Android')) skills.push('Android');
    if (title.includes('iOS')) skills.push('iOS');
    if (title.includes('Frontend')) skills.push('Frontend');
    if (title.includes('Backend')) skills.push('Backend');
    if (title.includes('Security')) skills.push('Security');
    if (title.includes('Site Reliability')) skills.push('Infrastructure');
    if (title.includes('Test Automation')) skills.push('QA');
    if (title.includes('Data')) skills.push('Data');
    if (title.includes('Machine Learning')) skills.push('ML');
    return skills;
  }

  private mapEmploymentType(
    type: string,
  ): (typeof EMPLOYMENT_TYPE)[keyof typeof EMPLOYMENT_TYPE] {
    switch (type) {
      case '정규직':
        return EMPLOYMENT_TYPE.FULL_TIME;
      case '계약직':
        return EMPLOYMENT_TYPE.CONTRACT;
      case '인턴':
        return EMPLOYMENT_TYPE.INTERN;
      default:
        return EMPLOYMENT_TYPE.FULL_TIME;
    }
  }

  private extractJobCategory(title: string): string {
    if (title.includes('Frontend')) return 'Frontend';
    if (title.includes('Backend')) return 'Backend';
    if (title.includes('Android')) return 'Mobile';
    if (title.includes('iOS')) return 'Mobile';
    if (title.includes('Security')) return 'Security';
    if (title.includes('Site Reliability')) return 'Infrastructure';
    if (title.includes('Test Automation')) return 'QA';
    if (title.includes('Data')) return 'Data';
    if (title.includes('Machine Learning')) return 'ML';
    return 'Engineering';
  }

  getJobDetailUrl(jobId: string): string {
    return `${this.baseUrl}/${jobId}`;
  }
}
