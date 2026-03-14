import {
  SourceCollectionMode,
  SourceTier,
} from '../../../common/types/snapshot.types';
import { MENU_SOURCE_ID } from '../../menu/constants/menu.constant';
import { HANBAT_NOTICE } from '../../notice/constants/notice.constant';
import { NOTICE_SOURCE_ID } from '../../notice/constants/notice.constant';
import {
  INSTITUTION_SITE_FAMILY_ENUM,
  InstitutionSiteFamily,
} from '../constants/institution-site-family.constant';
import {
  INSTITUTION_SERVICE_TYPE_ENUM,
  InstitutionServiceType,
} from '../constants/institution-service-type.enum';
import {
  INSTITUTION_ROLLOUT_STATUS_ENUM,
  InstitutionRolloutStatus,
} from '../constants/institution-rollout-status.constant';
import { InstitutionType } from '../constants/institution-id.constant';
import {
  INSTITUTION_REGISTRY,
} from './national-university-registry.data';

export interface InstitutionSourceCatalogEntry {
  institutionId: InstitutionType;
  serviceType: InstitutionServiceType;
  name: string;
  seedUrl: string;
  siteFamily: InstitutionSiteFamily;
  collectionMode: SourceCollectionMode;
  tier: SourceTier;
  implementationStatus: InstitutionRolloutStatus;
  parserStrategy: string;
  sourceId?: string;
  notes?: string;
}

function resolveCatalogLabel(serviceType: InstitutionServiceType): string {
  switch (serviceType) {
    case INSTITUTION_SERVICE_TYPE_ENUM.ACADEMIC_NOTICE:
      return '학사·일반 공지';
    case INSTITUTION_SERVICE_TYPE_ENUM.ACADEMIC_CALENDAR:
      return '학사일정';
    case INSTITUTION_SERVICE_TYPE_ENUM.SCHOLARSHIP:
      return '장학';
    case INSTITUTION_SERVICE_TYPE_ENUM.CAREER_PROGRAM:
      return '취업지원';
    case INSTITUTION_SERVICE_TYPE_ENUM.JOB_FAIR:
      return '채용행사';
    case INSTITUTION_SERVICE_TYPE_ENUM.FIELD_PRACTICE:
      return '현장실습';
    case INSTITUTION_SERVICE_TYPE_ENUM.INTERNSHIP:
      return '인턴십';
    case INSTITUTION_SERVICE_TYPE_ENUM.EXTRACURRICULAR:
      return '비교과';
    case INSTITUTION_SERVICE_TYPE_ENUM.MENTORING:
      return '멘토링';
    case INSTITUTION_SERVICE_TYPE_ENUM.STARTUP:
      return '창업지원';
    case INSTITUTION_SERVICE_TYPE_ENUM.GLOBAL_PROGRAM:
      return '국제교류';
    case INSTITUTION_SERVICE_TYPE_ENUM.SUPPORT:
      return '학생지원';
    case INSTITUTION_SERVICE_TYPE_ENUM.DORMITORY:
      return '생활관';
    case INSTITUTION_SERVICE_TYPE_ENUM.MEAL:
      return '학식';
    default:
      return serviceType;
  }
}

function buildPlannedBlueprints(): InstitutionSourceCatalogEntry[] {
  return INSTITUTION_REGISTRY.flatMap((institution) =>
    institution.priorityServiceTypes.map((serviceType) => ({
      institutionId: institution.id,
      serviceType,
      name: `${institution.name} ${resolveCatalogLabel(serviceType)}`,
      seedUrl: institution.officialEntryUrl,
      siteFamily: institution.siteFamily,
      collectionMode: 'html' as const,
      tier: 'public_page' as const,
      implementationStatus:
        institution.rolloutStatus === INSTITUTION_ROLLOUT_STATUS_ENUM.IMPLEMENTED
          ? INSTITUTION_ROLLOUT_STATUS_ENUM.PILOT
          : institution.rolloutStatus,
      parserStrategy:
        institution.siteFamily === INSTITUTION_SITE_FAMILY_ENUM.K2WEB
          ? 'k2web:service-discovery'
          : `${institution.siteFamily}:service-discovery`,
      notes:
        institution.rolloutStatus === INSTITUTION_ROLLOUT_STATUS_ENUM.PILOT
          ? 'Wave-1 pilot institution. Public service URL discovery pending.'
          : 'Registry skeleton only. Public service URL discovery pending.',
    })),
  );
}

const PLANNED_BLUEPRINTS = buildPlannedBlueprints();

export const INSTITUTION_SOURCE_CATALOG: InstitutionSourceCatalogEntry[] = [
  {
    institutionId: 'HANBAT',
    serviceType: INSTITUTION_SERVICE_TYPE_ENUM.ACADEMIC_NOTICE,
    name: '국립한밭대학교 공지사항',
    seedUrl: HANBAT_NOTICE.BASE_URL,
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.CUSTOM_ROOT,
    collectionMode: 'html',
    tier: 'public_page',
    implementationStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.IMPLEMENTED,
    parserStrategy: 'hanbat:notice-board',
    sourceId: NOTICE_SOURCE_ID,
    notes: '공지사항 게시판을 저빈도 HTML 스냅샷으로 수집합니다.',
  },
  {
    institutionId: 'HANBAT',
    serviceType: INSTITUTION_SERVICE_TYPE_ENUM.MEAL,
    name: '국립한밭대학교 학식',
    seedUrl: 'https://www.hanbat.ac.kr/prog/cafeteria/kor/sub06_030301/list.do',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.CUSTOM_ROOT,
    collectionMode: 'api',
    tier: 'public_page',
    implementationStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.IMPLEMENTED,
    parserStrategy: 'hanbat:menu-ajax',
    sourceId: MENU_SOURCE_ID,
    notes: '공개 AJAX 응답을 주간 메뉴 스냅샷으로 정규화합니다.',
  },
  ...PLANNED_BLUEPRINTS.filter(
    (entry) =>
      !(
        entry.institutionId === 'HANBAT' &&
        (entry.serviceType === INSTITUTION_SERVICE_TYPE_ENUM.ACADEMIC_NOTICE ||
          entry.serviceType === INSTITUTION_SERVICE_TYPE_ENUM.MEAL)
      ),
  ),
];

export function getInstitutionSourceCatalogEntries(
  institution: InstitutionType,
): InstitutionSourceCatalogEntry[] {
  return INSTITUTION_SOURCE_CATALOG.filter(
    (entry) => entry.institutionId === institution,
  ).map((entry) => ({ ...entry }));
}

export function getInstitutionSourceIds(institution: InstitutionType): string[] {
  return getInstitutionSourceCatalogEntries(institution)
    .map((entry) => entry.sourceId)
    .filter((sourceId): sourceId is string => Boolean(sourceId));
}
