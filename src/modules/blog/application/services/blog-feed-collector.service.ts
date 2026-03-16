import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  BLOG_POST_REPOSITORY,
  BlogPostRepository,
} from '../ports/blog-post.repository';
import {
  BLOG_SOURCE_CATALOG,
  BlogSourceCatalog,
} from '../ports/blog-source-catalog';
import {
  BLOG_SOURCE_CONFIDENCE,
  DEFAULT_REDIS_TTL,
  getBlogSourceId,
} from '../../constants/blog.constant';
import { RssBlogFeedReaderService } from '../../infrastructure/services/rss-blog-feed-reader.service';
import { buildSnapshotMetadata } from '../../../../common/utils/snapshot.util';
import { ContentSnapshotHistoryBuilderService } from '../../../content-intelligence/domain/services/content-snapshot-history-builder.service';
import { SourceRuntimeRecorderService } from '../../../source-registry/application/services/source-runtime-recorder.service';

@Injectable()
export class BlogFeedCollectorService {
  private readonly logger = new Logger(BlogFeedCollectorService.name);

  constructor(
    @Inject(BLOG_POST_REPOSITORY)
    private readonly blogPostRepository: BlogPostRepository,
    @Inject(BLOG_SOURCE_CATALOG)
    private readonly blogSourceCatalog: BlogSourceCatalog,
    private readonly rssBlogFeedReaderService: RssBlogFeedReaderService,
    private readonly contentSnapshotHistoryBuilderService: ContentSnapshotHistoryBuilderService,
    private readonly sourceRuntimeRecorderService: SourceRuntimeRecorderService,
  ) {}

  async collectFeeds(
    companies: string[] = this.blogSourceCatalog.listCodes(),
  ): Promise<void> {
    const startedAt = new Date();
    const fullCatalogCompanies = this.blogSourceCatalog.listCodes();
    const successfulCompanies: string[] = [];

    for (const company of companies) {
      const source = this.blogSourceCatalog.get(company);
      if (!source) {
        continue;
      }

      try {
        const existingPosts =
          await this.blogPostRepository.getCompanyPosts(company);
        const posts = await this.rssBlogFeedReaderService.read(
          source,
          existingPosts,
        );

        await this.blogPostRepository.saveCompanyPosts(company, posts);
        await this.blogPostRepository.setCompanyLastUpdate(
          company,
          new Date().toISOString(),
        );
        await this.sourceRuntimeRecorderService.recordSuccess(
          getBlogSourceId(company),
        );
        successfulCompanies.push(company);

        this.logger.debug(
          `Updated ${source.name} feed in Redis: ${posts.length} valid posts`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        await this.sourceRuntimeRecorderService.recordFailure(
          getBlogSourceId(company),
          errorMessage,
        );
        this.logger.error(`Error updating ${source.name} feed: ${errorMessage}`);
      }
    }

    if (this.isFullCatalogCollection(companies, fullCatalogCompanies)) {
      if (successfulCompanies.length !== fullCatalogCompanies.length) {
        this.logger.warn(
          'Skipping content history append because one or more feed sources failed during the full catalog refresh.',
        );
        return;
      }

      const posts =
        await this.blogPostRepository.getPostsForCompanies(fullCatalogCompanies);
      await this.blogPostRepository.appendContentSnapshotHistory(
        this.contentSnapshotHistoryBuilderService.build(
          posts,
          buildSnapshotMetadata({
            collectedAt: startedAt,
            ttlSeconds: DEFAULT_REDIS_TTL,
            confidence: BLOG_SOURCE_CONFIDENCE,
            sourceIds: fullCatalogCompanies.map((company) => getBlogSourceId(company)),
          }),
        ),
      );
    }
  }

  private isFullCatalogCollection(
    requestedCompanies: string[],
    fullCatalogCompanies: string[],
  ): boolean {
    return (
      requestedCompanies.length === fullCatalogCompanies.length &&
      requestedCompanies.every((company) => fullCatalogCompanies.includes(company))
    );
  }
}
