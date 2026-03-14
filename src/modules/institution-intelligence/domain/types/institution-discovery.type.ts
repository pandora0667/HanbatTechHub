import { InstitutionType } from '../../constants/institution-id.constant';
import { InstitutionServiceType } from '../../constants/institution-service-type.enum';

export interface InstitutionDiscoveryLink {
  title: string;
  url: string;
  pageUrl: string;
  matchedKeywords: string[];
  score: number;
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
