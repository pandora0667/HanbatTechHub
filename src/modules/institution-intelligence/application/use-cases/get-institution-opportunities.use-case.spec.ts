import { Test } from '@nestjs/testing';
import { SourceRegistryService } from '../../../source-registry/source-registry.service';
import { InstitutionOpportunityBuilderService } from '../../domain/services/institution-opportunity-builder.service';
import { GetInstitutionDiscoveryUseCase } from './get-institution-discovery.use-case';
import { GetInstitutionOpportunitiesUseCase } from './get-institution-opportunities.use-case';

describe('GetInstitutionOpportunitiesUseCase', () => {
  let useCase: GetInstitutionOpportunitiesUseCase;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        GetInstitutionOpportunitiesUseCase,
        InstitutionOpportunityBuilderService,
        {
          provide: GetInstitutionDiscoveryUseCase,
          useValue: {
            execute: jest.fn(async () => ({
              generatedAt: '2026-03-14T00:00:00.000Z',
              institution: { id: 'SNU' },
              snapshot: {
                collectedAt: '2026-03-14T00:00:00.000Z',
                staleAt: '2026-03-15T00:00:00.000Z',
                ttlSeconds: 86400,
                confidence: 0.72,
                sourceIds: ['institution.snu.discovery'],
              },
              summary: {
                mode: 'live',
                coveredServiceTypes: 2,
                totalRequestedServiceTypes: 10,
                totalDiscoveredLinks: 3,
                pagesVisited: 1,
              },
              sections: [
                {
                  serviceType: 'scholarship',
                  linkCount: 1,
                  links: [
                    {
                      title: '장학 안내',
                      url: 'https://example.com/scholarship',
                      pageUrl: 'https://example.com',
                      matchedKeywords: ['장학'],
                      score: 4,
                      recordType: 'post' as const,
                      excerpt: '2026-03-14 장학 신청 안내입니다.',
                      postedAt: '2026-03-14',
                    },
                  ],
                },
                {
                  serviceType: 'career_program',
                  linkCount: 1,
                  links: [
                    {
                      title: '취업 지원',
                      url: 'https://example.com/career',
                      pageUrl: 'https://example.com',
                      matchedKeywords: ['취업'],
                      score: 3,
                      recordType: 'program' as const,
                      excerpt: '커리어 프로그램 모집 중',
                    },
                  ],
                },
              ],
            })),
          },
        },
        {
          provide: SourceRegistryService,
          useValue: {
            list: jest.fn(() => [
              { id: 'institution.snu.discovery', name: 'SNU Discovery' },
            ]),
          },
        },
      ],
    }).compile();

    useCase = moduleRef.get(GetInstitutionOpportunitiesUseCase);
  });

  it('builds institution opportunities from discovery sections', async () => {
    const result = await useCase.execute('SNU', {
      page: 1,
      limit: 20,
    });

    expect(result.institution?.id).toBe('SNU');
    expect(result.summary.totalOpportunities).toBe(2);
    expect(result.summary.serviceTypesCovered).toBe(2);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          serviceType: 'scholarship',
          title: '장학 안내',
          sourceId: 'institution.snu.discovery',
          recordType: 'post',
          rank: expect.any(Number),
        }),
        expect.objectContaining({
          serviceType: 'career_program',
          title: '취업 지원',
          recordType: 'program',
        }),
      ]),
    );
    expect(result.sources).toHaveLength(1);
  });

  it('filters institution opportunities by serviceType and keyword', async () => {
    const result = await useCase.execute('SNU', {
      page: 1,
      limit: 20,
      serviceType: 'scholarship',
      keyword: '장학',
    });

    expect(result.summary.totalOpportunities).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].serviceType).toBe('scholarship');
  });
});
