import { Injectable } from '@nestjs/common';

interface ComparedCompanyOverviewInput {
  company: {
    code: string;
    name: string;
  };
  overview: {
    openJobs: number;
    newJobs: number;
    closingSoonJobs: number;
    skillCoverageRatio: number;
  };
}

@Injectable()
export class CompanyCompareOverviewService {
  build(companies: ComparedCompanyOverviewInput[]) {
    const hiringLeader =
      companies
        .slice()
        .sort((left, right) => right.overview.openJobs - left.overview.openJobs)[0]
        ?.company.name ?? '';
    const skillLeader =
      companies
        .slice()
        .sort(
          (left, right) =>
            right.overview.skillCoverageRatio - left.overview.skillCoverageRatio,
        )[0]?.company.name ?? '';

    return {
      companyCount: companies.length,
      totalOpenJobs: companies.reduce(
        (total, company) => total + company.overview.openJobs,
        0,
      ),
      totalNewJobs: companies.reduce(
        (total, company) => total + company.overview.newJobs,
        0,
      ),
      totalClosingSoonJobs: companies.reduce(
        (total, company) => total + company.overview.closingSoonJobs,
        0,
      ),
      broadestSkillCoverageCompany: skillLeader,
      mostActiveHiringCompany: hiringLeader,
    };
  }
}
