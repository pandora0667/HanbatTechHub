import {
  CareerType,
  CompanyType,
  EmploymentType,
  LocationType,
} from '../../interfaces/job-posting.interface';

export interface JobSearchQuery {
  company?: CompanyType;
  department?: string;
  field?: string;
  career?: CareerType;
  employmentType?: EmploymentType;
  location?: LocationType;
  keyword?: string;
  page?: number;
  limit?: number;
}
