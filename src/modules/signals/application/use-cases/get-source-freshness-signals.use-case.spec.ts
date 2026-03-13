import { Test, TestingModule } from '@nestjs/testing';
import { SourceRegistryService } from '../../../source-registry/source-registry.service';
import { SourceFreshnessEvaluatorService } from '../../domain/services/source-freshness-evaluator.service';
import { SourceLastUpdateResolverService } from '../services/source-last-update-resolver.service';
import { GetSourceFreshnessSignalsUseCase } from './get-source-freshness-signals.use-case';

describe('GetSourceFreshnessSignalsUseCase', () => {
  let useCase: GetSourceFreshnessSignalsUseCase;

  const sourceRegistryService = {
    list: jest.fn(),
  };

  const sourceLastUpdateResolverService = {
    resolve: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetSourceFreshnessSignalsUseCase,
        SourceFreshnessEvaluatorService,
        {
          provide: SourceRegistryService,
          useValue: sourceRegistryService,
        },
        {
          provide: SourceLastUpdateResolverService,
          useValue: sourceLastUpdateResolverService,
        },
      ],
    }).compile();

    useCase = module.get(GetSourceFreshnessSignalsUseCase);
    jest.clearAllMocks();
  });

  it('summarizes fresh and stale sources', async () => {
    sourceRegistryService.list.mockReturnValue([
      {
        id: 'content.blog.toss',
        name: '토스',
        provider: '토스',
        context: 'content',
        collectionMode: 'feed',
        tier: 'official_feed',
        active: true,
        collectionUrl: 'https://toss.tech/rss.xml',
        maxCollectionsPerDay: 3,
        freshnessTtlSeconds: 86400,
        confidence: 0.9,
      },
      {
        id: 'institution.hanbat.notice',
        name: '공지사항',
        provider: 'HANBAT',
        context: 'institution',
        collectionMode: 'html',
        tier: 'public_page',
        active: true,
        collectionUrl: 'https://www.hanbat.ac.kr',
        maxCollectionsPerDay: 3,
        freshnessTtlSeconds: 3600,
        confidence: 0.8,
      },
    ]);
    sourceLastUpdateResolverService.resolve.mockImplementation((sourceId: string) =>
      Promise.resolve(
        sourceId === 'content.blog.toss'
          ? '2026-03-13T00:00:00.000Z'
          : '2026-03-12T00:00:00.000Z',
      ),
    );

    const result = await useCase.execute();

    expect(result.summary.total).toBe(2);
    expect(result.summary.fresh).toBeGreaterThanOrEqual(0);
    expect(result.signals).toHaveLength(2);
    expect(result.signals.map((signal) => signal.sourceId)).toEqual([
      'content.blog.toss',
      'institution.hanbat.notice',
    ]);
  });
});
