export const INSTITUTION_ENUM = {
  HANBAT: 'HANBAT',
} as const;

export type InstitutionType =
  (typeof INSTITUTION_ENUM)[keyof typeof INSTITUTION_ENUM];

export interface InstitutionRegistryEntry {
  id: InstitutionType;
  name: string;
  region: string;
  audience: string;
  sourceIds: string[];
}

export const INSTITUTION_REGISTRY: InstitutionRegistryEntry[] = [
  {
    id: INSTITUTION_ENUM.HANBAT,
    name: 'Hanbat National University',
    region: 'Daejeon',
    audience: 'college_students',
    sourceIds: ['institution.hanbat.menu', 'institution.hanbat.notice'],
  },
];

export function getInstitutionRegistryEntry(
  institution: InstitutionType,
): InstitutionRegistryEntry | undefined {
  return INSTITUTION_REGISTRY.find((entry) => entry.id === institution);
}
