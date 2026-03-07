import { Injectable } from '@nestjs/common';
import {
  NoticeItemDto,
  NoticeListResponseDto,
  PaginationMetaDto,
} from '../../dto/notice.dto';

@Injectable()
export class NoticePaginationService {
  paginate(
    notices: NoticeItemDto[],
    page: number = 1,
    limit: number = 10,
  ): NoticeListResponseDto {
    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 ? limit : 1;
    const startIndex = (safePage - 1) * safeLimit;
    const total = notices.length;

    return {
      items: notices.slice(startIndex, startIndex + safeLimit),
      meta: this.createMeta(total, safePage, safeLimit),
    };
  }

  createMeta(total: number, page: number, limit: number): PaginationMetaDto {
    const safeLimit = limit > 0 ? limit : 1;
    const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

    return {
      totalCount: total,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
