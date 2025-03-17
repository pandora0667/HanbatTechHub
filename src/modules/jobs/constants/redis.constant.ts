/**
 * Redis 키 상수 정의
 */
export const REDIS_KEYS = {
  JOBS_ALL: 'hbnu:jobs:all', // 모든 직무
  JOBS_TECH: 'hbnu:jobs:tech', // 기술 직무
  JOBS_COMPANY: 'hbnu:jobs:company:', // 회사별 직무 (접두사)
  JOBS_LAST_UPDATE: 'hbnu:jobs:last-update', // 마지막 업데이트 시간
};

/**
 * Job 캐시 TTL (초)
 * 기본값: 1시간
 */
export const JOBS_CACHE_TTL = parseInt(
  process.env.JOBS_CACHE_TTL || '3600',
  10,
);

/**
 * Job 업데이트 크론 표현식
 * 기본값: 평일(월-금) 한국 시간(KST) 오전 9시부터 오후 8시까지 3시간 간격
 * - 실행 시간: 09:00, 12:00, 15:00, 18:00 (KST)
 */
export const JOBS_UPDATE_CRON =
  process.env.JOBS_UPDATE_CRON || '0 0 9-20/3 * * 1-5';

/**
 * Job 크롤링 설정
 */
export const JOB_CRAWLING_CONFIG = {
  // 크롤링 최대 동시 요청 수
  MAX_CONCURRENT_REQUESTS: parseInt(
    process.env.JOB_MAX_CONCURRENT_REQUESTS || '5',
    10,
  ),

  // 요청 간 지연 시간 (ms)
  REQUEST_DELAY: parseInt(process.env.JOB_REQUEST_DELAY || '200', 10),

  // 요청 타임아웃 (ms)
  REQUEST_TIMEOUT: parseInt(process.env.JOB_REQUEST_TIMEOUT || '10000', 10),

  // 최대 페이지 수 (안전 장치)
  MAX_PAGES: parseInt(process.env.JOB_MAX_PAGES || '10', 10),

  // 최대 재시도 횟수
  MAX_RETRIES: parseInt(process.env.JOB_MAX_RETRIES || '3', 10),

  // 초기 지연 시간 (ms)
  INITIAL_DELAY: parseInt(process.env.JOB_INITIAL_DELAY || '1000', 10),

  // 백오프 증가 계수
  BACKOFF_FACTOR: parseFloat(process.env.JOB_BACKOFF_FACTOR || '2'),

  // 임의성 추가 범위 (ms)
  JITTER: parseInt(process.env.JOB_JITTER || '300', 10),

  // User-Agent 목록
  USER_AGENTS: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
  ],
};
