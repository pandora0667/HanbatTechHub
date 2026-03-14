import { SourceRegistryEntry } from '../../common/types/snapshot.types';
import { TECH_BLOG_RSS, DEFAULT_REDIS_TTL } from '../blog/constants/blog.constant';
import {
  INSTITUTION_DISCOVERY_CACHE_TTL,
  getInstitutionDiscoverySourceId,
} from '../institution-intelligence/constants/institution-discovery.constant';
import { INSTITUTION_REGISTRY } from '../institution-intelligence/constants/institution-registry.constant';
import { INSTITUTION_SOURCE_CATALOG } from '../institution-intelligence/data/institution-source-catalog.data';
import { JOBS_FRESHNESS_TTL } from '../jobs/constants/redis.constant';
import { JOB_SOURCE_DESCRIPTORS } from '../jobs/constants/job-source.constant';
import { MENU_CACHE_TTL } from '../menu/constants/menu.constant';
import { NOTICE_CACHE_TTL } from '../notice/constants/notice.constant';

const INSTITUTION_SOURCES: SourceRegistryEntry[] = INSTITUTION_SOURCE_CATALOG
  .filter((entry) => entry.sourceId)
  .map((entry) => ({
    id: entry.sourceId!,
    name: entry.name,
    provider: entry.institutionId,
    context: 'institution' as const,
    collectionMode: entry.collectionMode,
    tier: entry.tier,
    active: true,
    state: 'active' as const,
    collectionUrl: entry.seedUrl,
    maxCollectionsPerDay: entry.sourceId === 'institution.hanbat.menu' ? 1 : 3,
    minimumIntervalHours: entry.sourceId === 'institution.hanbat.menu' ? 24 : 8,
    freshnessTtlSeconds:
      entry.sourceId === 'institution.hanbat.menu'
        ? MENU_CACHE_TTL
        : NOTICE_CACHE_TTL,
    confidence: entry.sourceId === 'institution.hanbat.menu' ? 0.86 : 0.8,
    riskTier: entry.sourceId === 'institution.hanbat.menu' ? 'low' : 'medium',
    safeCollectionPolicy:
      entry.sourceId === 'institution.hanbat.menu'
        ? 'single daily snapshot collection only'
        : 'low-frequency HTML collection with cache-only serving',
    notes:
      entry.sourceId === 'institution.hanbat.menu'
        ? '학교 공개 AJAX 응답을 스냅샷으로 수집합니다.'
        : '공개 공지 게시판을 저빈도로 스냅샷 수집합니다.',
  }));

const INSTITUTION_DISCOVERY_SOURCES: SourceRegistryEntry[] = INSTITUTION_REGISTRY.map(
  (institution) => ({
    id: getInstitutionDiscoverySourceId(institution.id),
    name: `${institution.name} public service discovery`,
    provider: institution.id,
    context: 'institution' as const,
    collectionMode: 'html' as const,
    tier: 'public_page' as const,
    active: true,
    state: 'active' as const,
    collectionUrl: institution.officialEntryUrl,
    maxCollectionsPerDay: 3,
    minimumIntervalHours: 8,
    freshnessTtlSeconds: INSTITUTION_DISCOVERY_CACHE_TTL,
    confidence: 0.72,
    riskTier:
      institution.siteFamily === 'custom-root' ? 'medium' : 'low',
    safeCollectionPolicy:
      'homepage-only low-frequency discovery snapshot with bounded candidate URLs',
    notes:
      institution.rolloutWave === 1
        ? 'Wave-1 institution discovery target.'
        : 'Nationwide institution discovery registry source.',
  }),
);

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
  ...INSTITUTION_DISCOVERY_SOURCES,
  ...JOB_SOURCES,
  ...BLOG_SOURCES,
].sort((left, right) =>
  `${left.context}:${left.name}`.localeCompare(`${right.context}:${right.name}`),
);
