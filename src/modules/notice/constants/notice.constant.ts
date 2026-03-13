/**
 * 한밭대학교 공지사항 관련 상수
 */
export const HANBAT_NOTICE = {
  BASE_URL: 'https://www.hanbat.ac.kr/bbs/BBSMSTR_000000001001/list.do',
  VIEW_URL: 'https://www.hanbat.ac.kr/bbs/BBSMSTR_000000001001/view.do',
  MENU_PARAM: 'sub05_01',
  USER_AGENT:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
};

export const REDIS_KEYS = {
  NOTICE_LIST: 'hbnu:notice:list', // 일반 공지사항 목록
  NOTICE_FEATURED: 'hbnu:notice:featured', // 고정 공지사항 목록
  NOTICE_NEW: 'hbnu:notice:new', // 새로운 공지사항 목록
  NOTICE_TODAY: 'hbnu:notice:today', // 오늘의 공지사항 목록
  NOTICE_DETAIL: 'hbnu:notice:detail:', // 공지사항 상세 정보 (키 뒤에 nttId 붙임)
  NOTICE_LAST_UPDATE: 'hbnu:notice:last-update',
  NOTICE_DETAIL_LAST_UPDATE: 'hbnu:notice:detail:last-update:',
} as const;

// 평일 기준 하루 최대 3회만 안전하게 업데이트
export const NOTICE_UPDATE_CRON =
  process.env.NOTICE_UPDATE_CRON || '0 9,13,17 * * 1-5';

// 캐시 유효기간 (1시간)
export const NOTICE_CACHE_TTL = 60 * 60;

// 공지사항 상세 정보 캐시 유효기간 (24시간)
export const NOTICE_DETAIL_CACHE_TTL = 24 * 60 * 60;
export const NOTICE_SOURCE_ID = 'institution.hanbat.notice';
export const NOTICE_SOURCE_CONFIDENCE = 0.8;
