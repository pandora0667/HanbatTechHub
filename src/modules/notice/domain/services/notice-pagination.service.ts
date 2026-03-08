import { Injectable } from '@nestjs/common';
import { OffsetPaginationMeta } from '../../../../common/types/offset-pagination.types';
import {
  createOffsetPaginationWindow,
  paginateArray,
  toOffsetPaginationMeta,
} from '../../../../common/utils/pagination.util';
import { NoticeSummary } from '../models/notice.model';
import { PaginatedNotices } from '../types/paginated-notices.type';

@Injectable()
export class NoticePaginationService {
  paginate(
    notices: NoticeSummary[],
    page: number = 1,
    limit: number = 10,
  ): PaginatedNotices {
    const { items, meta } = paginateArray(notices, page, limit, 1);
    return { items, meta };
  }

  createMeta(total: number, page: number, limit: number): OffsetPaginationMeta {
    return toOffsetPaginationMeta(
      createOffsetPaginationWindow(total, page, limit, 1),
    );
  }
}
