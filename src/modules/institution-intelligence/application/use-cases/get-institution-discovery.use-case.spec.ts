import { Test } from '@nestjs/testing';
import {
  INSTITUTION_DISCOVERY_REPOSITORY,
} from '../ports/institution-discovery.repository';
import { InstitutionHomepageSourceGateway } from '../../infrastructure/gateways/institution-homepage-source.gateway';
import { InstitutionLinkDiscoveryService } from '../../domain/services/institution-link-discovery.service';
import { GetInstitutionDiscoveryUseCase } from './get-institution-discovery.use-case';

describe('GetInstitutionDiscoveryUseCase', () => {
  const repository = {
    getSnapshot: jest.fn(),
    saveSnapshot: jest.fn(),
  };

  const gateway = {
    fetchPages: jest.fn(),
  };

  let useCase: GetInstitutionDiscoveryUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetInstitutionDiscoveryUseCase,
        InstitutionLinkDiscoveryService,
        {
          provide: INSTITUTION_DISCOVERY_REPOSITORY,
          useValue: repository,
        },
        {
          provide: InstitutionHomepageSourceGateway,
          useValue: gateway,
        },
      ],
    }).compile();

    useCase = moduleRef.get(GetInstitutionDiscoveryUseCase);
  });

  it('builds and caches discovery snapshot on cache miss', async () => {
    repository.getSnapshot.mockResolvedValue(null);
    gateway.fetchPages.mockResolvedValue([
      {
        url: 'https://example.edu',
        html: `
          <html><body>
            <a href="/scholarship">장학 안내</a>
            <a href="/career">취업지원센터</a>
            <a href="/global">국제교류</a>
          </body></html>
        `,
      },
    ]);

    const result = await useCase.execute('SNU');

    expect(result.institution.id).toBe('SNU');
    expect(result.summary.coveredServiceTypes).toBeGreaterThan(0);
    expect(result.sections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          serviceType: 'scholarship',
          linkCount: 1,
        }),
        expect.objectContaining({
          serviceType: 'career_program',
          linkCount: 1,
        }),
      ]),
    );
    expect(repository.saveSnapshot).toHaveBeenCalledTimes(1);
  });

  it('uses fresh cached snapshot without refetching', async () => {
    repository.getSnapshot.mockResolvedValue({
      institutionId: 'SNU',
      mode: 'live',
      collectedAt: new Date().toISOString(),
      seedUrls: ['https://example.edu'],
      pagesVisited: ['https://example.edu'],
      sections: [
        {
          serviceType: 'scholarship',
          links: [
            {
              title: '장학 안내',
              url: 'https://example.edu/scholarship',
              pageUrl: 'https://example.edu',
              matchedKeywords: ['장학'],
              score: 4,
            },
          ],
        },
      ],
    });

    const result = await useCase.execute('SNU');

    expect(result.summary.totalDiscoveredLinks).toBe(1);
    expect(gateway.fetchPages).not.toHaveBeenCalled();
  });
});
