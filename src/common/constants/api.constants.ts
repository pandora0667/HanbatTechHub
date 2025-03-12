export const API_ENDPOINTS = {
  NOTICES: {
    BASE: 'notices',
    NEW: 'new',
    FEATURED: 'featured',
    TODAY: 'today',
  },
  MENU: {
    BASE: 'menu',
    TODAY: 'today',
    WEEK: 'week',
  },
} as const;

export const THROTTLE_LIMIT = {
  NOTICES: {
    TTL: 60, // 1분
    LIMIT: 60, // 60회
  },
  MENU: {
    TTL: 60, // 1분
    LIMIT: 30, // 30회
  },
  GLOBAL: {
    TTL: 60, // 1분
    LIMIT: 100, // 100회
  },
} as const; 