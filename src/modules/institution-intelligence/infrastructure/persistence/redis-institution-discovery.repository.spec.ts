import { RedisInstitutionDiscoveryRepository } from './redis-institution-discovery.repository';

describe('RedisInstitutionDiscoveryRepository', () => {
  const store = new Map<string, string>();
  const redisService = {
    get: jest.fn(async (key: string) => {
      const value = store.get(key);
      return value ? JSON.parse(value) : null;
    }),
    set: jest.fn(async (key: string, value: unknown) => {
      store.set(key, JSON.stringify(value));
    }),
  };

  let repository: RedisInstitutionDiscoveryRepository;

  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
    repository = new RedisInstitutionDiscoveryRepository(redisService as never);
  });

  it('updates previous snapshot to the current baseline when the snapshot content is unchanged', async () => {
    const snapshot = {
      institutionId: 'SNU' as const,
      mode: 'live' as const,
      collectedAt: '2026-03-14T00:00:00.000Z',
      seedUrls: ['https://www.snu.ac.kr'],
      pagesVisited: ['https://www.snu.ac.kr'],
      sections: [
        {
          serviceType: 'scholarship' as const,
          links: [
            {
              title: '장학금·학자금',
              url: 'https://www.snu.ac.kr/scholarship',
              pageUrl: 'https://www.snu.ac.kr/page',
              matchedKeywords: ['장학'],
              score: 0.9,
              recordType: 'post' as const,
              excerpt: '장학금 신청 안내',
              postedAt: '2026-03-14',
            },
          ],
        },
      ],
    };

    await repository.saveSnapshot('SNU', snapshot);
    await repository.saveSnapshot('SNU', snapshot);

    const previous = await repository.getPreviousSnapshot('SNU');

    expect(previous).toEqual(snapshot);
  });
});
