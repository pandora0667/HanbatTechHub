import { Injectable } from '@nestjs/common';
import { SourceRegistryEntry } from '../../common/types/snapshot.types';
import { GetSourceRegistryQueryDto } from './dto/get-source-registry-query.dto';
import { SOURCE_REGISTRY } from './source-registry.data';

@Injectable()
export class SourceRegistryService {
  list(filters?: GetSourceRegistryQueryDto): SourceRegistryEntry[] {
    return SOURCE_REGISTRY.filter((entry) => {
      if (filters?.context && entry.context !== filters.context) {
        return false;
      }

      if (
        filters?.collectionMode &&
        entry.collectionMode !== filters.collectionMode
      ) {
        return false;
      }

      if (filters?.tier && entry.tier !== filters.tier) {
        return false;
      }

      if (
        filters?.active !== undefined &&
        entry.active !== (filters.active === 'true')
      ) {
        return false;
      }

      return true;
    }).map((entry) => ({ ...entry }));
  }
}
