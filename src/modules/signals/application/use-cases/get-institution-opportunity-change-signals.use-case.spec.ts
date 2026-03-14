import { buildSnapshotMetadata } from '../../../../common/utils/snapshot.util';
import { getInstitutionDiscoverySourceId } from '../../../institution-intelligence/constants/institution-discovery.constant';
import { InstitutionOpportunityBuilderService } from '../../../institution-intelligence/domain/services/institution-opportunity-builder.service';
import { InstitutionOpportunityCollection } from '../../../institution-intelligence/domain/types/institution-opportunity.type';
import { InstitutionOpportunityChangeDetectorService } from '../../domain/services/institution-opportunity-change-detector.service';
import { GetInstitutionOpportunityChangeSignalsUseCase } from './get-institution-opportunity-change-signals.use-case';

describe('GetInstitutionOpportunityChangeSignalsUseCase', () => {
  const currentCollectedAt = '2026-03-14T00:00:00.000Z';
  const previousCollectedAt = '2026-03-13T12:00:00.000Z';
  const currentSnapshot = {
    institutionId: 'HANBAT' as const,
    mode: 'live' as const,
    collectedAt: currentCollectedAt,
    seedUrls: [],
    pagesVisited: ['https://hanbat.ac.kr'],
    sections: [],
  };
  const previousSnapshot = {
    institutionId: 'HANBAT' as const,
    mode: 'live' as const,
    collectedAt: previousCollectedAt,
    seedUrls: [],
    pagesVisited: ['https://hanbat.ac.kr'],
    sections: [],
  };
  const currentCollection: InstitutionOpportunityCollection = {
    snapshot: buildSnapshotMetadata({
      collectedAt: currentCollectedAt,
      ttlSeconds: 86400,
      confidence: 0.72,
      sourceIds: [getInstitutionDiscoverySourceId('HANBAT')],
    }),
    mode: 'live',
    items: [
      {
        id: 'HANBAT:scholarship:a',
        institutionId: 'HANBAT',
        institutionName: '국립한밭대학교',
        region: '대전',
        serviceType: 'scholarship',
        title: '장학 공지',
        url: 'https://hanbat.ac.kr/scholarship',
        pageUrl: 'https://hanbat.ac.kr/page',
        matchedKeywords: ['장학'],
        score: 0.9,
        discoveryMode: 'live',
        sourceId: 'institution.hanbat.discovery',
      },
      {
        id: 'HANBAT:career_program:b',
        institutionId: 'HANBAT',
        institutionName: '국립한밭대학교',
        region: '대전',
        serviceType: 'career_program',
        title: '취업 프로그램',
        url: 'https://hanbat.ac.kr/career',
        pageUrl: 'https://hanbat.ac.kr/page',
        matchedKeywords: ['취업'],
        score: 0.8,
        discoveryMode: 'live',
        sourceId: 'institution.hanbat.discovery',
      },
    ],
  };
  const previousCollection: InstitutionOpportunityCollection = {
    snapshot: buildSnapshotMetadata({
      collectedAt: previousCollectedAt,
      ttlSeconds: 86400,
      confidence: 0.72,
      sourceIds: [getInstitutionDiscoverySourceId('HANBAT')],
    }),
    mode: 'live',
    items: [
      {
        id: 'HANBAT:scholarship:a',
        institutionId: 'HANBAT',
        institutionName: '국립한밭대학교',
        region: '대전',
        serviceType: 'scholarship',
        title: '장학 공지 (이전)',
        url: 'https://hanbat.ac.kr/scholarship',
        pageUrl: 'https://hanbat.ac.kr/page',
        matchedKeywords: ['장학'],
        score: 0.9,
        discoveryMode: 'live',
        sourceId: 'institution.hanbat.discovery',
      },
      {
        id: 'HANBAT:global_program:c',
        institutionId: 'HANBAT',
        institutionName: '국립한밭대학교',
        region: '대전',
        serviceType: 'global_program',
        title: '글로벌 교류',
        url: 'https://hanbat.ac.kr/global',
        pageUrl: 'https://hanbat.ac.kr/page',
        matchedKeywords: ['국제'],
        score: 0.6,
        discoveryMode: 'live',
        sourceId: 'institution.hanbat.discovery',
      },
    ],
  };

  const institutionDiscoveryRepository = {
    getSnapshot: jest.fn(),
    getPreviousSnapshot: jest.fn(),
    saveSnapshot: jest.fn(),
  };
  const getInstitutionDiscoveryUseCase = {
    execute: jest.fn(),
  };
  const institutionOpportunityBuilderService = {
    buildFromSnapshot: jest.fn(),
  } as unknown as InstitutionOpportunityBuilderService;

  let useCase: GetInstitutionOpportunityChangeSignalsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetInstitutionOpportunityChangeSignalsUseCase(
      institutionDiscoveryRepository,
      getInstitutionDiscoveryUseCase as never,
      institutionOpportunityBuilderService,
      new InstitutionOpportunityChangeDetectorService(),
    );

    institutionDiscoveryRepository.getSnapshot.mockImplementation(
      async (institution: string) =>
        institution === 'HANBAT' ? currentSnapshot : null,
    );
    institutionDiscoveryRepository.getPreviousSnapshot.mockImplementation(
      async (institution: string) =>
        institution === 'HANBAT' ? previousSnapshot : null,
    );
    getInstitutionDiscoveryUseCase.execute.mockResolvedValue(undefined);
    (
      institutionOpportunityBuilderService.buildFromSnapshot as jest.Mock
    ).mockImplementation(
      (
        _registryEntry: unknown,
        snapshot: { collectedAt: string },
      ): InstitutionOpportunityCollection =>
        snapshot.collectedAt === currentCollectedAt
          ? currentCollection
          : previousCollection,
    );
  });

  it('builds and filters institution opportunity change signals', async () => {
    const result = await useCase.execute({
      institutions: 'HANBAT',
      limit: 10,
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
          serviceType: 'career_program',
        }),
        expect.objectContaining({
          changeType: 'updated',
          serviceType: 'scholarship',
          changedFields: ['title'],
        }),
        expect.objectContaining({
          changeType: 'removed',
          serviceType: 'global_program',
        }),
      ]),
    );
  });

  it('filters institution signals by serviceType and changeType', async () => {
    const result = await useCase.execute({
      institutions: 'HANBAT',
      serviceType: 'scholarship',
      changeType: 'updated',
    });

    expect(result.summary).toEqual({
      total: 1,
      created: 0,
      updated: 1,
      removed: 0,
    });
    expect(result.signals).toHaveLength(1);
    expect(result.signals[0]).toEqual(
      expect.objectContaining({
        changeType: 'updated',
        serviceType: 'scholarship',
      }),
    );
  });
});
