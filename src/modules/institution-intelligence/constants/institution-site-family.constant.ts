export const INSTITUTION_SITE_FAMILY_ENUM = {
  K2WEB: 'k2web-family',
  DO_PORTAL: 'do-portal',
  ACTION_CMS: 'action-cms',
  JSP_PORTAL: 'jsp-portal',
  ASPNET_PORTAL: 'aspnet-portal',
  MBZ_PORTAL: 'mbz-portal',
  NINEIS_PORTAL: '9is-portal',
  HTML_PORTAL: 'html-portal',
  STATIC_HTML_PORTAL: 'static-html-portal',
  CUSTOM_ROOT: 'custom-root',
} as const;

export type InstitutionSiteFamily =
  (typeof INSTITUTION_SITE_FAMILY_ENUM)[keyof typeof INSTITUTION_SITE_FAMILY_ENUM];
