import {
  CAREER_TYPE,
  COMPANY_ENUM,
  EMPLOYMENT_TYPE,
  LOCATION_TYPE,
} from '../constants/job-codes.constant';

export type CompanyType = (typeof COMPANY_ENUM)[keyof typeof COMPANY_ENUM];
export type CareerType = (typeof CAREER_TYPE)[keyof typeof CAREER_TYPE];
export type EmploymentType =
  (typeof EMPLOYMENT_TYPE)[keyof typeof EMPLOYMENT_TYPE];
export type LocationType = (typeof LOCATION_TYPE)[keyof typeof LOCATION_TYPE];

export interface JobPosting {
  id: string;
  company: CompanyType;
  title: string;
  department: string;
  field: string;
  requirements: {
    career: CareerType;
    education?: string;
    skills?: string[];
  };
  employmentType: EmploymentType;
  locations: LocationType[];
  description?: string;
  qualifications?: string[];
  preferences?: string[];
  benefits?: string[];
  period: {
    start: Date;
    end: Date;
  };
  url: string;
  source: {
    originalId: string;
    originalUrl: string;
  };
  createdAt: Date;
  updatedAt: Date;

  // 회사별 특수 데이터를 위한 필드 추가
  companySpecificData?: Record<string, any>;

  // 태그나 키워드 등 분류를 위한 메타데이터
  tags?: string[];

  // 직군 분류 데이터
  jobCategory?: string;
  jobSubCategory?: string;

  // 원본 데이터 보존 (디버깅, 향후 마이그레이션 등을 위해)
  rawData?: any;
}
