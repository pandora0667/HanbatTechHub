import { Test } from '@nestjs/testing';
import { GetSourceHealthUseCase } from './get-source-health.use-case';
import { SourceRegistryService } from '../../source-registry.service';
import { SourceRuntimeStatusService } from '../services/source-runtime-status.service';

describe('GetSourceHealthUseCase', () => {
  const sourceRegistryService = {
    list: jest.fn(() => [
      {
        id: 'opportunity.jobs.naver',
        name: 'NAVER Careers',
        provider: 'NAVER',
        context: 'opportunity',
        collectionMode: 'html',
        tier: 'public_page',
        active: true,
        state: 'active',
        collectionUrl: 'https://example.com',
        maxCollectionsPerDay: 3,
        minimumIntervalHours: 8,
        freshnessTtlSeconds: 43200,
        confidence: 0.8,
        riskTier: 'medium',
        safeCollectionPolicy: 'snapshot only',
      },
    ]),
  };
  const sourceRuntimeStatusService = {
    getLastSuccessAt: jest.fn(),
  };

  let useCase: GetSourceHealthUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetSourceHealthUseCase,
        {
          provide: SourceRegistryService,
          useValue: sourceRegistryService,
        },
        {
          provide: SourceRuntimeStatusService,
          useValue: sourceRuntimeStatusService,
        },
      ],
    }).compile();

    useCase = moduleRef.get(GetSourceHealthUseCase);
  });

  it('builds source health view with runtime collection metadata', async () => {
    sourceRuntimeStatusService.getLastSuccessAt.mockResolvedValue(
      new Date().toISOString(),
    );

    const result = await useCase.execute();

    expect(result.sources[0]).toEqual(
      expect.objectContaining({
        sourceId: 'opportunity.jobs.naver',
        state: 'active',
        riskTier: 'medium',
        freshnessStatus: expect.any(String),
        failureCount: 0,
      }),
    );
  });
});
