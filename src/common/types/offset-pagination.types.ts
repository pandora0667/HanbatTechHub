export interface OffsetPaginationMeta {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface OffsetPaginatedItems<T> {
  items: T[];
  meta: OffsetPaginationMeta;
}
