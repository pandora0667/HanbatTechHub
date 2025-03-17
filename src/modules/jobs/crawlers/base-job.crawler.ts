import { Logger } from '@nestjs/common';
import { CompanyType, JobPosting } from '../interfaces/job-posting.interface';
import { IJobCrawler } from '../interfaces/job-crawler.interface';
import { GetJobsQueryDto } from '../dto/requests/get-jobs-query.dto';
import { HttpClientUtil } from '../utils/http-client.util';
import { CAREER_TYPE, EMPLOYMENT_TYPE } from '../constants/job-codes.constant';

/**
 * 기본 직무 크롤러 추상 클래스
 * 각 회사별 크롤러가 상속받아 구현할 기본 틀을 제공합니다.
 */
export abstract class BaseJobCrawler implements IJobCrawler {
  protected readonly logger: Logger;

  constructor(
    public readonly company: CompanyType,
    protected readonly httpClient: HttpClientUtil,
    public readonly baseUrl?: string,
    public readonly jobCategories?: Record<string, string>,
  ) {
    this.logger = new Logger(`${this.constructor.name}:${company}`);
  }

  /**
   * 해당 회사의 채용 공고를 가져옵니다.
   * @param query 검색 조건
   * @returns 채용 공고 목록
   */
  abstract fetchJobs(query?: GetJobsQueryDto): Promise<JobPosting[]>;

  /**
   * 기본 JobPosting 객체 템플릿 생성
   * 각 크롤러에서 공통적으로 사용할 기본 객체입니다.
   * @returns 기본 채용 공고 객체
   */
  protected createJobPostingTemplate(): Partial<JobPosting> {
    return {
      company: this.company,
      requirements: {
        career: CAREER_TYPE.ANY, // 기본값: 경력 무관
        skills: [],
      },
      employmentType: EMPLOYMENT_TYPE.FULL_TIME, // 기본값: 정규직
      locations: [],
      tags: [],
      period: {
        start: new Date(),
        end: this.getDateMonthLater(1), // 기본 마감일: 1개월 후
      },
      source: {
        originalId: '',
        originalUrl: '',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * 상세 페이지 URL을 생성합니다.
   * @param jobId 직무 ID
   * @returns 상세 페이지 URL
   */
  getJobDetailUrl(jobId: string): string {
    if (!this.baseUrl) {
      return '';
    }
    return `${this.baseUrl}/${jobId}`;
  }

  /**
   * 유효한 채용 공고인지 확인합니다.
   * @param posting 채용 공고
   * @returns 유효 여부
   */
  isValidPosting(posting: JobPosting): boolean {
    // 필수 필드 검증
    return !!(
      posting.id &&
      posting.title &&
      posting.company &&
      posting.department &&
      posting.field &&
      posting.url
    );
  }

  /**
   * 에러 처리 및 로깅
   * @param message 에러 메시지
   * @param error 에러 객체
   */
  protected handleError(message: string, error: any): void {
    this.logger.error(`${message}: ${error.message || error}`);
    if (error.stack) {
      this.logger.debug(error.stack);
    }
  }

  /**
   * 채용 공고 유효성 검사
   * @param job 검증할 채용 공고 객체
   * @returns 유효한 채용 공고인지 여부
   */
  protected validateJob(job: Partial<JobPosting>): boolean {
    // 필수 필드 검증
    return !!(
      job.id &&
      job.title &&
      job.company &&
      job.department &&
      job.field &&
      job.url
    );
  }

  /**
   * 현재 날짜에서 특정 일수를 뺀 날짜를 반환합니다.
   * 게시일을 추정할 때 사용합니다.
   * @param days 빼고 싶은 일수
   * @returns 계산된 날짜
   */
  protected getDateBefore(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  /**
   * 현재 날짜에서 특정 개월 수를 더한 날짜를 반환합니다.
   * 마감일을 추정할 때 사용합니다.
   * @param months 더하고 싶은 개월 수
   * @returns 계산된 날짜
   */
  protected getDateMonthLater(months: number): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date;
  }

  /**
   * 문자열에서 숫자만 추출합니다.
   * @param text 대상 문자열
   * @returns 추출된 숫자
   */
  protected extractNumber(text: string): number | null {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  /**
   * 직무 카테고리 추출 헬퍼
   * @param title 직무 제목
   * @param description 직무 설명
   * @returns 추정된 직무 카테고리
   */
  protected inferJobCategory(title: string, description?: string): string {
    const text = `${title.toLowerCase()} ${description?.toLowerCase() || ''}`;

    // 개발 분야
    if (
      /개발|프로그래밍|코딩|엔지니어링|software|developer|engineer|programming|backend|frontend|fullstack/.test(
        text,
      )
    ) {
      return '개발';
    }

    // 디자인 분야
    if (
      /디자인|디자이너|ui|ux|그래픽|웹디자인|design|designer|graphic/.test(text)
    ) {
      return '디자인';
    }

    // 기획 분야
    if (
      /기획|pm|product|서비스기획|매니저|planning|service planning/.test(text)
    ) {
      return '기획';
    }

    // 마케팅 분야
    if (/마케팅|광고|퍼포먼스|marketing|pr|ads|performance/.test(text)) {
      return '마케팅';
    }

    // 데이터 분야
    if (
      /데이터|분석|dba|data|analyst|scientist|분석가|통계|머신러닝|ai|데이터베이스/.test(
        text,
      )
    ) {
      return '데이터';
    }

    // 기본값
    return '기타';
  }
}
