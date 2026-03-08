import { OffsetPaginatedItems } from '../../../../common/types/offset-pagination.types';
import { NoticeSummary } from '../models/notice.model';

export type PaginatedNotices = OffsetPaginatedItems<NoticeSummary>;
