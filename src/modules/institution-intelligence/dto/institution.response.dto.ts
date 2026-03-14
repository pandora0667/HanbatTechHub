import { ApiProperty } from '@nestjs/swagger';
import { SnapshotDto } from '../../../common/dto/snapshot.dto';
import {
  SourceCollectionMode,
  SourceTier,
} from '../../../common/types/snapshot.types';
import {
  InstitutionCategory,
} from '../constants/institution-registry.constant';
import { InstitutionRolloutStatus } from '../constants/institution-rollout-status.constant';
import { InstitutionServiceType } from '../constants/institution-service-type.enum';
import { InstitutionSiteFamily } from '../constants/institution-site-family.constant';
import { SourceRegistryItemDto } from '../../source-registry/dto/source-registry-response.dto';

class InstitutionRegistryItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  region: string;

  @ApiProperty()
  audience: string;

  @ApiProperty({
    enum: [
      'national_university_corporation',
      'flagship_national_university',
      'national_central_university',
      'teacher_training_university',
    ],
  })
  institutionType: InstitutionCategory;

  @ApiProperty()
  officialEntryUrl: string;

  @ApiProperty({
    enum: [
      'k2web-family',
      'do-portal',
      'action-cms',
      'jsp-portal',
      'aspnet-portal',
      'mbz-portal',
      '9is-portal',
      'html-portal',
      'static-html-portal',
      'custom-root',
    ],
  })
  siteFamily: InstitutionSiteFamily;

  @ApiProperty()
  rolloutWave: number;

  @ApiProperty({
    enum: ['implemented', 'pilot', 'planned'],
  })
  rolloutStatus: InstitutionRolloutStatus;

  @ApiProperty()
  overviewAvailable: boolean;

  @ApiProperty({ type: [String] })
  priorityServiceTypes: InstitutionServiceType[];

  @ApiProperty({ type: [String] })
  implementedServiceTypes: InstitutionServiceType[];

  @ApiProperty({ type: [String] })
  sourceIds: string[];
}

class InstitutionNoticePreviewDto {
  @ApiProperty()
  nttId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  author: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  link: string;
}

class InstitutionMenuPreviewDto {
  @ApiProperty()
  date: string;

  @ApiProperty({ type: [String] })
  lunch: string[];

  @ApiProperty({ type: [String] })
  dinner: string[];
}

class InstitutionCatalogSourceDto {
  @ApiProperty({
    type: String,
    enum: [
      'academic_notice',
      'academic_calendar',
      'scholarship',
      'career_program',
      'job_fair',
      'field_practice',
      'internship',
      'extracurricular',
      'mentoring',
      'startup',
      'global_program',
      'support',
      'dormitory',
      'meal',
    ],
  })
  serviceType: InstitutionServiceType;

  @ApiProperty()
  name: string;

  @ApiProperty()
  seedUrl: string;

  @ApiProperty({
    enum: [
      'k2web-family',
      'do-portal',
      'action-cms',
      'jsp-portal',
      'aspnet-portal',
      'mbz-portal',
      '9is-portal',
      'html-portal',
      'static-html-portal',
      'custom-root',
    ],
  })
  siteFamily: InstitutionSiteFamily;

  @ApiProperty({
    enum: ['api', 'feed', 'html', 'browser'],
  })
  collectionMode: SourceCollectionMode;

  @ApiProperty({
    enum: ['official_api', 'official_feed', 'public_page', 'browser_automation'],
  })
  tier: SourceTier;

  @ApiProperty({
    enum: ['implemented', 'pilot', 'planned'],
  })
  implementationStatus: InstitutionRolloutStatus;

  @ApiProperty()
  parserStrategy: string;

  @ApiProperty({ required: false })
  sourceId?: string;

  @ApiProperty({ required: false })
  notes?: string;
}

class InstitutionCatalogSummaryDto {
  @ApiProperty()
  totalBlueprints: number;

  @ApiProperty()
  implementedBlueprints: number;

  @ApiProperty()
  registeredSources: number;
}

class InstitutionDiscoveryLinkDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  pageUrl: string;

  @ApiProperty({ type: [String] })
  matchedKeywords: string[];

  @ApiProperty()
  score: number;
}

class InstitutionDiscoverySectionDto {
  @ApiProperty({
    type: String,
    enum: [
      'academic_notice',
      'academic_calendar',
      'scholarship',
      'career_program',
      'job_fair',
      'field_practice',
      'internship',
      'extracurricular',
      'mentoring',
      'startup',
      'global_program',
      'support',
      'dormitory',
      'meal',
    ],
  })
  serviceType: InstitutionServiceType;

  @ApiProperty()
  linkCount: number;

  @ApiProperty({ type: [InstitutionDiscoveryLinkDto] })
  links: InstitutionDiscoveryLinkDto[];
}

class InstitutionDiscoverySummaryDto {
  @ApiProperty({
    enum: ['live', 'catalog_fallback'],
  })
  mode: 'live' | 'catalog_fallback';

  @ApiProperty()
  coveredServiceTypes: number;

  @ApiProperty()
  totalRequestedServiceTypes: number;

  @ApiProperty()
  totalDiscoveredLinks: number;

  @ApiProperty()
  pagesVisited: number;
}

class InstitutionOverviewSummaryDto {
  @ApiProperty({
    enum: ['live', 'catalog_fallback'],
  })
  discoveryMode: 'live' | 'catalog_fallback';

