import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseJobCrawler } from './base-job.crawler';
import { GetJobsQueryDto } from '../dto/requests/get-jobs-query.dto';
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
import { HttpClientUtil } from '../utils/http-client.util';
import * as cheerio from 'cheerio';

@Injectable()
export class LineCrawler extends BaseJobCrawler {
  protected readonly logger = new Logger(LineCrawler.name);

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

  async fetchJobs(query?: GetJobsQueryDto): Promise<JobPosting[]> {
    this.logger.debug('Starting to fetch LINE jobs...');

    try {
      const url = this.buildUrl(query);
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
      this.handleError('Failed to fetch LINE jobs', error);
      return [];
    }
  }

  private buildUrl(query?: GetJobsQueryDto): string {
    const params = new URLSearchParams({
      ca: 'Engineering', // 직군 필터
      ci: 'Gwacheon,Bundang', // 지역 필터
      co: 'East Asia', // 지역 그룹
    });

    if (query?.page) {
      params.append('page', query.page.toString());
    }

    const url = `${this.baseUrl}?${params.toString()}`;
    this.logger.debug(`Built URL: ${url}`);
    return url;
  }

  private parseJobListings(html: string): JobPosting[] {
    try {
      const $ = cheerio.load(html);
      const jobs: JobPosting[] = [];

      // HTML 구조 디버깅
      this.logger.debug('HTML structure:', $('body').html()?.substring(0, 500));

      $('.job_list li').each((_, element) => {
        const $item = $(element);
        const $link = $item.find('a');
        const title = $link.find('h3.title').text().trim();
        const $textFilter = $link.find('.text_filter');
        const location = $textFilter.find('span').first().text().trim();
        const department = $textFilter.find('span').eq(2).text().trim();
        const employmentType = $textFilter.find('span').eq(3).text().trim();
        const period = $link.find('.date').text().trim();

        // 엔지니어링 직군만 필터링
        if (department !== 'Engineering') {
          return;
        }

        // ID 추출 (URL에서)
        const id = $link.attr('href')?.split('/').pop() || '';

        // 날짜 처리
        let startDate: Date = new Date();
        let endDate: Date = this.getDateMonthLater(1);

        try {
          const [startDateStr, endDateStr] = period
            .split('~')
            .map((date) => date.trim());
          startDate = new Date(startDateStr);
          endDate =
            endDateStr === '채용시까지'
              ? new Date('2099-12-31')
              : new Date(endDateStr);
        } catch {
          this.logger.warn(`Failed to parse date range: ${period}`);
        }

        // 기본 템플릿에서 시작하여 데이터 채우기
        const jobTemplate = this.createJobPostingTemplate();
        const job: JobPosting = {
          ...jobTemplate,
          id,
          title,
          company: this.company,
          department,
          field: department, // LINE은 department를 field로 사용
          requirements: {
            ...jobTemplate.requirements,
            career: CAREER_TYPE.ANY, // LINE은 경력 정보를 별도로 표시하지 않음
          },
          employmentType: this.mapEmploymentType(employmentType),
          locations: [this.mapLocationType(location)],
          period: {
            start: startDate,
            end: endDate,
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
      });

      this.logger.debug(
        `Parsed ${jobs.length} engineering jobs from ${this.company}`,
      );
      return jobs;
    } catch (err) {
      this.handleError('Failed to parse job listings', err);
      return [];
    }
  }

  private mapEmploymentType(type: string): EmploymentType {
    if (type.includes('정규') || type.includes('Full-time')) {
      return EMPLOYMENT_TYPE.FULL_TIME;
    } else if (type.includes('계약') || type.includes('Contract')) {
      return EMPLOYMENT_TYPE.CONTRACT;
    } else if (type.includes('인턴') || type.includes('Intern')) {
      return EMPLOYMENT_TYPE.INTERN;
    }
    return EMPLOYMENT_TYPE.FULL_TIME;
  }

  private mapLocationType(location: string): LocationType {
    switch (location) {
      case 'Bundang':
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
