import { OffsetPaginatedItems } from '../../../../common/types/offset-pagination.types';
import { BlogPost } from '../../interfaces/blog.interface';

export type PaginatedBlogPosts = OffsetPaginatedItems<BlogPost>;
