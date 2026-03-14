export const INSTITUTION_SERVICE_TYPE_ENUM = {
  ACADEMIC_NOTICE: 'academic_notice',
  ACADEMIC_CALENDAR: 'academic_calendar',
  SCHOLARSHIP: 'scholarship',
  CAREER_PROGRAM: 'career_program',
  JOB_FAIR: 'job_fair',
  FIELD_PRACTICE: 'field_practice',
  INTERNSHIP: 'internship',
  EXTRACURRICULAR: 'extracurricular',
  MENTORING: 'mentoring',
  STARTUP: 'startup',
  GLOBAL_PROGRAM: 'global_program',
  SUPPORT: 'support',
  DORMITORY: 'dormitory',
  MEAL: 'meal',
} as const;

export type InstitutionServiceType =
  (typeof INSTITUTION_SERVICE_TYPE_ENUM)[keyof typeof INSTITUTION_SERVICE_TYPE_ENUM];
