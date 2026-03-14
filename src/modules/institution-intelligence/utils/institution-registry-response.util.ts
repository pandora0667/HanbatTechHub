import { getInstitutionDiscoverySourceId } from '../constants/institution-discovery.constant';
import { InstitutionRegistryEntry } from '../constants/institution-registry.constant';

export function getInstitutionRegisteredSourceIds(
  entry: InstitutionRegistryEntry,
): string[] {
  return Array.from(
    new Set([getInstitutionDiscoverySourceId(entry.id), ...entry.sourceIds]),
  ).sort((left, right) => left.localeCompare(right));
}

export function mapInstitutionRegistryItem(entry: InstitutionRegistryEntry) {
  return {
    id: entry.id,
    name: entry.name,
    region: entry.region,
    audience: entry.audience,
    institutionType: entry.institutionType,
    officialEntryUrl: entry.officialEntryUrl,
    siteFamily: entry.siteFamily,
    rolloutWave: entry.rolloutWave,
    rolloutStatus: entry.rolloutStatus,
    overviewAvailable: true,
    priorityServiceTypes: [...entry.priorityServiceTypes],
    implementedServiceTypes: [...entry.implementedServiceTypes],
    sourceIds: getInstitutionRegisteredSourceIds(entry),
  };
}
