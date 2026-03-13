import { Injectable } from '@nestjs/common';
import { CompanyBriefResponseDto } from '../../../company-intelligence/dto/company-brief.response.dto';
import { SkillMapResponseDto } from '../../../skill-intelligence/dto/skill-map.response.dto';

interface BuildCompanyResearchInput {
  brief: CompanyBriefResponseDto;
  skillMap: SkillMapResponseDto;
  deadlineWindowDays: number;
}

interface CompanyResearchAction {
  type: string;
  label: string;
  reason: string;
  url?: string;
}

@Injectable()
export class CompanyResearchBuilderService {
  build(input: BuildCompanyResearchInput) {
    const { brief, skillMap, deadlineWindowDays } = input;
    const companyName = brief.company.name;
    const openJobs = brief.overview.openJobs;
    const newJobs = brief.overview.newJobs;
    const closingSoonJobs = brief.overview.closingSoonJobs;
    const updatedJobs = brief.overview.updatedJobs;
    const topSkills = skillMap.skills.slice(0, 3);
    const latestContent = brief.sections.latestContent.items.slice(0, 2);
    const insightConfidence = brief.snapshot?.confidence ?? 0.7;

    const thesis =
      openJobs > 0
        ? {
            headline: `${companyName} is showing active hiring signals`,
            summary: `${openJobs} open roles are visible in the current snapshot, with ${newJobs} new signals and ${closingSoonJobs} roles closing within ${deadlineWindowDays} days.`,
          }
        : {
            headline: `${companyName} has limited visible hiring activity`,
            summary:
              'The current internal snapshot shows no open roles. Treat this as a watch state until the next collection cycle confirms a change.',
          };

    const insights = [
      {
        type: 'hiring',
        headline:
          openJobs > 0
            ? `${openJobs} open roles define the current hiring posture`
            : 'No open roles are visible in the current snapshot',
        summary:
          openJobs > 0
            ? `${newJobs} new roles, ${updatedJobs} updated roles, and ${closingSoonJobs} deadline-sensitive roles shape the current opportunity set.`
            : 'This does not prove the company is inactive, only that the latest collected snapshot did not expose an active listing.',
        evidence: [
          `Open jobs: ${openJobs}`,
          `New jobs: ${newJobs}`,
          `Updated jobs: ${updatedJobs}`,
          `Closing soon: ${closingSoonJobs}`,
        ],
        confidence: insightConfidence,
      },
      {
        type: 'skills',
        headline:
          topSkills.length > 0
            ? `Demand concentrates around ${topSkills.map((skill) => skill.skill).join(', ')}`
            : 'The current snapshot has limited structured skill evidence',
        summary:
          topSkills.length > 0
            ? `${skillMap.summary.totalSkills} tracked skills appear across ${(skillMap.summary.coverageRatio * 100).toFixed(0)}% of roles with structured skill data.`
            : 'Jobs are present, but structured skill extraction coverage is still thin in this snapshot.',
        evidence:
          topSkills.length > 0
            ? topSkills.map(
                (skill) =>
                  `${skill.skill}: ${skill.demandCount} roles across ${skill.companyCount} company scope`,
              )
            : [
                `Tracked skills: ${skillMap.summary.totalSkills}`,
                `Coverage ratio: ${(skillMap.summary.coverageRatio * 100).toFixed(0)}%`,
              ],
        confidence: skillMap.snapshot?.confidence ?? insightConfidence,
      },
      {
        type: 'content',
        headline:
          latestContent.length > 0
            ? `${companyName} still emits public engineering signals`
            : `${companyName} has no recent linked engineering content in the snapshot`,
        summary:
          latestContent.length > 0
            ? `Recent public content can be used to infer current technical priorities and engineering narratives.`
            : 'This weakens the public signal layer, so hiring and change data should carry more weight.',
        evidence:
          latestContent.length > 0
            ? latestContent.map((item) => item.title)
            : ['No recent content items were attached to this company snapshot.'],
        confidence: brief.sections.latestContent.snapshot?.confidence ?? 0.65,
      },
      {
        type: 'momentum',
        headline:
          closingSoonJobs > 0 || newJobs > 0
            ? 'The current snapshot suggests short-term decision pressure'
            : 'The current snapshot suggests watchlist monitoring is enough',
        summary:
          closingSoonJobs > 0 || newJobs > 0
            ? 'New openings and near-term deadlines mean this company should stay near the top of an applicant watchlist.'
            : 'Without fresh openings or imminent deadlines, the right move is usually to monitor for the next snapshot rather than rush.',
        evidence: [
          `Recent change signals: ${brief.sections.recentChanges.summary.total}`,
          `Upcoming deadline signals: ${brief.sections.upcomingDeadlines.summary.total}`,
        ],
        confidence: insightConfidence,
      },
    ];

    const actions: CompanyResearchAction[] = [];

    if (brief.sections.upcomingDeadlines.signals[0]) {
      actions.push({
        type: 'apply',
        label: `Review deadline for ${brief.sections.upcomingDeadlines.signals[0].title}`,
        reason: `${brief.sections.upcomingDeadlines.signals[0].daysRemaining} days remain before this role closes.`,
        url: brief.sections.upcomingDeadlines.signals[0].url,
      });
    }

    if (brief.sections.recentChanges.signals[0]) {
      actions.push({
        type: 'review',
        label: `Inspect ${brief.sections.recentChanges.signals[0].changeType} signal`,
        reason: `${brief.sections.recentChanges.signals[0].title} appeared in the recent change set.`,
        url: brief.sections.recentChanges.signals[0].url,
      });
    }

    if (latestContent[0]) {
      actions.push({
        type: 'read',
        label: `Read ${latestContent[0].title}`,
        reason:
          'Recent engineering content helps interpret the company technical narrative.',
        url: latestContent[0].link,
      });
    }

    if (topSkills[0]) {
      actions.push({
        type: 'watch',
        label: `Track ${topSkills[0].skill} demand`,
        reason: `${topSkills[0].skill} is the strongest repeated skill signal in the current snapshot.`,
        url: topSkills[0].sampleRoles[0]?.url,
      });
    }

    return {
      thesis,
      insights,
      actions,
    };
  }
}
