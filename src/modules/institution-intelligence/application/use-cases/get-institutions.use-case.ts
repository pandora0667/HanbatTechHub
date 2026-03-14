import { Injectable } from '@nestjs/common';
import {
  INSTITUTION_REGISTRY,
} from '../../constants/institution-registry.constant';
import { InstitutionRegistryResponseDto } from '../../dto/institution.response.dto';

@Injectable()
export class GetInstitutionsUseCase {
  execute(): InstitutionRegistryResponseDto {
    return {
      institutions: INSTITUTION_REGISTRY.map((entry) => ({
        id: entry.id,
        name: entry.name,
        region: entry.region,
        audience: entry.audience,
        institutionType: entry.institutionType,
        officialEntryUrl: entry.officialEntryUrl,
        siteFamily: entry.siteFamily,
        rolloutWave: entry.rolloutWave,
        rolloutStatus: entry.rolloutStatus,
        overviewAvailable: entry.sourceIds.length > 0,
        priorityServiceTypes: [...entry.priorityServiceTypes],
        implementedServiceTypes: [...entry.implementedServiceTypes],
        sourceIds: [...entry.sourceIds],
      })),
    };
  }
}
