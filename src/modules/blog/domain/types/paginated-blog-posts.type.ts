import { BlogPost } from '../../interfaces/blog.interface';

export interface BlogPaginationMeta {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedBlogPosts {
  items: BlogPost[];
  meta: BlogPaginationMeta;
}
