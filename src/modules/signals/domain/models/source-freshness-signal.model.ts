import { SourceCollectionMode, SourceContext, SourceTier } from '../../../../common/types/snapshot.types';

export type SourceFreshnessStatus = 'fresh' | 'stale' | 'missing';

export interface SourceFreshnessSignal {
  sourceId: string;
  name: string;
  provider: string;
  context: SourceContext;
  collectionMode: SourceCollectionMode;
  tier: SourceTier;
  status: SourceFreshnessStatus;
  maxCollectionsPerDay: number;
  confidence: number;
  collectionUrl: string;
  collectedAt?: string;
  staleAt?: string;
  ageSeconds?: number;
}

export interface SourceFreshnessSummary {
  total: number;
  fresh: number;
  stale: number;
  missing: number;
}
