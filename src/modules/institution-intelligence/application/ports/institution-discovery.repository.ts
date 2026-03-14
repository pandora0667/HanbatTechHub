import { InstitutionType } from '../../constants/institution-id.constant';
import { InstitutionDiscoverySnapshot } from '../../domain/types/institution-discovery.type';

export const INSTITUTION_DISCOVERY_REPOSITORY =
  'INSTITUTION_DISCOVERY_REPOSITORY';

export interface InstitutionDiscoveryRepository {
  getSnapshot(
    institution: InstitutionType,
  ): Promise<InstitutionDiscoverySnapshot | null>;
  getPreviousSnapshot(
    institution: InstitutionType,
  ): Promise<InstitutionDiscoverySnapshot | null>;
  saveSnapshot(
    institution: InstitutionType,
    snapshot: InstitutionDiscoverySnapshot,
  ): Promise<void>;
}
