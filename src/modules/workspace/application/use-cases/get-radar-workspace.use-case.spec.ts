import { Test } from '@nestjs/testing';
import { SignalsService } from '../../../signals/signals.service';
import { GetRadarWorkspaceUseCase } from './get-radar-workspace.use-case';
import { RadarWorkspaceOverviewService } from '../../domain/services/radar-workspace-overview.service';
import { WorkspaceSectionBuilderService } from '../services/workspace-section-builder.service';

describe('GetRadarWorkspaceUseCase', () => {
  const signalsService = {
    getSourceFreshnessSignals: jest.fn(),
    getOpportunityChangeSignals: jest.fn(),
    getUpcomingOpportunitySignals: jest.fn(),
    getInstitutionOpportunityChangeSignals: jest.fn(),
  };
  const workspaceSectionBuilderService = {
    limitFreshnessSignals: jest.fn(),
  };

  let useCase: GetRadarWorkspaceUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetRadarWorkspaceUseCase,
        RadarWorkspaceOverviewService,
        {
          provide: SignalsService,
          useValue: signalsService,
        },
        {
          provide: WorkspaceSectionBuilderService,
          useValue: workspaceSectionBuilderService,
        },
      ],
    }).compile();

    useCase = moduleRef.get(GetRadarWorkspaceUseCase);
  });

  it('aggregates radar sections from signal services', async () => {
    const staleSignals = {
      generatedAt: '2026-03-14T00:00:00.000Z',
      summary: { total: 2, fresh: 0, stale: 2, missing: 0 },
      signals: [{ sourceId: 'content.blog.a' }, { sourceId: 'content.blog.b' }],
    };
    const missingSignals = {
      generatedAt: '2026-03-14T00:00:00.000Z',
      summary: { total: 1, fresh: 0, stale: 0, missing: 1 },
      signals: [{ sourceId: 'content.blog.c' }],
    };
    signalsService.getSourceFreshnessSignals
      .mockResolvedValueOnce(staleSignals)
      .mockResolvedValueOnce(missingSignals);
    workspaceSectionBuilderService.limitFreshnessSignals
      .mockImplementationOnce((response) => ({
        ...response,
        summary: { total: 1, fresh: 0, stale: 1, missing: 0 },
        signals: response.signals.slice(0, 1),
      }))
      .mockImplementationOnce((response) => ({
        ...response,
        summary: { total: 1, fresh: 0, stale: 0, missing: 1 },
        signals: response.signals.slice(0, 1),
      }));
    signalsService.getOpportunityChangeSignals
      .mockResolvedValueOnce({
        generatedAt: '2026-03-14T00:00:00.000Z',
        summary: { total: 3, created: 3, updated: 0, removed: 0 },
        signals: [{ jobId: '1' }, { jobId: '2' }, { jobId: '3' }],
        snapshot: {
          collectedAt: '2026-03-14T00:00:00.000Z',
          staleAt: '2026-03-14T12:00:00.000Z',
          ttlSeconds: 43200,
          confidence: 0.8,
          sourceIds: ['opportunity.jobs.naver'],
        },
      })
      .mockResolvedValueOnce({
        generatedAt: '2026-03-14T00:00:00.000Z',
        summary: { total: 2, created: 0, updated: 2, removed: 0 },
        signals: [{ jobId: '4' }, { jobId: '5' }],
        snapshot: {
          collectedAt: '2026-03-14T00:00:00.000Z',
          staleAt: '2026-03-14T12:00:00.000Z',
          ttlSeconds: 43200,
          confidence: 0.8,
          sourceIds: ['opportunity.jobs.naver'],
        },
      })
      .mockResolvedValueOnce({
        generatedAt: '2026-03-14T00:00:00.000Z',
        summary: { total: 1, created: 0, updated: 0, removed: 1 },
        signals: [{ jobId: '6' }],
        snapshot: {
          collectedAt: '2026-03-14T00:00:00.000Z',
          staleAt: '2026-03-14T12:00:00.000Z',
          ttlSeconds: 43200,
          confidence: 0.8,
          sourceIds: ['opportunity.jobs.naver'],
        },
      });
    signalsService.getUpcomingOpportunitySignals.mockResolvedValue({
      generatedAt: '2026-03-14T00:00:00.000Z',
      summary: {
        total: 4,
        closingToday: 1,
        closingSoon: 2,
        watch: 1,
        windowDays: 7,
      },
      signals: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
      snapshot: {
        collectedAt: '2026-03-14T00:00:00.000Z',
        staleAt: '2026-03-14T12:00:00.000Z',
        ttlSeconds: 43200,
        confidence: 0.8,
        sourceIds: ['opportunity.jobs.naver'],
      },
    });
    signalsService.getInstitutionOpportunityChangeSignals
      .mockResolvedValueOnce({
        generatedAt: '2026-03-14T00:00:00.000Z',
        summary: { total: 2, created: 2, updated: 0, removed: 0 },
        signals: [{ opportunityId: 'i1' }, { opportunityId: 'i2' }],
        snapshot: {
          collectedAt: '2026-03-14T00:00:00.000Z',
          staleAt: '2026-03-15T00:00:00.000Z',
          ttlSeconds: 86400,
          confidence: 0.72,
          sourceIds: ['institution.snu.discovery'],
        },
      })
      .mockResolvedValueOnce({
        generatedAt: '2026-03-14T00:00:00.000Z',
        summary: { total: 1, created: 0, updated: 1, removed: 0 },
        signals: [{ opportunityId: 'i3' }],
        snapshot: {
          collectedAt: '2026-03-14T00:00:00.000Z',
          staleAt: '2026-03-15T00:00:00.000Z',
          ttlSeconds: 86400,
          confidence: 0.72,
          sourceIds: ['institution.snu.discovery'],
        },
      })
      .mockResolvedValueOnce({
        generatedAt: '2026-03-14T00:00:00.000Z',
        summary: { total: 1, created: 0, updated: 0, removed: 1 },
        signals: [{ opportunityId: 'i4' }],
        snapshot: {
          collectedAt: '2026-03-14T00:00:00.000Z',
          staleAt: '2026-03-15T00:00:00.000Z',
          ttlSeconds: 86400,
          confidence: 0.72,
          sourceIds: ['institution.snu.discovery'],
        },
      });

    const result = await useCase.execute({
      company: 'NAVER',
      sourceLimit: 1,
      changeLimit: 5,
      deadlineLimit: 4,
      deadlineWindowDays: 7,
    });

    expect(signalsService.getSourceFreshnessSignals).toHaveBeenNthCalledWith(1, {
      status: 'stale',
    });
    expect(signalsService.getSourceFreshnessSignals).toHaveBeenNthCalledWith(2, {
      status: 'missing',
    });
    expect(workspaceSectionBuilderService.limitFreshnessSignals).toHaveBeenNthCalledWith(
      1,
      staleSignals,
      1,
    );
    expect(workspaceSectionBuilderService.limitFreshnessSignals).toHaveBeenNthCalledWith(
      2,
      missingSignals,
      1,
    );
    expect(signalsService.getOpportunityChangeSignals).toHaveBeenNthCalledWith(1, {
      company: 'NAVER',
      changeType: 'new',
      limit: 5,
    });
    expect(signalsService.getOpportunityChangeSignals).toHaveBeenNthCalledWith(2, {
      company: 'NAVER',
      changeType: 'updated',
      limit: 5,
    });
    expect(signalsService.getOpportunityChangeSignals).toHaveBeenNthCalledWith(3, {
      company: 'NAVER',
      changeType: 'removed',
      limit: 5,
    });
    expect(signalsService.getUpcomingOpportunitySignals).toHaveBeenCalledWith({
      days: 7,
      limit: 4,
    });
    expect(
      signalsService.getInstitutionOpportunityChangeSignals,
    ).toHaveBeenNthCalledWith(1, {
      institutions: undefined,
      changeType: 'new',
      limit: 5,
    });
    expect(
      signalsService.getInstitutionOpportunityChangeSignals,
    ).toHaveBeenNthCalledWith(2, {
      institutions: undefined,
      changeType: 'updated',
      limit: 5,
    });
    expect(
      signalsService.getInstitutionOpportunityChangeSignals,
    ).toHaveBeenNthCalledWith(3, {
      institutions: undefined,
      changeType: 'removed',
      limit: 5,
    });
    expect(result.overview).toEqual({
      staleSources: 1,
      missingSources: 1,
      newOpportunities: 3,
      updatedOpportunities: 2,
      removedOpportunities: 1,
      closingSoonOpportunities: 4,
      newInstitutionOpportunities: 2,
      updatedInstitutionOpportunities: 1,
      removedInstitutionOpportunities: 1,
    });
    expect(result.sections.staleSources.signals).toHaveLength(1);
    expect(result.sections.missingSources.signals).toHaveLength(1);
    expect(staleSignals.signals).toHaveLength(2);
    expect(missingSignals.signals).toHaveLength(1);
    expect(result.snapshot).toEqual(
      expect.objectContaining({
        sourceIds: ['institution.snu.discovery', 'opportunity.jobs.naver'],
      }),
    );
  });
});
