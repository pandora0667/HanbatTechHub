import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseJobCrawler } from './base-job.crawler';
import { GetJobsQueryDto } from '../dto/requests/get-jobs-query.dto';
import {
  JobPosting,
  CareerType,
  EmploymentType,
} from '../interfaces/job-posting.interface';
import {
  COMPANY_ENUM,
  CAREER_TYPE,
  EMPLOYMENT_TYPE,
  NAVER_TECH_JOB_CODES,
} from '../constants/job-codes.constant';
import { HttpClientUtil } from '../utils/http-client.util';
import * as cheerio from 'cheerio';

@Injectable()
export class NaverCrawler extends BaseJobCrawler {
  // NAVER 기술 직무 코드 저장
  private readonly naverJobCodes = NAVER_TECH_JOB_CODES;

  constructor(
    protected readonly httpClient: HttpClientUtil,
    protected readonly configService: ConfigService,
  ) {
    super(
      COMPANY_ENUM.NAVER,
      httpClient,
      'https://recruit.navercorp.com',
      {}, // 빈 객체로 초기화 (this.naverJobCodes 사용)
    );
  }

  async fetchJobs(query?: GetJobsQueryDto): Promise<JobPosting[]> {
    try {
      const params = this.buildParams(query);

      const response = await this.httpClient.get<string>(
        `${this.baseUrl}/rcrt/list.do`,
        {
          params,
          headers: {
            'Accept-Language': 'ko-KR',
            'User-Agent': this.httpClient.getRandomUserAgent(),
          },
          responseType: 'text',
        },
      );

      return this.parseJobListings(response);
    } catch (error) {
      this.handleError(`Failed to fetch ${this.company} jobs`, error);
      return []; // 에러 발생 시 빈 배열 반환 (서비스에서 재시도 로직 처리)
    }
  }

  getJobDetailUrl(jobId: string): string {
    return `${this.baseUrl}/rcrt/view/${jobId}`;
  }

  private buildParams(query?: GetJobsQueryDto): Record<string, any> {
    // 모든 기술 직무 코드 추출
    const subJobCdArr = Object.values(this.naverJobCodes).flatMap((category) =>
      Object.values(category),
    );

    const params: Record<string, any> = {
      subJobCdArr: subJobCdArr.join(','),
    };

    // 필터 조건 추가
    if (query) {
      if (query.department) {
        params.department = query.department;
      }

      if (query.field) {
        params.field = query.field;
      }

      if (query.career) {
        params.career = query.career;
      }

      if (query.employmentType) {
        params.employmentType = query.employmentType;
      }

      if (query.location) {
        params.location = query.location;
      }
    }

    return params;
  }

  private parseJobListings(html: string): JobPosting[] {
    try {
      const $ = cheerio.load(html);
      const jobs: JobPosting[] = [];

      $('.card_item').each((_, element) => {
        const $item = $(element);

        // 기본 정보 추출
        const title = $item.find('.card_title').text().trim();
        const department = $item.find('.info_text').first().text().trim();
        const field = $item.find('.info_text').eq(1).text().trim();
        const careerText = $item.find('.info_text').eq(2).text().trim();
        const employmentTypeText = $item.find('.info_text').eq(3).text().trim();
        const period = $item.find('.info_text').eq(4).text().trim();

        // ID 추출
        const id =
          $item
            .find('.card_link')
            .attr('onclick')
            ?.match(/show\('(\d+)'\)/)?.[1] || '';

        // 날짜 처리
        let startDate: Date = new Date();
        let endDate: Date = this.getDateMonthLater(1);

        try {
          const [startDateStr, endDateStr] = period
            .split('~')
            .map((date) => date.trim());
          startDate = new Date(startDateStr);
          endDate = new Date(endDateStr);
        } catch {
          this.logger.warn(`Failed to parse date range: ${period}`);
        }

        // 경력 타입 변환
        let career: CareerType = CAREER_TYPE.ANY;
        if (careerText.includes('신입')) {
          career = CAREER_TYPE.NEW;
        } else if (careerText.includes('경력')) {
          career = CAREER_TYPE.EXPERIENCED;
        }

        // 고용 형태 변환
        let employmentType: EmploymentType = EMPLOYMENT_TYPE.FULL_TIME;
        if (employmentTypeText.includes('계약')) {
          employmentType = EMPLOYMENT_TYPE.CONTRACT;
        } else if (employmentTypeText.includes('인턴')) {
          employmentType = EMPLOYMENT_TYPE.INTERN;
        }

        // 기본 템플릿에서 시작하여 데이터 채우기
        const jobTemplate = this.createJobPostingTemplate();
        const job: JobPosting = {
          ...jobTemplate,
          id,
          title,
          company: this.company,
          department,
          field,
          requirements: {
            ...jobTemplate.requirements,
            career,
          },
          employmentType,
          locations: ['분당'], // 기본 위치
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

        // 유효한 채용 공고만 추가
        if (this.validateJob(job)) {
          jobs.push(job);
        }
      });

      this.logger.debug(`Parsed ${jobs.length} jobs from ${this.company}`);
      return jobs;
    } catch (err) {
      this.handleError('Failed to parse job listings', err);
      return [];
    }
  }
}
