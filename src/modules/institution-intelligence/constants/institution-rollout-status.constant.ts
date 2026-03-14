export const INSTITUTION_ROLLOUT_STATUS_ENUM = {
  IMPLEMENTED: 'implemented',
  PILOT: 'pilot',
  PLANNED: 'planned',
} as const;

export type InstitutionRolloutStatus =
  (typeof INSTITUTION_ROLLOUT_STATUS_ENUM)[keyof typeof INSTITUTION_ROLLOUT_STATUS_ENUM];
