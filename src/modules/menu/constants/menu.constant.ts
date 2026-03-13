export const REDIS_KEYS = {
  MENU_DATE: 'hbnu:menu:date:', // 특정 날짜의 메뉴
  MENU_WEEKLY: 'hbnu:menu:weekly:', // 주간 메뉴
  MENU_DATE_LAST_UPDATE: 'hbnu:menu:date:last-update:',
  MENU_WEEKLY_LAST_UPDATE: 'hbnu:menu:weekly:last-update:',
} as const;

export const MENU_UPDATE_CRON = '0 10 * * *'; // 매일 아침 10시
export const MENU_CACHE_TTL = 24 * 60 * 60; // 24시간
export const MENU_SOURCE_ID = 'institution.hanbat.menu';
export const MENU_SOURCE_CONFIDENCE = 0.86;
