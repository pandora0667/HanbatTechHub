import { SourceRegistryEntry } from '../../common/types/snapshot.types';
import { TECH_BLOG_RSS, DEFAULT_REDIS_TTL } from '../blog/constants/blog.constant';
import { JOBS_FRESHNESS_TTL } from '../jobs/constants/redis.constant';
import { JOB_SOURCE_DESCRIPTORS } from '../jobs/constants/job-source.constant';
import { MENU_CACHE_TTL } from '../menu/constants/menu.constant';
import { HANBAT_NOTICE, NOTICE_CACHE_TTL } from '../notice/constants/notice.constant';

const INSTITUTION_SOURCES: SourceRegistryEntry[] = [
  {
    id: 'institution.hanbat.menu',
    name: '한밭대학교 학식',
    provider: 'HANBAT',
    context: 'institution',
    collectionMode: 'api',
    tier: 'public_page',
    active: true,
    state: 'active',
    collectionUrl:
      'https://www.hanbat.ac.kr/prog/cafeteria/kor/sub06_030301/list.do',
    maxCollectionsPerDay: 1,
    minimumIntervalHours: 24,
    freshnessTtlSeconds: MENU_CACHE_TTL,
    confidence: 0.86,
    riskTier: 'low',
    safeCollectionPolicy: 'single daily snapshot collection only',
    notes: '학교 공개 AJAX 응답을 스냅샷으로 수집합니다.',
  },
  {
    id: 'institution.hanbat.notice',
    name: '한밭대학교 공지사항',
    provider: 'HANBAT',
    context: 'institution',
    collectionMode: 'html',
    tier: 'public_page',
    active: true,
    state: 'active',
    collectionUrl: HANBAT_NOTICE.BASE_URL,
    maxCollectionsPerDay: 3,
    minimumIntervalHours: 8,
    freshnessTtlSeconds: NOTICE_CACHE_TTL,
    confidence: 0.8,
    riskTier: 'medium',
    safeCollectionPolicy: 'low-frequency HTML collection with cache-only serving',
    notes: '공개 공지 게시판을 저빈도로 스냅샷 수집합니다.',
  },
];

const JOB_SOURCES: SourceRegistryEntry[] = JOB_SOURCE_DESCRIPTORS.map(
  (source) => ({
    id: source.id,
    name: source.name,
    provider: source.provider,
    context: 'opportunity',
    collectionMode: source.collectionMode,
    tier: source.tier,
    active: true,
    state: 'active',
    collectionUrl: source.collectionUrl,
    maxCollectionsPerDay: 3,
    minimumIntervalHours: 8,
    freshnessTtlSeconds: JOBS_FRESHNESS_TTL,
    confidence: source.confidence,
    riskTier: source.tier === 'browser_automation' ? 'high' : 'medium',
    safeCollectionPolicy:
      source.tier === 'browser_automation'
        ? 'browser automation only on low-frequency guarded schedule'
        : 'snapshot collection only with low-frequency schedule',
  }),
);

const BLOG_SOURCES: SourceRegistryEntry[] = Object.entries(TECH_BLOG_RSS).map(
  ([company, source]) => ({
    id: `content.blog.${company.toLowerCase()}`,
    name: source.name,
    provider: source.name,
    context: 'content' as const,
    collectionMode: 'feed' as const,
    tier: 'official_feed' as const,
    active: true,
    state: 'active' as const,
    collectionUrl: source.url,
    maxCollectionsPerDay: 3,
    minimumIntervalHours: 8,
    freshnessTtlSeconds: DEFAULT_REDIS_TTL,
    confidence: 0.9,
    riskTier: source.requestOptions?.rejectUnauthorized === false ? 'medium' : 'low',
    safeCollectionPolicy:
      source.requestOptions?.rejectUnauthorized === false
        ? 'guarded feed polling with TLS exception handling'
        : 'feed polling only on bounded schedule',
    notes: source.requestOptions?.rejectUnauthorized === false
      ? '간헐적인 TLS 체인 이슈가 있어 안전한 예외 처리가 적용됩니다.'
      : undefined,
  }),
);

export const SOURCE_REGISTRY: SourceRegistryEntry[] = [
  ...INSTITUTION_SOURCES,
  ...JOB_SOURCES,
  ...BLOG_SOURCES,
].sort((left, right) =>
  `${left.context}:${left.name}`.localeCompare(`${right.context}:${right.name}`),
);
