import {
  OffsetPaginatedItems,
  OffsetPaginationMeta,
} from '../types/offset-pagination.types';

export interface OffsetPaginationWindow {
  totalCount: number;
  currentPage: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
}

export function createOffsetPaginationWindow(
  totalCount: number,
  page: number = 1,
  limit: number = 10,
  fallbackLimit: number = 10,
): OffsetPaginationWindow {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safeLimit =
    Number.isInteger(limit) && limit > 0 ? limit : fallbackLimit;
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / safeLimit);

  return {
    totalCount,
    currentPage: safePage,
    limit: safeLimit,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
    startIndex: (safePage - 1) * safeLimit,
  };
}

export function toOffsetPaginationMeta(
  window: OffsetPaginationWindow,
): OffsetPaginationMeta {
  return {
    totalCount: window.totalCount,
    currentPage: window.currentPage,
    totalPages: window.totalPages,
    hasNextPage: window.hasNextPage,
    hasPreviousPage: window.hasPreviousPage,
  };
}

export function paginateArray<T>(
  items: T[],
  page: number = 1,
  limit: number = 10,
  fallbackLimit: number = 10,
): OffsetPaginatedItems<T> & { window: OffsetPaginationWindow } {
  const window = createOffsetPaginationWindow(
    items.length,
    page,
    limit,
    fallbackLimit,
  );

  return {
    items: items.slice(window.startIndex, window.startIndex + window.limit),
    meta: toOffsetPaginationMeta(window),
    window,
  };
}
