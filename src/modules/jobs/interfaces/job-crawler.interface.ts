import { CompanyType, JobPosting } from './job-posting.interface';
import { GetJobsQueryDto } from '../dto/requests/get-jobs-query.dto';

export interface JobFilter {
  department?: string;
  field?: string;
  career?: string;
  employmentType?: string;
  location?: string;
}

export interface IJobCrawler {
  /**
   * 회사 타입
   */
  readonly company: CompanyType;

  /**
   * 기본 URL (선택 사항)
   */
  readonly baseUrl?: string;

  /**
   * 직무 카테고리 (선택 사항)
   */
  readonly jobCategories?: Record<string, string>;

  /**
   * 채용 공고를 가져옵니다.
   * @param query - 필터링 조건
   * @returns Promise<JobPosting[]> - 채용 공고 목록
   */
  fetchJobs(query?: GetJobsQueryDto): Promise<JobPosting[]>;

  /**
   * 상세 페이지 URL을 생성합니다. (선택 사항)
   * @param jobId 직무 ID
   * @returns 상세 페이지 URL
   */
  getJobDetailUrl?(jobId: string): string;

  /**
   * 유효한 채용 공고인지 확인합니다. (선택 사항)
   * @param posting - 채용 공고
   * @returns boolean - 유효 여부
   */
  isValidPosting?(posting: JobPosting): boolean;

  /**
   * 원본 데이터를 표준 형식으로 변환합니다. (선택 사항)
   * @param rawData - 원본 데이터
   * @returns JobPosting - 표준화된 채용 공고
   */
  parseJobData?(rawData: any): JobPosting;
}