  @ApiProperty()
  discoveredServiceTypes: number;

  @ApiProperty()
  requestedServiceTypes: number;

  @ApiProperty()
  discoveredLinks: number;

  @ApiProperty()
  pagesVisited: number;

  @ApiProperty()
  registeredSources: number;

  @ApiProperty()
  regularNotices: number;

  @ApiProperty()
  newNotices: number;

  @ApiProperty()
  featuredNotices: number;

  @ApiProperty()
  todayNotices: number;

  @ApiProperty()
  weeklyMenus: number;

  @ApiProperty()
  lunchAvailableDays: number;

  @ApiProperty()
  dinnerAvailableDays: number;
}

class InstitutionOverviewSectionsDto {
  @ApiProperty({ type: [InstitutionNoticePreviewDto] })
  latestNotices: InstitutionNoticePreviewDto[];

  @ApiProperty({ type: [InstitutionNoticePreviewDto] })
  newNotices: InstitutionNoticePreviewDto[];

  @ApiProperty({ type: [InstitutionNoticePreviewDto] })
  featuredNotices: InstitutionNoticePreviewDto[];

  @ApiProperty({ type: [InstitutionMenuPreviewDto] })
  weeklyMenus: InstitutionMenuPreviewDto[];

  @ApiProperty({ type: [InstitutionCatalogSourceDto] })
  serviceCatalog: InstitutionCatalogSourceDto[];

  @ApiProperty({ type: [InstitutionDiscoverySectionDto] })
  discoveredServices: InstitutionDiscoverySectionDto[];

  @ApiProperty({ type: [SourceRegistryItemDto] })
  sources: SourceRegistryItemDto[];
}

export class InstitutionRegistryResponseDto {
  @ApiProperty({ type: [InstitutionRegistryItemDto] })
  institutions: InstitutionRegistryItemDto[];
}

export class InstitutionOverviewResponseDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ type: InstitutionRegistryItemDto })
  institution: InstitutionRegistryItemDto;

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;

  @ApiProperty({ type: InstitutionOverviewSummaryDto })
  summary: InstitutionOverviewSummaryDto;

  @ApiProperty({ type: InstitutionOverviewSectionsDto })
  sections: InstitutionOverviewSectionsDto;
}

export class InstitutionCatalogResponseDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ type: InstitutionRegistryItemDto })
  institution: InstitutionRegistryItemDto;

  @ApiProperty({ type: InstitutionCatalogSummaryDto })
  summary: InstitutionCatalogSummaryDto;

  @ApiProperty({ type: [InstitutionCatalogSourceDto] })
  services: InstitutionCatalogSourceDto[];

  @ApiProperty({ type: [SourceRegistryItemDto] })
  registeredSources: SourceRegistryItemDto[];
}

export class InstitutionDiscoveryResponseDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ type: InstitutionRegistryItemDto })
  institution: InstitutionRegistryItemDto;

  @ApiProperty({ type: SnapshotDto })
  snapshot: SnapshotDto;

  @ApiProperty({ type: InstitutionDiscoverySummaryDto })
  summary: InstitutionDiscoverySummaryDto;

  @ApiProperty({ type: [InstitutionDiscoverySectionDto] })
  sections: InstitutionDiscoverySectionDto[];
}

class InstitutionOpportunityItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  institutionId: string;

  @ApiProperty()
  institutionName: string;

  @ApiProperty()
  region: string;

  @ApiProperty({
    enum: [
      'scholarship',
      'career_program',
      'job_fair',
      'field_practice',
      'internship',
      'extracurricular',
      'mentoring',
      'startup',
      'global_program',
    ],
  })
  serviceType: InstitutionServiceType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  pageUrl: string;

  @ApiProperty({ type: [String] })
  matchedKeywords: string[];

  @ApiProperty()
  score: number;

  @ApiProperty({
    enum: ['live', 'catalog_fallback'],
  })
  discoveryMode: 'live' | 'catalog_fallback';

  @ApiProperty()
  sourceId: string;
}

class InstitutionOpportunitySummaryDto {
  @ApiProperty()
  totalOpportunities: number;

  @ApiProperty()
  serviceTypesCovered: number;

  @ApiProperty()
  liveInstitutions: number;

  @ApiProperty()
  fallbackInstitutions: number;
}

class InstitutionOpportunitiesMetaDto {
  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  currentPage: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPreviousPage: boolean;

  @ApiProperty()
  limit: number;

  @ApiProperty({ required: false })
  serviceType?: InstitutionServiceType;

  @ApiProperty({ required: false })
  keyword?: string;

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;
}

export class InstitutionOpportunitiesResponseDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ type: InstitutionRegistryItemDto, required: false })
  institution?: InstitutionRegistryItemDto;

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;

  @ApiProperty({ type: InstitutionOpportunitySummaryDto })
  summary: InstitutionOpportunitySummaryDto;

  @ApiProperty({ type: InstitutionOpportunitiesMetaDto })
  meta: InstitutionOpportunitiesMetaDto;

  @ApiProperty({ type: [InstitutionOpportunityItemDto] })
  items: InstitutionOpportunityItemDto[];

  @ApiProperty({ type: [SourceRegistryItemDto] })
  sources: SourceRegistryItemDto[];
}
