import { SnapshotMetadata } from '../../../../common/types/snapshot.types';
import { InstitutionType } from '../../constants/institution-registry.constant';
import { InstitutionServiceType } from '../../constants/institution-service-type.enum';
import { InstitutionOpportunityDiscoveryMode } from '../../constants/institution-opportunity.constant';

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
  discoveryMode: InstitutionOpportunityDiscoveryMode;
  sourceId: string;
}

export interface InstitutionOpportunityCollection {
  items: InstitutionOpportunityItem[];
  snapshot: SnapshotMetadata;
  mode: InstitutionOpportunityDiscoveryMode;
}
