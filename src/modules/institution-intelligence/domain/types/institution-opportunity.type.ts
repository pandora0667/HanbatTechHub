import { SnapshotMetadata } from '../../../../common/types/snapshot.types';
import { InstitutionType } from '../../constants/institution-registry.constant';
import { InstitutionServiceType } from '../../constants/institution-service-type.enum';
import { InstitutionOpportunityDiscoveryMode } from '../../constants/institution-opportunity.constant';
import { InstitutionDiscoveryRecordType } from './institution-discovery.type';

export interface InstitutionOpportunityItem {
  id: string;
  institutionId: InstitutionType;
  institutionName: string;
  region: string;
  serviceType: InstitutionServiceType;
  title: string;
  url: string;
  pageUrl: string;
  matchedKeywords: string[];
  score: number;
  rank: number;
  discoveryMode: InstitutionOpportunityDiscoveryMode;
  recordType: InstitutionDiscoveryRecordType;
  excerpt?: string;
  postedAt?: string;
  sourceId: string;
}

export interface InstitutionOpportunityCollection {
  items: InstitutionOpportunityItem[];
  snapshot: SnapshotMetadata;
  mode: InstitutionOpportunityDiscoveryMode;
}
