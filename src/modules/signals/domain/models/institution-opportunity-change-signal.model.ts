import { SnapshotMetadata } from '../../../../common/types/snapshot.types';
import { InstitutionType } from '../../../institution-intelligence/constants/institution-id.constant';
import { InstitutionOpportunityDiscoveryMode } from '../../../institution-intelligence/constants/institution-opportunity.constant';
import { InstitutionServiceType } from '../../../institution-intelligence/constants/institution-service-type.enum';
import { InstitutionDiscoveryRecordType } from '../../../institution-intelligence/domain/types/institution-discovery.type';

export type InstitutionOpportunityChangeType = 'new' | 'updated' | 'removed';

export interface InstitutionOpportunityChangeSignal {
  type: 'institution_opportunity_change';
  changeType: InstitutionOpportunityChangeType;
  opportunityId: string;
  institutionId: InstitutionType;
  institutionName: string;
  region: string;
  serviceType: InstitutionServiceType;
  title: string;
  url: string;
  pageUrl: string;
  discoveryMode: InstitutionOpportunityDiscoveryMode;
  recordType: InstitutionDiscoveryRecordType;
  excerpt?: string;
  postedAt?: string;
  rank: number;
  sourceId: string;
  changedFields?: string[];
}

export interface InstitutionOpportunityChangeSummary {
  total: number;
  created: number;
  updated: number;
  removed: number;
}

export interface InstitutionOpportunityChangeResult {
  generatedAt: string;
  baselineCollectedAt?: string;
  snapshot?: SnapshotMetadata;
  summary: InstitutionOpportunityChangeSummary;
  signals: InstitutionOpportunityChangeSignal[];
}
