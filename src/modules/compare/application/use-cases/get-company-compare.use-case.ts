import { BadRequestException, Injectable } from '@nestjs/common';
import { SnapshotMetadata } from '../../../../common/types/snapshot.types';
import { mergeSnapshotMetadata } from '../../../../common/utils/snapshot.util';
import { CompanyIntelligenceService } from '../../../company-intelligence/company-intelligence.service';
import { SkillIntelligenceService } from '../../../skill-intelligence/skill-intelligence.service';
import { GetCompanyCompareQueryDto } from '../../dto/get-company-compare-query.dto';
import { CompanyCompareResponseDto } from '../../dto/company-compare.response.dto';
import { CompanyCompareOverviewService } from '../../domain/services/company-compare-overview.service';

@Injectable()
export class GetCompanyCompareUseCase {
  constructor(
    private readonly companyIntelligenceService: CompanyIntelligenceService,
    private readonly skillIntelligenceService: SkillIntelligenceService,
    private readonly companyCompareOverviewService: CompanyCompareOverviewService,
  ) {}

  async execute(
    query: GetCompanyCompareQueryDto,
  ): Promise<CompanyCompareResponseDto> {
    const uniqueCompanies = Array.from(new Set(query.companies));

    if (uniqueCompanies.length < 2) {
      throw new BadRequestException(
        'At least two distinct companies are required for comparison.',
      );
    }

    const comparedCompanies = await Promise.all(
      uniqueCompanies.map(async (company) => {
        const [brief, skillMap] = await Promise.all([
          this.companyIntelligenceService.getCompanyBrief(company, {
            jobLimit: query.jobLimit,
            contentLimit: query.contentLimit,
            changeLimit: query.changeLimit,
            deadlineLimit: query.deadlineLimit,
            deadlineWindowDays: query.deadlineWindowDays,
          }),
          this.skillIntelligenceService.getSkillMap({
            company,
            limit: query.skillLimit,
            minDemand: query.minSkillDemand,
            sampleLimit: 2,
          }),
        ]);

        return {
          generatedAt: brief.generatedAt,
          snapshot: mergeSnapshotMetadata(
            [brief.snapshot, skillMap.snapshot].filter(
              (snapshot): snapshot is SnapshotMetadata => snapshot !== undefined,
            ),
          ),
          company: brief.company,
          overview: {
            ...brief.overview,
            skillsTracked: skillMap.summary.totalSkills,
            skillCoverageRatio: skillMap.summary.coverageRatio,
          },
          topSkills: skillMap.skills.map((skill) => ({
            skill: skill.skill,
            demandCount: skill.demandCount,
            companyCount: skill.companyCount,
          })),
          sources: brief.sections.sources,
        };
      }),
    );
    const generatedAt = new Date().toISOString();

    return {
      generatedAt,
      snapshot: mergeSnapshotMetadata(
        comparedCompanies
          .map((company) => company.snapshot)
          .filter(
            (snapshot): snapshot is SnapshotMetadata => snapshot !== undefined,
          ),
      ),
      overview: this.companyCompareOverviewService.build(comparedCompanies),
      companies: comparedCompanies,
    };
  }
}
