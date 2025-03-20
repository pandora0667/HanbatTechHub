export const NAVER_TECH_JOB_CODES = {
  SOFTWARE_DEVELOPMENT: {
    FRONTEND: '1010001',
    ANDROID: '1010002',
    IOS: '1010003',
    BACKEND: '1010004',
    AI_ML: '1010005',
    DATA_ENGINEERING: '1010006',
    EMBEDDED_SW: '1010007',
    GRAPHICS: '1010008',
    DATA_SCIENCE: '1010009',
    COMMON: '1010020',
  },
  HARDWARE_DEVELOPMENT: {
    HARDWARE: '1020001',
  },
  INFRA_ENGINEERING: {
    INFRA: '1030001',
    DATA_CENTER: '1030002',
  },
  SECURITY: {
    ANALYSIS: '1040001',
    ARCHITECTURE: '1040002',
    DEVELOPMENT: '1040003',
  },
  TECH_OPERATIONS: {
    TECH_STAFF: '1050001',
    QA: '1050002',
  },
  COMMON: {
    COMMON: '1060001',
  },
} as const;

export const COMPANY_ENUM = {
  NAVER: 'NAVER',
  NAVER_CLOUD: 'NAVER_CLOUD',
  SNOW: 'SNOW',
  NAVER_LABS: 'NAVER_LABS',
  NAVER_WEBTOON: 'NAVER_WEBTOON',
  NAVER_FINANCIAL: 'NAVER_FINANCIAL',
  NAVER_IS: 'NAVER_IS',
  KAKAO: 'KAKAO',
  LINE: 'LINE',
  COUPANG: 'COUPANG',
} as const;

export const EMPLOYMENT_TYPE = {
  FULL_TIME: '정규',
  CONTRACT: '계약',
  INTERN: '인턴',
} as const;

export const CAREER_TYPE = {
  NEW: '신입',
  EXPERIENCED: '경력',
  ANY: '무관',
} as const;

export const LOCATION_TYPE = {
  BUNDANG: '분당',
  SEOUL: '서울',
  CHUNCHEON: '춘천',
  SEJONG: '세종',
  GLOBAL: '글로벌',
} as const;

export const LINE_JOB_CODES = {
  ENGINEERING: 'Engineering',
  PLANNING: 'Planning',
  DESIGN: 'Design',
  BUSINESS: 'Business & Sales',
  MARKETING: 'Marketing & CS',
  ANALYSIS: 'Analysis',
  CORPORATE: 'Corporate',
} as const;

export const COUPANG_DEPARTMENTS = {
  CLOUD_PLATFORM: 'Cloud Platform',
  CORPORATE_IT: 'Corporate IT',
  ECOMMERCE_PRODUCT: 'eCommerce Product',
  PRODUCT_UX: 'Product UX',
  SEARCH_DISCOVERY: 'Search and Discovery',
} as const;
