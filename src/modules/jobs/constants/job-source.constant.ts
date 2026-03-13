import { CompanyType } from '../interfaces/job-posting.interface';
import { COMPANY_ENUM } from './job-codes.constant';
import {
  SourceCollectionMode,
  SourceTier,
} from '../../../common/types/snapshot.types';

export interface JobSourceDescriptor {
  id: string;
  company: CompanyType;
  name: string;
  provider: string;
  collectionUrl: string;
  collectionMode: SourceCollectionMode;
  tier: SourceTier;
  confidence: number;
}

export const JOB_SOURCE_CATALOG: Record<string, JobSourceDescriptor> = {
  [COMPANY_ENUM.NAVER]: {
    id: 'opportunity.jobs.naver',
    company: COMPANY_ENUM.NAVER,
    name: 'NAVER Careers',
    provider: 'NAVER',
    collectionUrl: 'https://recruit.navercorp.com/rcrt/list.do',
    collectionMode: 'html',
    tier: 'public_page',
    confidence: 0.78,
  },
  [COMPANY_ENUM.KAKAO]: {
    id: 'opportunity.jobs.kakao',
    company: COMPANY_ENUM.KAKAO,
    name: 'Kakao Careers API',
    provider: 'KAKAO',
    collectionUrl: 'https://careers.kakao.com/public/api/job-list',
    collectionMode: 'api',
    tier: 'public_page',
    confidence: 0.82,
  },
  [COMPANY_ENUM.LINE]: {
    id: 'opportunity.jobs.line',
    company: COMPANY_ENUM.LINE,
    name: 'LINE Careers Page Data',
    provider: 'LINE',
    collectionUrl: 'https://careers.linecorp.com/page-data/ko/jobs/page-data.json',
    collectionMode: 'api',
    tier: 'public_page',
    confidence: 0.8,
  },
  [COMPANY_ENUM.COUPANG]: {
    id: 'opportunity.jobs.coupang',
    company: COMPANY_ENUM.COUPANG,
    name: 'Coupang Careers',
    provider: 'COUPANG',
    collectionUrl: 'https://www.coupang.jobs/kr/jobs',
    collectionMode: 'browser',
    tier: 'browser_automation',
    confidence: 0.68,
  },
  [COMPANY_ENUM.BAEMIN]: {
    id: 'opportunity.jobs.baemin',
    company: COMPANY_ENUM.BAEMIN,
    name: 'Baemin Careers',
    provider: 'BAEMIN',
    collectionUrl: 'https://career.woowahan.com',
    collectionMode: 'browser',
    tier: 'browser_automation',
    confidence: 0.66,
  },
  [COMPANY_ENUM.DANGGN]: {
    id: 'opportunity.jobs.danggn',
    company: COMPANY_ENUM.DANGGN,
    name: 'Danggn Careers',
    provider: 'DANGGN',
    collectionUrl: 'https://about.daangn.com/jobs',
    collectionMode: 'html',
    tier: 'public_page',
    confidence: 0.76,
  },
  [COMPANY_ENUM.TOSS]: {
    id: 'opportunity.jobs.toss',
    company: COMPANY_ENUM.TOSS,
    name: 'Toss Careers',
    provider: 'TOSS',
    collectionUrl: 'https://toss.im/career/jobs',
    collectionMode: 'browser',
    tier: 'browser_automation',
    confidence: 0.64,
  },
};

export const JOB_SOURCE_DESCRIPTORS = Object.values(JOB_SOURCE_CATALOG);
export const JOB_SOURCE_COMPANIES = JOB_SOURCE_DESCRIPTORS.map(
  (source) => source.company,
);

export function getJobSourceDescriptor(company: CompanyType): JobSourceDescriptor {
  const descriptor = JOB_SOURCE_CATALOG[company];

  if (!descriptor) {
    return {
      id: `opportunity.jobs.${company.toLowerCase().replace(/\s+/g, '-')}`,
      company,
      name: `${company} Careers`,
      provider: company,
      collectionUrl: '',
      collectionMode: 'html',
      tier: 'public_page',
      confidence: 0.7,
    };
  }

  return descriptor;
}
