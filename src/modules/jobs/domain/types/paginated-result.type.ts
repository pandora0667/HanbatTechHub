import { SnapshotMetadata } from '../../../../common/types/snapshot.types';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    snapshot?: SnapshotMetadata;
  };
}
