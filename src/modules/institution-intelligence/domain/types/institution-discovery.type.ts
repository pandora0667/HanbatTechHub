import { InstitutionType } from '../../constants/institution-id.constant';
import { InstitutionServiceType } from '../../constants/institution-service-type.enum';

export type InstitutionDiscoveryRecordType =
  | 'landing_page'
  | 'listing'
  | 'program'
  | 'post';

export interface InstitutionDiscoveryLink {
  title: string;
  url: string;
  pageUrl: string;
  matchedKeywords: string[];
  score: number;
  recordType: InstitutionDiscoveryRecordType;
  excerpt?: string;
  postedAt?: string;
}

export interface InstitutionDiscoverySection {
  serviceType: InstitutionServiceType;
  links: InstitutionDiscoveryLink[];
}

export interface InstitutionDiscoverySnapshot {
  institutionId: InstitutionType;
  mode: 'live' | 'catalog_fallback';
  collectedAt: string;
  seedUrls: string[];
  pagesVisited: string[];
  sections: InstitutionDiscoverySection[];
}
