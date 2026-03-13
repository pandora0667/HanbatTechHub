import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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
import {
  BLOG_SOURCE_CONFIDENCE,
  DEFAULT_REDIS_TTL,
  getBlogSourceId,
} from '../../constants/blog.constant';
import { buildSnapshotMetadata } from '../../../../common/utils/snapshot.util';

@Injectable()
export class GetCompanyBlogPostsUseCase {
  constructor(
    @Inject(BLOG_POST_REPOSITORY)
    private readonly blogPostRepository: BlogPostRepository,
    @Inject(BLOG_SOURCE_CATALOG)
    private readonly blogSourceCatalog: BlogSourceCatalog,
    private readonly blogPostQueryService: BlogPostQueryService,
    private readonly blogFeedCollectorService: BlogFeedCollectorService,
  ) {}

  async execute(
    company: string,
    page: number,
    limit: number,
  ): Promise<PaginatedBlogPosts> {
    const source = this.blogSourceCatalog.get(company);
    if (!source) {
      throw new NotFoundException(`Company ${company} not found`);
    }

    let posts = await this.blogPostRepository.getCompanyPosts(company);
    let lastUpdate = await this.blogPostRepository.getCompanyLastUpdate(company);

    if (posts.length === 0) {
      await this.blogFeedCollectorService.collectFeeds([company]);
      posts = await this.blogPostRepository.getCompanyPosts(company);
      lastUpdate = await this.blogPostRepository.getCompanyLastUpdate(company);
    }

    const sortedPosts = this.blogPostQueryService.sortByPublishDateDesc(posts);
    const paginated = this.blogPostQueryService.paginate(sortedPosts, page, limit);

    return {
      ...paginated,
      meta: {
        ...paginated.meta,
        snapshot: lastUpdate
          ? buildSnapshotMetadata({
              collectedAt: lastUpdate,
              ttlSeconds: DEFAULT_REDIS_TTL,
              confidence: BLOG_SOURCE_CONFIDENCE,
              sourceIds: [getBlogSourceId(company)],
            })
          : undefined,
      },
    };
  }
}
