import { Injectable } from '@nestjs/common';
import { SnapshotMetadata } from '../../../../common/types/snapshot.types';
import { mergeSnapshotMetadata } from '../../../../common/utils/snapshot.util';
import { CompanyIntelligenceService } from '../../../company-intelligence/company-intelligence.service';
import { SkillIntelligenceService } from '../../../skill-intelligence/skill-intelligence.service';
import { CompanyType } from '../../../jobs/interfaces/job-posting.interface';
import { CompanyResearchResponseDto } from '../../dto/company-research.response.dto';
import { GetCompanyResearchQueryDto } from '../../dto/get-company-research-query.dto';
import { CompanyResearchBuilderService } from '../../domain/services/company-research-builder.service';

@Injectable()
export class GetCompanyResearchUseCase {
  constructor(
    private readonly companyIntelligenceService: CompanyIntelligenceService,
    private readonly skillIntelligenceService: SkillIntelligenceService,
    private readonly companyResearchBuilderService: CompanyResearchBuilderService,
  ) {}

  async execute(
    company: CompanyType,
    query: GetCompanyResearchQueryDto,
  ): Promise<CompanyResearchResponseDto> {
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
    const generatedAt = new Date().toISOString();
    const snapshot = mergeSnapshotMetadata(
      [brief.snapshot, skillMap.snapshot].filter(
        (entry): entry is SnapshotMetadata => entry !== undefined,
      ),
    );
    const research = this.companyResearchBuilderService.build({
      brief,
      skillMap,
      deadlineWindowDays: query.deadlineWindowDays ?? 7,
    });

    return {
      generatedAt,
      company: brief.company,
      snapshot,
      thesis: research.thesis,
      insights: research.insights,
      actions: research.actions,
      sources: brief.sections.sources,
    };
  }
}
