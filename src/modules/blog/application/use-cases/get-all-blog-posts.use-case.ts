import { Inject, Injectable } from '@nestjs/common';
import {
  BLOG_POST_REPOSITORY,
  BlogPostRepository,
} from '../ports/blog-post.repository';
import {
  BLOG_SOURCE_CATALOG,
  BlogSourceCatalog,
} from '../ports/blog-source-catalog';
import { BlogPostQueryService } from '../../domain/services/blog-post-query.service';
import { PaginatedBlogPosts } from '../../domain/types/paginated-blog-posts.type';
import { BlogFeedCollectorService } from '../services/blog-feed-collector.service';

@Injectable()
export class GetAllBlogPostsUseCase {
  constructor(
    @Inject(BLOG_POST_REPOSITORY)
    private readonly blogPostRepository: BlogPostRepository,
    @Inject(BLOG_SOURCE_CATALOG)
    private readonly blogSourceCatalog: BlogSourceCatalog,
    private readonly blogPostQueryService: BlogPostQueryService,
    private readonly blogFeedCollectorService: BlogFeedCollectorService,
  ) {}

  async execute(page: number, limit: number): Promise<PaginatedBlogPosts> {
    const companies = this.blogSourceCatalog.listCodes();
    let posts = await this.blogPostRepository.getPostsForCompanies(companies);

    if (posts.length === 0) {
      await this.blogFeedCollectorService.collectFeeds(companies);
      posts = await this.blogPostRepository.getPostsForCompanies(companies);
    }

    const sortedPosts = this.blogPostQueryService.sortByPublishDateDesc(posts);
    return this.blogPostQueryService.paginate(sortedPosts, page, limit);
  }
}
