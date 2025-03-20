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
  COUPANG_DEPARTMENTS,
} from '../constants/job-codes.constant';
import { HttpClientUtil } from '../utils/http-client.util';
import * as cheerio from 'cheerio';

@Injectable()
export class CoupangCrawler extends BaseJobCrawler {
  protected readonly logger = new Logger(CoupangCrawler.name);
  private readonly departments = Object.values(COUPANG_DEPARTMENTS);

  constructor(
    protected readonly httpClient: HttpClientUtil,
    protected readonly configService: ConfigService,
  ) {
    super(COMPANY_ENUM.COUPANG, httpClient, 'https://www.coupang.jobs/kr/jobs');
  }

  async fetchJobs(query?: GetJobsQueryDto): Promise<JobPosting[]> {
    this.logger.log('Starting to fetch Coupang jobs...');

    try {
      const url = this.buildUrl(query);
      this.logger.debug(`Fetching jobs from: ${url}`);

      const response = await this.httpClient.get(url, {
        headers: {
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
          'User-Agent': this.httpClient.getRandomUserAgent(),
        },
      });

      if (!response) {
        throw new Error('Empty response received from Coupang jobs API');
      }

      if (typeof response !== 'string') {
        throw new Error(`Invalid response type: ${typeof response}`);
      }

      const jobs = this.parseJobListings(response);
      this.logger.log(`Successfully fetched ${jobs.length} Coupang jobs`);
      return jobs;
    } catch (error) {
      this.handleError('Failed to fetch Coupang jobs', error);
      return [];
    }
  }

  private buildUrl(query?: GetJobsQueryDto): string {
    const params = new URLSearchParams({
      location: 'Seoul, South Korea',
      pagesize: '20',
      page: query?.page?.toString() || '1',
    });

    // 중복 department 추가 방지
    const uniqueDepartments = [...new Set(this.departments)];
    uniqueDepartments.forEach((dept) => {
      params.append('department', dept);
    });

    return `${this.baseUrl}?${params.toString()}`;
  }

  private parseJobListings(html: string): JobPosting[] {
    try {
      const $ = cheerio.load(html);
      const jobs: JobPosting[] = [];

      $('.card.card-job').each((_, element) => {
        try {
          const $job = $(element);
          const $title = $job.find('.card-title a');
          const id = $title.attr('href')?.split('/')[3];

          if (!id) {
            this.logger.warn('Job listing found without ID, skipping...');
            return;
          }

          const title = $title.text().trim();
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const location = $job.find('.job-meta li').text().trim();
          const postedDate = $job.find('.job-meta time').attr('datetime');

          const jobTemplate = this.createJobPostingTemplate();
          const job: JobPosting = {
            ...jobTemplate,
            id,
            title,
            company: this.company,
            department: this.inferDepartment(title),
            field: this.inferDepartment(title),
            requirements: {
              ...jobTemplate.requirements,
              career: CAREER_TYPE.ANY,
              skills: this.extractSkills(title, ''), // 상세 페이지에서 description 가져오기 필요
            },
            employmentType: this.inferEmploymentType(title),
            locations: [LOCATION_TYPE.SEOUL],
            period: {
              start: postedDate ? new Date(postedDate) : new Date(),
              end: this.getDateMonthLater(1),
            },
            url: this.getJobDetailUrl(id),
            source: {
              originalId: id,
              originalUrl: this.getJobDetailUrl(id),
            },
            jobCategory: this.inferJobCategory(title),
          } as JobPosting;

          if (this.validateJob(job)) {
            jobs.push(job);
          }
        } catch (err) {
          this.logger.warn(
            `Failed to parse individual job listing: ${err.message}`,
          );
        }
      });

      return jobs;
    } catch (err) {
      this.handleError('Failed to parse job listings', err);
      return [];
    }
  }

  private inferDepartment(title: string): string {
    const titleLower = title.toLowerCase();

    // 부서 매핑 정의
    const departmentMapping = {
      cloud: COUPANG_DEPARTMENTS.CLOUD_PLATFORM,
      infra: COUPANG_DEPARTMENTS.CLOUD_PLATFORM,
      erp: COUPANG_DEPARTMENTS.CORPORATE_IT,
      system: COUPANG_DEPARTMENTS.CORPORATE_IT,
      designer: COUPANG_DEPARTMENTS.PRODUCT_UX,
      ux: COUPANG_DEPARTMENTS.PRODUCT_UX,
      researcher: COUPANG_DEPARTMENTS.PRODUCT_UX,
      product: COUPANG_DEPARTMENTS.ECOMMERCE_PRODUCT,
      search: COUPANG_DEPARTMENTS.SEARCH_DISCOVERY,
      discovery: COUPANG_DEPARTMENTS.SEARCH_DISCOVERY,
      facility: 'Engineering',
      'data center': 'Engineering',
      server: 'Engineering',
      director: 'Engineering',
      brand: COUPANG_DEPARTMENTS.PRODUCT_UX,
      'design system': COUPANG_DEPARTMENTS.PRODUCT_UX,
    };

    // 직무 분류
    for (const [keyword, dept] of Object.entries(departmentMapping)) {
      if (titleLower.includes(keyword)) {
        return dept;
      }
    }

    return 'Engineering';
  }

  protected inferJobCategory(title: string): string {
    const titleLower = title.toLowerCase();

    if (titleLower.includes('designer') || titleLower.includes('ux')) {
      return '디자인';
    } else if (
      titleLower.includes('engineer') ||
      titleLower.includes('developer')
    ) {
      return '개발';
    } else if (
      titleLower.includes('product') ||
      titleLower.includes('manager') ||
      titleLower.includes('director')
    ) {
      return '기획';
    } else if (titleLower.includes('researcher')) {
      return '연구';
    } else if (
      titleLower.includes('specialist') ||
      titleLower.includes('analyst')
    ) {
      return '전문가';
    } else {
      return '기타';
    }
  }

  private extractSkills(title: string, description: string): string[] {
    const skills = new Set<string>();
    const text = `${title} ${description}`.toLowerCase();

    // 기술 스택 매핑
    const techStack = {
      react: 'React',
      typescript: 'TypeScript',
      javascript: 'JavaScript',
      'node.js': 'Node.js',
      python: 'Python',
      java: 'Java',
      kotlin: 'Kotlin',
      aws: 'AWS',
      kubernetes: 'Kubernetes',
      docker: 'Docker',
      sap: 'SAP',
      abap: 'ABAP',
      ui: 'UI',
      ux: 'UX',
      design: 'Design',
      research: 'Research',
      cloud: 'Cloud',
      infra: 'Infrastructure',
      system: 'System',
      erp: 'ERP',
      'data center': 'Data Center',
      server: 'Server',
      facility: 'Facility',
      brand: 'Brand',
      'design system': 'Design System',
      'core ux': 'Core UX',
      'shopping ux': 'Shopping UX',
      'search ux': 'Search UX',
      'discovery ux': 'Discovery UX',
    };

    for (const [keyword, skill] of Object.entries(techStack)) {
      if (text.includes(keyword)) {
        skills.add(skill);
      }
    }

    return Array.from(skills);
  }

  private inferEmploymentType(title: string): string {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('contract') || titleLower.includes('계약')) {
      return EMPLOYMENT_TYPE.CONTRACT;
    }
    return EMPLOYMENT_TYPE.FULL_TIME;
  }

  getJobDetailUrl(jobId: string): string {
    return `${this.baseUrl}/${jobId}`;
  }
}
