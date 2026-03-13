import { JobPostingChangeDetectorService } from './job-posting-change-detector.service';
import {
  CAREER_TYPE,
  COMPANY_ENUM,
  EMPLOYMENT_TYPE,
  LOCATION_TYPE,
} from '../../constants/job-codes.constant';
import { JobPosting } from '../../interfaces/job-posting.interface';

describe('JobPostingChangeDetectorService', () => {
  const service = new JobPostingChangeDetectorService();

  const buildJob = (overrides: Partial<JobPosting> = {}): JobPosting => ({
    id: '1',
    company: COMPANY_ENUM.LINE,
    title: 'Backend Engineer',
    department: 'Engineering',
    field: 'Backend',
    requirements: {
      career: CAREER_TYPE.ANY,
      skills: ['Node.js'],
    },
    employmentType: EMPLOYMENT_TYPE.FULL_TIME,
    locations: [LOCATION_TYPE.SEOUL],
    period: {
      start: new Date('2026-03-01T00:00:00.000Z'),
      end: new Date('2026-03-31T00:00:00.000Z'),
    },
    url: 'https://example.com/jobs/1',
    source: {
      originalId: '1',
      originalUrl: 'https://example.com/jobs/1',
    },
    createdAt: new Date('2026-03-01T00:00:00.000Z'),
    updatedAt: new Date('2026-03-01T00:00:00.000Z'),
    ...overrides,
  });

  it('detects new, updated, and removed jobs', () => {
    const previousJobs = [
      buildJob(),
      buildJob({
        id: '2',
        title: 'Frontend Engineer',
      }),
    ];
    const currentJobs = [
      buildJob({
        title: 'Backend Engineer II',
      }),
      buildJob({
        id: '3',
        title: 'Data Engineer',
      }),
    ];

    const result = service.detect({
      previousJobs,
      currentJobs,
      generatedAt: new Date('2026-03-13T00:00:00.000Z'),
    });

    expect(result.summary).toEqual({
      total: 3,
      created: 1,
      updated: 1,
      removed: 1,
    });
    expect(result.signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          changeType: 'new',
          jobId: '3',
        }),
        expect.objectContaining({
          changeType: 'updated',
          jobId: '1',
          changedFields: expect.arrayContaining(['title']),
        }),
        expect.objectContaining({
          changeType: 'removed',
          jobId: '2',
        }),
      ]),
    );
  });
});
