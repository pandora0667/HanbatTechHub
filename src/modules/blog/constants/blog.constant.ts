export const TECH_BLOG_RSS = {
  MUSINSA: {
    name: '무신사',
    url: 'https://medium.com/feed/musinsa-tech',
  },
  NAVER_D2: {
    name: '네이버 D2',
    url: 'https://d2.naver.com/d2.atom',
  },
  KURLY: {
    name: '마켓컬리',
    url: 'https://helloworld.kurly.com/feed.xml',
  },
  WOOWA: {
    name: '우아한형제들',
    url: 'https://techblog.woowahan.com/feed/',
  },
  KAKAO_ENTERPRISE: {
    name: '카카오엔터프라이즈',
    url: 'https://tech.kakaoenterprise.com/feed',
  },
  LINE: {
    name: 'LINE',
    url: 'https://engineering.linecorp.com/ko/feed/index.html',
  },
  DAANGN: {
    name: '당근마켓',
    url: 'https://medium.com/feed/daangn',
  },
  TOSS: {
    name: '토스',
    url: 'https://toss.tech/rss.xml',
  },
  WATCHA: {
    name: 'WATCHA',
    url: 'https://medium.com/feed/watcha',
  },
  BANKSALAD: {
    name: '뱅크샐러드',
    url: 'https://blog.banksalad.com/rss.xml',
  },
  GEEKNEWS: {
    name: 'GeekNews',
    url: 'https://feeds.feedburner.com/geeknews-feed',
  },
  META: {
    name: 'Meta',
    url: 'https://engineering.fb.com/feed/',
  },
  NETFLIX: {
    name: 'Netflix',
    url: 'https://netflixtechblog.com/feed',
  },
  GOOGLE: {
    name: 'Google',
    url: 'http://feeds.feedburner.com/GoogleDevelopersKorea',
  },
  AWS: {
    name: 'AWS',
    url: 'https://aws.amazon.com/blogs/developer/feed/',
  },
} as const;

export const CACHE_KEYS = {
  ALL_POSTS: 'blog:all-posts',
  COMPANY_POSTS: 'blog:company-posts',
  COMPANY_LAST_UPDATE: 'blog:company:last-update',
} as const;

export const UPDATE_INTERVAL = 30 * 60 * 1000; // 30분

export const REDIS_KEYS = {
  BLOG_POSTS: 'hbnu:blog:posts',
  BLOG_COMPANY: 'hbnu:blog:company:',
  BLOG_LAST_UPDATE: 'hbnu:blog:last-update:',
} as const;

export const DEFAULT_REDIS_TTL = 24 * 60 * 60; // 24 hours
