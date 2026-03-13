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
  collectionUrl: string;
  maxCollectionsPerDay: number;
  freshnessTtlSeconds: number;
  confidence: number;
  notes?: string;
}
