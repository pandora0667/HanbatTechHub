/**
 * Redis 키 상수 정의
 */
export const REDIS_KEYS = {
  JOBS_ALL: 'hbnu:jobs:all', // 모든 직무
  JOBS_TECH: 'hbnu:jobs:tech', // 기술 직무
  JOBS_COMPANY: 'hbnu:jobs:company:', // 회사별 직무 (접두사)
  JOBS_LAST_UPDATE: 'hbnu:jobs:last-update', // 마지막 업데이트 시간
  JOBS_CHANGE_SIGNALS: 'hbnu:jobs:signals:changes',
  JOBS_MARKET_HISTORY: 'hbnu:jobs:history:market',
};

/**
 * Job 캐시 TTL (초)
 * 기본값: 72시간
 */
export const JOBS_CACHE_TTL = parseInt(
  process.env.JOBS_CACHE_TTL || '259200',
  10,
);

/**
 * Job 스냅샷 freshness TTL (초)
 * 기본값: 12시간
 */
export const JOBS_FRESHNESS_TTL = parseInt(
  process.env.JOBS_FRESHNESS_TTL || '43200',
  10,
);

/**
 * Job 변화 신호 TTL (초)
 * 기본값: 7일
 */
export const JOBS_CHANGE_SIGNALS_TTL = parseInt(
  process.env.JOBS_CHANGE_SIGNALS_TTL || '604800',
  10,
);

/**
 * Job 시장 요약 히스토리 보관 길이
 * 기본값: 최신 30개 스냅샷
 */
export const JOBS_MARKET_HISTORY_LIMIT = parseInt(
  process.env.JOBS_MARKET_HISTORY_LIMIT || '30',
  10,
);

/**
 * Job 시장 요약 히스토리 TTL (초)
 * 기본값: 90일
 */
export const JOBS_MARKET_HISTORY_TTL = parseInt(
  process.env.JOBS_MARKET_HISTORY_TTL || '7776000',
  10,
);

/**
 * Job 시장 요약 히스토리에 저장할 필드/기술 상한
 */
export const JOBS_MARKET_HISTORY_FIELD_LIMIT = parseInt(
  process.env.JOBS_MARKET_HISTORY_FIELD_LIMIT || '40',
  10,
);

export const JOBS_MARKET_HISTORY_SKILL_LIMIT = parseInt(
  process.env.JOBS_MARKET_HISTORY_SKILL_LIMIT || '80',
  10,
);

/**
 * Job 업데이트 크론 표현식
 * 기본값: 평일(월-금) 한국 시간(KST) 기준 하루 최대 3회
 * - 실행 시간: 09:00, 13:00, 17:00 (KST)
 */
export const JOBS_UPDATE_CRON =
  process.env.JOBS_UPDATE_CRON || '0 9,13,17 * * 1-5';

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
