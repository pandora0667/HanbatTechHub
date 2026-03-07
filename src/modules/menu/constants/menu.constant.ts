export const REDIS_KEYS = {
  MENU_DATE: 'hbnu:menu:date:', // 특정 날짜의 메뉴
  MENU_WEEKLY: 'hbnu:menu:weekly:', // 주간 메뉴
} as const;

export const MENU_UPDATE_CRON = '0 10 * * *'; // 매일 아침 10시
export const MENU_CACHE_TTL = 24 * 60 * 60; // 24시간
