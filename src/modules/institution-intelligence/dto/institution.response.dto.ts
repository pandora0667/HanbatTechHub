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

class InstitutionOverviewSummaryDto {
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

  @ApiProperty({ type: [SourceRegistryItemDto] })
  sources: SourceRegistryItemDto[];
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
