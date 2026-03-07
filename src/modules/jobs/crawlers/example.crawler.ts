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
} from '../constants/job-codes.constant';
import { HttpClientUtil } from '../utils/http-client.util';

/**
 * 예제 회사 크롤러 구현
 * 새 회사의 크롤러를 추가할 때 참고할 수 있는 템플릿입니다.
 *
 * 구현 시 필요한 핵심 로직:
 * 1. 채용 페이지 API 또는 웹페이지 HTML 분석
 * 2. 채용 정보 데이터 추출 및 표준 형식으로 변환
 * 3. 에러 처리 및 유효성 검사
 */
@Injectable()
export class ExampleCompanyCrawler extends BaseJobCrawler {
  constructor(
    protected readonly httpClient: HttpClientUtil,
    protected readonly configService: ConfigService,
  ) {
    super(
      COMPANY_ENUM.NAVER, // 회사 타입 설정
      httpClient,
      'https://example.com/careers', // 기본 URL
      {}, // 직무 카테고리 코드 (필요한 경우)
    );
  }

  /**
   * 채용 공고 데이터를 가져오는 메인 메서드
   * @param query 검색 쿼리
   * @returns 표준화된 채용 공고 배열
   */
  async fetchJobs(query?: GetJobsQueryDto): Promise<JobPosting[]> {
    try {
      // 1. API 또는 웹페이지에서 데이터 가져오기
      const apiUrl = `${this.baseUrl}/api/jobs`;
      const response = await this.httpClient.get<any[]>(apiUrl, {
        params: this.buildQueryParams(query),
        headers: {
          'User-Agent': this.httpClient.getRandomUserAgent(),
        },
      });

      // 2. 데이터 변환
      return this.transformJobData(response);
    } catch (error) {
      // 3. 에러 처리
      this.handleError(`Failed to fetch ${this.company} jobs`, error);
      return []; // 에러 발생 시 빈 배열 반환
    }
  }

  /**
   * 상세 페이지 URL 생성
   * @param jobId 채용 공고 ID
   * @returns 상세 페이지 URL
   */
  getJobDetailUrl(jobId: string): string {
    return `${this.baseUrl}/job/${jobId}`;
  }

  /**
   * 쿼리 파라미터 변환
   * @param query 검색 쿼리
   * @returns API 요청 파라미터
   */
  private buildQueryParams(query?: GetJobsQueryDto): Record<string, any> {
    const params: Record<string, any> = {
      limit: 100, // 기본 최대 가져올 항목 수
    };

    if (query) {
      if (query.keyword) {
        params.search = query.keyword;
      }

      if (query.department) {
        params.department = query.department;
      }

      if (query.career) {
        // 경력 유형 변환 (회사 API에 맞게 수정)
        if (query.career === CAREER_TYPE.NEW) {
          params.experienceLevel = 'entry';
        } else if (query.career === CAREER_TYPE.EXPERIENCED) {
          params.experienceLevel = 'experienced';
        }
      }

      // 추가 필요한 파라미터...
    }

    return params;
  }

  /**
   * API 응답 데이터를 표준 형식으로 변환
   * @param rawData API 응답 데이터
   * @returns 표준화된 채용 공고 배열
   */
  private transformJobData(rawData: any[]): JobPosting[] {
    if (!Array.isArray(rawData)) {
      this.logger.warn('Expected array data but received:', typeof rawData);
      return [];
    }

    // 데이터 변환
    return rawData
      .map((item) => {
        try {
          // 기본 템플릿 가져오기
          const template = this.createJobPostingTemplate();

          // 경력 타입 변환
          let career: CareerType = CAREER_TYPE.ANY;
          if (item.experienceLevel === 'entry') {
            career = CAREER_TYPE.NEW;
          } else if (item.experienceLevel === 'experienced') {
            career = CAREER_TYPE.EXPERIENCED;
          }

          // 고용 형태 변환
          let employmentType: EmploymentType = EMPLOYMENT_TYPE.FULL_TIME;
          if (item.employmentType === 'contract') {
            employmentType = EMPLOYMENT_TYPE.CONTRACT;
          } else if (item.employmentType === 'intern') {
            employmentType = EMPLOYMENT_TYPE.INTERN;
          }

          // 채용 공고 객체 생성
          const job: JobPosting = {
            ...template,
            id: item.id.toString(),
            title: item.title,
            company: this.company,
            department: item.department || '기타',
            field: item.field || '기타',
            requirements: {
              career,
              education: item.education,
              skills: item.skills || [],
            },
            employmentType,
            locations: this.parseLocations(item.location),
            description: item.description,
            qualifications: item.qualifications || [],
            preferences: item.preferences || [],
            benefits: item.benefits || [],
            period: {
              start: new Date(item.startDate || Date.now()),
              end: new Date(
                item.endDate || this.getDateMonthLater(1).getTime(),
              ),
            },
            url: this.getJobDetailUrl(item.id.toString()),
            source: {
              originalId: item.id.toString(),
              originalUrl: item.url || this.getJobDetailUrl(item.id.toString()),
            },
            // 추가 필드
            jobCategory: this.inferJobCategory(item.title, item.description),
            tags: item.tags || [],
            // 회사별 특수 데이터 저장
            companySpecificData: {
              originalCategory: item.category,
              applicationCount: item.applicationCount,
              featured: item.featured,
              // 기타 회사별 특수 데이터...
            },
          } as JobPosting;

          return job;
        } catch (error) {
          this.handleError(`Failed to transform job data: ${item?.id}`, error);
          return null;
        }
      })
      .filter((job): job is JobPosting => !!job && this.validateJob(job));
  }

  /**
   * 위치 데이터 파싱
   * @param locationData 위치 데이터
   * @returns 표준화된 위치 배열
   */
  private parseLocations(locationData: any): string[] {
    if (!locationData) {
      return ['기타'];
    }

    if (typeof locationData === 'string') {
      return [locationData];
    }

    if (Array.isArray(locationData)) {
      return locationData.map((loc) => loc.toString());
    }

    return ['기타'];
  }
}
