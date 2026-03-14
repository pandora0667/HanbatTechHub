import { InstitutionType } from './institution-id.constant';

export const INSTITUTION_DISCOVERY_CACHE_TTL = 24 * 60 * 60;
export const INSTITUTION_DISCOVERY_HISTORY_TTL = 72 * 60 * 60;
export const INSTITUTION_DISCOVERY_SOURCE_CONFIDENCE = 0.72;
export const INSTITUTION_DISCOVERY_FALLBACK_CONFIDENCE = 0.38;
export const INSTITUTION_DISCOVERY_UPDATE_CRON =
  process.env.INSTITUTION_DISCOVERY_UPDATE_CRON || '0 4,12,20 * * *';

export const INSTITUTION_DISCOVERY_REDIS_KEYS = {
  SNAPSHOT: 'hbnu:institution:discovery:snapshot:',
  PREVIOUS_SNAPSHOT: 'hbnu:institution:discovery:previous:',
} as const;

export function getInstitutionDiscoverySourceId(
  institution: InstitutionType,
): string {
  return `institution.${institution.toLowerCase()}.discovery`;
}
