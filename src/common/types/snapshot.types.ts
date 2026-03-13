export type SourceContext =
  | 'opportunity'
  | 'company'
  | 'content'
  | 'institution';

export type SourceCollectionMode = 'api' | 'feed' | 'html' | 'browser';

export type SourceTier =
  | 'official_api'
  | 'official_feed'
  | 'public_page'
  | 'browser_automation';

export type SourceRiskTier = 'low' | 'medium' | 'high';
export type SourceState = 'active' | 'paused' | 'disabled';

export interface SnapshotMetadata {
  collectedAt: string;
  staleAt: string;
  ttlSeconds: number;
  confidence: number;
  sourceIds: string[];
}

export interface SourceRegistryEntry {
  id: string;
  name: string;
  provider: string;
  context: SourceContext;
  collectionMode: SourceCollectionMode;
  tier: SourceTier;
  active: boolean;
  state: SourceState;
  collectionUrl: string;
  maxCollectionsPerDay: number;
  minimumIntervalHours: number;
  freshnessTtlSeconds: number;
  confidence: number;
  riskTier: SourceRiskTier;
  safeCollectionPolicy: string;
  notes?: string;
}
