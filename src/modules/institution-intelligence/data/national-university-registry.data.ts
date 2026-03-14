import { INSTITUTION_ENUM, InstitutionType } from '../constants/institution-id.constant';
import {
  INSTITUTION_ROLLOUT_STATUS_ENUM,
  InstitutionRolloutStatus,
} from '../constants/institution-rollout-status.constant';
import {
  INSTITUTION_SERVICE_TYPE_ENUM,
  InstitutionServiceType,
} from '../constants/institution-service-type.enum';
import {
  INSTITUTION_SITE_FAMILY_ENUM,
  InstitutionSiteFamily,
} from '../constants/institution-site-family.constant';

export type InstitutionAudience =
  | 'college_students'
  | 'teacher_track_students'
  | 'distance_learners';

export type InstitutionCategory =
  | 'national_university_corporation'
  | 'flagship_national_university'
  | 'national_central_university'
  | 'teacher_training_university';

export interface InstitutionRegistryEntry {
  id: InstitutionType;
  name: string;
  region: string;
  audience: InstitutionAudience;
  institutionType: InstitutionCategory;
  officialEntryUrl: string;
  discoverySeedUrls: string[];
  requestOptions?: {
    rejectUnauthorized?: boolean;
    insecureHttpParser?: boolean;
  };
  siteFamily: InstitutionSiteFamily;
  rolloutWave: 1 | 2 | 3;
  rolloutStatus: InstitutionRolloutStatus;
  priorityServiceTypes: InstitutionServiceType[];
  implementedServiceTypes: InstitutionServiceType[];
  sourceIds: string[];
}

const COMMON_PRIORITY_SERVICE_TYPES: InstitutionServiceType[] = [
  INSTITUTION_SERVICE_TYPE_ENUM.SCHOLARSHIP,
  INSTITUTION_SERVICE_TYPE_ENUM.CAREER_PROGRAM,
  INSTITUTION_SERVICE_TYPE_ENUM.FIELD_PRACTICE,
  INSTITUTION_SERVICE_TYPE_ENUM.EXTRACURRICULAR,
  INSTITUTION_SERVICE_TYPE_ENUM.ACADEMIC_NOTICE,
  INSTITUTION_SERVICE_TYPE_ENUM.ACADEMIC_CALENDAR,
  INSTITUTION_SERVICE_TYPE_ENUM.SUPPORT,
];

const CAMPUS_LIFE_PRIORITY_SERVICE_TYPES: InstitutionServiceType[] = [
  INSTITUTION_SERVICE_TYPE_ENUM.DORMITORY,
  INSTITUTION_SERVICE_TYPE_ENUM.MEAL,
];

const RESEARCH_UNIVERSITY_PRIORITY_TYPES: InstitutionServiceType[] = [
  ...COMMON_PRIORITY_SERVICE_TYPES,
  INSTITUTION_SERVICE_TYPE_ENUM.JOB_FAIR,
  INSTITUTION_SERVICE_TYPE_ENUM.INTERNSHIP,
  INSTITUTION_SERVICE_TYPE_ENUM.STARTUP,
  INSTITUTION_SERVICE_TYPE_ENUM.GLOBAL_PROGRAM,
  ...CAMPUS_LIFE_PRIORITY_SERVICE_TYPES,
];

const TEACHER_TRACK_PRIORITY_TYPES: InstitutionServiceType[] = [
  ...COMMON_PRIORITY_SERVICE_TYPES,
  INSTITUTION_SERVICE_TYPE_ENUM.MENTORING,
  ...CAMPUS_LIFE_PRIORITY_SERVICE_TYPES,
];

const DISTANCE_LEARNING_PRIORITY_TYPES: InstitutionServiceType[] = [
  INSTITUTION_SERVICE_TYPE_ENUM.SCHOLARSHIP,
  INSTITUTION_SERVICE_TYPE_ENUM.CAREER_PROGRAM,
  INSTITUTION_SERVICE_TYPE_ENUM.EXTRACURRICULAR,
  INSTITUTION_SERVICE_TYPE_ENUM.ACADEMIC_NOTICE,
  INSTITUTION_SERVICE_TYPE_ENUM.ACADEMIC_CALENDAR,
  INSTITUTION_SERVICE_TYPE_ENUM.SUPPORT,
  INSTITUTION_SERVICE_TYPE_ENUM.MENTORING,
];

