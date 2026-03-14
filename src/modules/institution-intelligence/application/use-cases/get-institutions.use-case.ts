import { Injectable } from '@nestjs/common';
import {
  INSTITUTION_REGISTRY,
} from '../../constants/institution-registry.constant';
import { InstitutionRegistryResponseDto } from '../../dto/institution.response.dto';
import { mapInstitutionRegistryItem } from '../../utils/institution-registry-response.util';

@Injectable()
export class GetInstitutionsUseCase {
  execute(): InstitutionRegistryResponseDto {
    return {
      institutions: INSTITUTION_REGISTRY.map((entry) =>
        mapInstitutionRegistryItem(entry),
      ),
    };
  }
}
