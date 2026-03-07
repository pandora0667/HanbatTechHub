import { Injectable } from '@nestjs/common';
import { BlogPost } from '../../interfaces/blog.interface';
import { PaginatedBlogPosts } from '../types/paginated-blog-posts.type';

@Injectable()
export class BlogPostQueryService {
  sortByPublishDateDesc(posts: BlogPost[]): BlogPost[] {
    return [...posts].sort(
      (a, b) => b.publishDate.getTime() - a.publishDate.getTime(),
    );
  }

  paginate(
    posts: BlogPost[],
    page: number = 1,
    limit: number = 10,
  ): PaginatedBlogPosts {
    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 ? limit : 1;
    const total = posts.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);
    const startIndex = (safePage - 1) * safeLimit;

    return {
      items: posts.slice(startIndex, startIndex + safeLimit),
      meta: {
        totalCount: total,
        currentPage: safePage,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPreviousPage: safePage > 1,
      },
    };
  }
}
