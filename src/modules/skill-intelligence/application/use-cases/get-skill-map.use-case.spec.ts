import { Test } from '@nestjs/testing';
import { JobPostingSnapshotReaderService } from '../../../jobs/application/services/job-posting-snapshot-reader.service';
import { COMPANY_ENUM, EMPLOYMENT_TYPE, CAREER_TYPE, LOCATION_TYPE } from '../../../jobs/constants/job-codes.constant';
import { GetSkillMapUseCase } from './get-skill-map.use-case';
import { SkillMapBuilderService } from '../../domain/services/skill-map-builder.service';
import { SkillNameNormalizerService } from '../../domain/services/skill-name-normalizer.service';

describe('GetSkillMapUseCase', () => {
  const jobPostingSnapshotReaderService = {
    getResolvedAllJobs: jest.fn(),
  };

  let useCase: GetSkillMapUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetSkillMapUseCase,
        SkillMapBuilderService,
        SkillNameNormalizerService,
        {
          provide: JobPostingSnapshotReaderService,
          useValue: jobPostingSnapshotReaderService,
        },
      ],
    }).compile();

    useCase = moduleRef.get(GetSkillMapUseCase);
  });

  it('builds a deterministic skill map from cached jobs', async () => {
    jobPostingSnapshotReaderService.getResolvedAllJobs.mockResolvedValue({
      jobs: [
        {
          id: 'job-1',
          company: COMPANY_ENUM.KAKAO,
          title: 'Backend Engineer',
          department: 'Platform',
          field: 'Backend',
          requirements: {
            career: CAREER_TYPE.ANY,
            skills: ['nodejs', 'TypeScript'],
          },
          employmentType: EMPLOYMENT_TYPE.FULL_TIME,
          locations: [LOCATION_TYPE.BUNDANG],
          period: {
            start: new Date('2026-03-01T00:00:00.000Z'),
            end: new Date('2026-03-20T00:00:00.000Z'),
          },
          url: 'https://example.com/job-1',
          source: {
            originalId: 'job-1',
            originalUrl: 'https://example.com/job-1',
          },
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
          updatedAt: new Date('2026-03-01T00:00:00.000Z'),
        },
        {
          id: 'job-2',
          company: COMPANY_ENUM.LINE,
          title: 'Frontend Engineer',
          department: 'Product',
          field: 'Frontend',
          requirements: {
            career: CAREER_TYPE.NEW,
            skills: ['React', 'typescript'],
          },
          employmentType: EMPLOYMENT_TYPE.FULL_TIME,
          locations: [LOCATION_TYPE.SEOUL],
          period: {
            start: new Date('2026-03-01T00:00:00.000Z'),
            end: new Date('2026-03-25T00:00:00.000Z'),
          },
          url: 'https://example.com/job-2',
          source: {
            originalId: 'job-2',
            originalUrl: 'https://example.com/job-2',
          },
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
          updatedAt: new Date('2026-03-01T00:00:00.000Z'),
        },
        {
          id: 'job-3',
          company: COMPANY_ENUM.NAVER,
          title: 'Data Engineer',
          department: 'Search',
          field: 'Data',
          requirements: {
            career: CAREER_TYPE.EXPERIENCED,
            skills: [],
          },
          employmentType: EMPLOYMENT_TYPE.FULL_TIME,
          locations: [LOCATION_TYPE.BUNDANG],
          period: {
            start: new Date('2026-03-01T00:00:00.000Z'),
            end: new Date('2026-03-26T00:00:00.000Z'),
          },
          url: 'https://example.com/job-3',
          source: {
            originalId: 'job-3',
            originalUrl: 'https://example.com/job-3',
          },
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
          updatedAt: new Date('2026-03-01T00:00:00.000Z'),
        },
      ],
      snapshot: {
        collectedAt: '2026-03-14T00:00:00.000Z',
        staleAt: '2026-03-14T12:00:00.000Z',
        ttlSeconds: 43200,
        confidence: 0.8,
        sourceIds: ['opportunity.jobs.kakao', 'opportunity.jobs.line'],
      },
    });

    const result = await useCase.execute({
      limit: 10,
      minDemand: 1,
      sampleLimit: 2,
    });

    expect(result.summary).toEqual({
      totalJobs: 3,
      jobsWithSkills: 2,
      coverageRatio: 0.67,
      totalSkills: 3,
    });
    expect(result.skills[0]).toEqual(
      expect.objectContaining({
        skill: 'TypeScript',
        demandCount: 2,
        companyCount: 2,
        companies: [COMPANY_ENUM.KAKAO, COMPANY_ENUM.LINE],
      }),
    );
    expect(jobPostingSnapshotReaderService.getResolvedAllJobs).toHaveBeenCalled();
  });
});
