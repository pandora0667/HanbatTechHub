import { CompanyType } from '../../jobs/interfaces/job-posting.interface';
import { getBlogSourceId } from '../../blog/constants/blog.constant';

export interface CompanyContentSourceMapping {
  blogCode: string;
  sourceId: string;
}

export const COMPANY_CONTENT_SOURCE_MAP: Partial<
  Record<CompanyType, CompanyContentSourceMapping>
> = {
  NAVER: {
    blogCode: 'NAVER_D2',
    sourceId: getBlogSourceId('NAVER_D2'),
  },
  KAKAO: {
    blogCode: 'KAKAO_ENTERPRISE',
    sourceId: getBlogSourceId('KAKAO_ENTERPRISE'),
  },
  LINE: {
    blogCode: 'LINE',
    sourceId: getBlogSourceId('LINE'),
  },
  BAEMIN: {
    blogCode: 'WOOWA',
    sourceId: getBlogSourceId('WOOWA'),
  },
  DANGGN: {
    blogCode: 'DAANGN',
    sourceId: getBlogSourceId('DAANGN'),
  },
  TOSS: {
    blogCode: 'TOSS',
    sourceId: getBlogSourceId('TOSS'),
  },
};

export function getCompanyContentSource(
  company: CompanyType,
): CompanyContentSourceMapping | undefined {
  return COMPANY_CONTENT_SOURCE_MAP[company];
}