interface RegistrySeed {
  id: InstitutionType;
  name: string;
  region: string;
  institutionType: InstitutionCategory;
  audience?: InstitutionAudience;
  officialEntryUrl: string;
  discoverySeedUrls?: string[];
  requestOptions?: {
    rejectUnauthorized?: boolean;
    insecureHttpParser?: boolean;
  };
  siteFamily: InstitutionSiteFamily;
  rolloutWave: 1 | 2 | 3;
  rolloutStatus: InstitutionRolloutStatus;
  priorityServiceTypes: InstitutionServiceType[];
  implementedServiceTypes?: InstitutionServiceType[];
  sourceIds?: string[];
}

function createRegistryEntry(seed: RegistrySeed): InstitutionRegistryEntry {
  return {
    audience: seed.audience ?? 'college_students',
    discoverySeedUrls: seed.discoverySeedUrls ?? [seed.officialEntryUrl],
    implementedServiceTypes: seed.implementedServiceTypes ?? [],
    sourceIds: seed.sourceIds ?? [],
    ...seed,
  };
}

export const INSTITUTION_REGISTRY: InstitutionRegistryEntry[] = [
  createRegistryEntry({
    id: INSTITUTION_ENUM.HANBAT,
    name: '국립한밭대학교',
    region: '충청권',
    institutionType: 'national_central_university',
    officialEntryUrl: 'https://www.hanbat.ac.kr/',
    discoverySeedUrls: ['https://www.hanbat.ac.kr/kor/main.do'],
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.CUSTOM_ROOT,
    rolloutWave: 1,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.IMPLEMENTED,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
    implementedServiceTypes: [
      INSTITUTION_SERVICE_TYPE_ENUM.ACADEMIC_NOTICE,
      INSTITUTION_SERVICE_TYPE_ENUM.MEAL,
    ],
    sourceIds: ['institution.hanbat.menu', 'institution.hanbat.notice'],
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.KANGWON,
    name: '강원대학교',
    region: '수도·강원권',
    institutionType: 'flagship_national_university',
    officialEntryUrl: 'https://www.kangwon.ac.kr/intro/intro_10.html',
    discoverySeedUrls: [
      'https://www.kangwon.ac.kr/ko/main.do',
      'https://www.kangwon.ac.kr/',
    ],
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.HTML_PORTAL,
    rolloutWave: 1,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PILOT,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.SEOULTECH,
    name: '서울과학기술대학교',
    region: '수도·강원권',
    institutionType: 'national_central_university',
    officialEntryUrl: 'https://www.seoultech.ac.kr/index.jsp',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.JSP_PORTAL,
    rolloutWave: 1,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PILOT,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.KMOU,
    name: '국립한국해양대학교',
    region: '영남권',
    institutionType: 'national_central_university',
    officialEntryUrl: 'https://www.kmou.ac.kr/kmou/main.do',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.DO_PORTAL,
    rolloutWave: 1,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PILOT,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.GINUE,
    name: '경인교육대학교',
    region: '수도·강원권',
    institutionType: 'teacher_training_university',
    audience: 'teacher_track_students',
    officialEntryUrl: 'https://www.ginue.ac.kr/kor/Main.do',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.DO_PORTAL,
    rolloutWave: 1,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PILOT,
    priorityServiceTypes: TEACHER_TRACK_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.SNU,
    name: '서울대학교',
    region: '수도권',
    institutionType: 'national_university_corporation',
    officialEntryUrl: 'https://www.snu.ac.kr/',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.CUSTOM_ROOT,
    rolloutWave: 1,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PILOT,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.INU,
    name: '인천대학교',
    region: '수도권',
    institutionType: 'national_university_corporation',
    officialEntryUrl: 'https://www.inu.ac.kr/',
    discoverySeedUrls: [
      'https://www.inu.ac.kr/inu/index.do',
      'https://job.inu.ac.kr/',
    ],
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.CUSTOM_ROOT,
    rolloutWave: 1,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PILOT,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.KNOU,
    name: '국립한국방송통신대학교',
    region: '수도·강원권',
    institutionType: 'national_central_university',
    audience: 'distance_learners',
    officialEntryUrl: 'https://www.knou.ac.kr/knou/index.do?epTicket=LOG',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.DO_PORTAL,
    rolloutWave: 1,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PILOT,
    priorityServiceTypes: DISTANCE_LEARNING_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.GWNU,
    name: '국립강릉원주대학교',
    region: '수도·강원권',
    institutionType: 'national_central_university',
    officialEntryUrl: 'https://www.gwnu.ac.kr/sites/kr/index.do',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.K2WEB,
    rolloutWave: 2,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.HKNU,
    name: '한경국립대학교',
    region: '수도·강원권',
    institutionType: 'national_central_university',
    officialEntryUrl: 'https://www.hknu.ac.kr/sites/kor/index.do',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.K2WEB,
    rolloutWave: 2,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.KNU,
    name: '경북대학교',
    region: '영남권',
    institutionType: 'flagship_national_university',
    officialEntryUrl: 'https://www.knu.ac.kr/wbbs/wbbs/main/main.action',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.ACTION_CMS,
    rolloutWave: 2,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.PNU,
    name: '부산대학교',
    region: '영남권',
    institutionType: 'flagship_national_university',
    officialEntryUrl: 'https://www.pusan.ac.kr/kor/Main.do',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.DO_PORTAL,
    rolloutWave: 2,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.CNU,
    name: '충남대학교',
    region: '충청권',
    institutionType: 'flagship_national_university',
    officialEntryUrl: 'https://plus.cnu.ac.kr/html/kr/',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.CUSTOM_ROOT,
    rolloutWave: 2,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.CBNU,
    name: '충북대학교',
    region: '충청권',
    institutionType: 'flagship_national_university',
    officialEntryUrl: 'https://www.chungbuk.ac.kr/site/www/main.do',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.DO_PORTAL,
    rolloutWave: 2,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.JNU,
    name: '전남대학교',
    region: '호남·제주권',
    institutionType: 'flagship_national_university',
    officialEntryUrl: 'https://www.jnu.ac.kr/jnumain.aspx',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.ASPNET_PORTAL,
    rolloutWave: 2,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.JBNU,
    name: '전북대학교',
    region: '호남·제주권',
    institutionType: 'flagship_national_university',
    officialEntryUrl: 'https://www.jbnu.ac.kr/kor/',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.CUSTOM_ROOT,
    rolloutWave: 2,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.GNU,
    name: '경상국립대학교',
    region: '영남권',
    institutionType: 'national_central_university',
    officialEntryUrl: 'https://www.gnu.ac.kr/main/main.do',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.DO_PORTAL,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.GJUE,
    name: '공주교육대학교',
    region: '충청권',
    institutionType: 'teacher_training_university',
    audience: 'teacher_track_students',
    officialEntryUrl: 'https://www.gjue.ac.kr/html/kor/index.html',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.STATIC_HTML_PORTAL,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: TEACHER_TRACK_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.GNUE,
    name: '광주교육대학교',
    region: '호남·제주권',
    institutionType: 'teacher_training_university',
    audience: 'teacher_track_students',
    officialEntryUrl: 'https://www.gnue.ac.kr/index.9is',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.NINEIS_PORTAL,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: TEACHER_TRACK_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.GKNU,
    name: '국립경국대학교',
    region: '영남권',
    institutionType: 'national_central_university',
    officialEntryUrl: 'https://www.gknu.ac.kr/',
    discoverySeedUrls: ['https://www.gknu.ac.kr/main/'],
    requestOptions: {
      rejectUnauthorized: false,
    },
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.CUSTOM_ROOT,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.KONGJU,
    name: '국립공주대학교',
    region: '충청권',
    institutionType: 'national_central_university',
    officialEntryUrl: 'https://www.kongju.ac.kr/kongju/index.do',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.DO_PORTAL,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.KUNSAN,
    name: '국립군산대학교',
    region: '호남·제주권',
    institutionType: 'national_central_university',
    officialEntryUrl: 'https://www.kunsan.ac.kr/index.kunsan?contentsSid=4714&sso=ok',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.CUSTOM_ROOT,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.KUMOH,
    name: '국립금오공과대학교',
    region: '영남권',
    institutionType: 'national_central_university',
    officialEntryUrl: 'https://www.kumoh.ac.kr/ko/index.do',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.DO_PORTAL,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.MOKPO,
    name: '국립목포대학교',
    region: '호남·제주권',
    institutionType: 'national_central_university',
    officialEntryUrl: 'https://www.mokpo.ac.kr/index.9is',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.NINEIS_PORTAL,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.MMU,
    name: '국립목포해양대학교',
    region: '호남·제주권',
    institutionType: 'national_central_university',
    officialEntryUrl: 'https://www.mmu.ac.kr/main',
    discoverySeedUrls: ['https://www.mmu.ac.kr/mmu/main.do'],
    requestOptions: {
      insecureHttpParser: true,
    },
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.CUSTOM_ROOT,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.PKNU,
    name: '국립부경대학교',
    region: '영남권',
    institutionType: 'national_central_university',
    officialEntryUrl: 'https://www.pknu.ac.kr/main',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.CUSTOM_ROOT,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.SCNU,
    name: '국립순천대학교',
    region: '호남·제주권',
    institutionType: 'national_central_university',
    officialEntryUrl: 'https://www.scnu.ac.kr/SCNU/main.do',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.DO_PORTAL,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.CHANGWON,
    name: '국립창원대학교',
    region: '영남권',
    institutionType: 'national_central_university',
    officialEntryUrl: 'https://www.changwon.ac.kr/kor/main.do',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.DO_PORTAL,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.UT,
    name: '국립한국교통대학교',
    region: '충청권',
    institutionType: 'national_central_university',
    officialEntryUrl: 'https://www.ut.ac.kr/',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.CUSTOM_ROOT,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.DNUE,
    name: '대구교육대학교',
    region: '영남권',
    institutionType: 'teacher_training_university',
    audience: 'teacher_track_students',
    officialEntryUrl: 'https://www.dnue.ac.kr/kor/Main.do',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.DO_PORTAL,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: TEACHER_TRACK_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.BNUE,
    name: '부산교육대학교',
    region: '영남권',
    institutionType: 'teacher_training_university',
    audience: 'teacher_track_students',
    officialEntryUrl: 'https://www.bnue.ac.kr/Home/Main.mbz',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.MBZ_PORTAL,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: TEACHER_TRACK_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.SNUE,
    name: '서울교육대학교',
    region: '수도·강원권',
    institutionType: 'teacher_training_university',
    audience: 'teacher_track_students',
    officialEntryUrl: 'https://www.snue.ac.kr/snue/main.do',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.DO_PORTAL,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: TEACHER_TRACK_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.JNUE,
    name: '전주교육대학교',
    region: '호남·제주권',
    institutionType: 'teacher_training_university',
    audience: 'teacher_track_students',
    officialEntryUrl: 'https://www.jnue.kr/',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.CUSTOM_ROOT,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: TEACHER_TRACK_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.JEJUNU,
    name: '제주대학교',
    region: '호남·제주권',
    institutionType: 'flagship_national_university',
    officialEntryUrl: 'https://www.jejunu.ac.kr/',
    requestOptions: {
      rejectUnauthorized: false,
    },
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.CUSTOM_ROOT,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: RESEARCH_UNIVERSITY_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.CUE,
    name: '진주교육대학교',
    region: '영남권',
    institutionType: 'teacher_training_university',
    audience: 'teacher_track_students',
    officialEntryUrl: 'https://www.cue.ac.kr/kor/Main.do',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.DO_PORTAL,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: TEACHER_TRACK_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.CJE,
    name: '청주교육대학교',
    region: '충청권',
    institutionType: 'teacher_training_university',
    audience: 'teacher_track_students',
    officialEntryUrl: 'https://www.cje.ac.kr/',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.CUSTOM_ROOT,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: TEACHER_TRACK_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.CNUE,
    name: '춘천교육대학교',
    region: '수도·강원권',
    institutionType: 'teacher_training_university',
    audience: 'teacher_track_students',
    officialEntryUrl: 'https://www.cnue.ac.kr/cnue/index.do',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.DO_PORTAL,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: TEACHER_TRACK_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.KNUE,
    name: '한국교원대학교',
    region: '충청권',
    institutionType: 'teacher_training_university',
    audience: 'teacher_track_students',
    officialEntryUrl: 'https://knue.ac.kr/smain.html',
    discoverySeedUrls: ['https://knue.ac.kr/www/index.do'],
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.HTML_PORTAL,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: TEACHER_TRACK_PRIORITY_TYPES,
  }),
  createRegistryEntry({
    id: INSTITUTION_ENUM.KNSU,
    name: '한국체육대학교',
    region: '수도·강원권',
    institutionType: 'national_central_university',
    officialEntryUrl: 'https://www.knsu.ac.kr/knsu/index.do',
    siteFamily: INSTITUTION_SITE_FAMILY_ENUM.DO_PORTAL,
    rolloutWave: 3,
    rolloutStatus: INSTITUTION_ROLLOUT_STATUS_ENUM.PLANNED,
    priorityServiceTypes: COMMON_PRIORITY_SERVICE_TYPES,
  }),
].sort((left, right) => {
  if (left.rolloutWave !== right.rolloutWave) {
    return left.rolloutWave - right.rolloutWave;
  }

  return left.name.localeCompare(right.name, 'ko');
});

export function getInstitutionRegistryEntry(
  institution: InstitutionType,
): InstitutionRegistryEntry | undefined {
  return INSTITUTION_REGISTRY.find((entry) => entry.id === institution);
}
