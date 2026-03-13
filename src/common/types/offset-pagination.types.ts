import { SnapshotMetadata } from './snapshot.types';

export interface OffsetPaginationMeta {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  snapshot?: SnapshotMetadata;
}

export interface OffsetPaginatedItems<T> {
  items: T[];
  meta: OffsetPaginationMeta;
}
