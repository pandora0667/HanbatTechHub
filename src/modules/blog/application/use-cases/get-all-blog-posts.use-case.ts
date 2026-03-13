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
import {
  BLOG_SOURCE_CONFIDENCE,
  DEFAULT_REDIS_TTL,
  getBlogSourceId,
} from '../../constants/blog.constant';
import {
  buildSnapshotMetadata,
  mergeSnapshotMetadata,
} from '../../../../common/utils/snapshot.util';

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
    let snapshot = await this.buildSnapshot(companies);

    if (posts.length === 0) {
      await this.blogFeedCollectorService.collectFeeds(companies);
      posts = await this.blogPostRepository.getPostsForCompanies(companies);
      snapshot = await this.buildSnapshot(companies);
    }

    const sortedPosts = this.blogPostQueryService.sortByPublishDateDesc(posts);
    const paginated = this.blogPostQueryService.paginate(sortedPosts, page, limit);

    return {
      ...paginated,
      meta: {
        ...paginated.meta,
        snapshot,
      },
    };
  }

  private async buildSnapshot(companies: string[]) {
    const timestamps = await Promise.all(
      companies.map((company) => this.blogPostRepository.getCompanyLastUpdate(company)),
    );
    const snapshots = timestamps.flatMap((timestamp, index) =>
      timestamp
        ? [
            buildSnapshotMetadata({
              collectedAt: timestamp,
              ttlSeconds: DEFAULT_REDIS_TTL,
              confidence: BLOG_SOURCE_CONFIDENCE,
              sourceIds: [getBlogSourceId(companies[index])],
            }),
          ]
        : [],
    );

    return mergeSnapshotMetadata(snapshots);
  }
}
