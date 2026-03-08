import { Injectable } from '@nestjs/common';
import { paginateArray } from '../../../../common/utils/pagination.util';
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
    const { items, meta } = paginateArray(posts, page, limit, 1);
    return { items, meta };
  }
}
