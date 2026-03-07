import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  BLOG_POST_REPOSITORY,
  BlogPostRepository,
} from '../ports/blog-post.repository';
import {
  BLOG_SOURCE_CATALOG,
  BlogSourceCatalog,
} from '../ports/blog-source-catalog';
import { RssBlogFeedReaderService } from '../../infrastructure/services/rss-blog-feed-reader.service';

@Injectable()
export class BlogFeedCollectorService {
  private readonly logger = new Logger(BlogFeedCollectorService.name);

  constructor(
    @Inject(BLOG_POST_REPOSITORY)
    private readonly blogPostRepository: BlogPostRepository,
    @Inject(BLOG_SOURCE_CATALOG)
    private readonly blogSourceCatalog: BlogSourceCatalog,
    private readonly rssBlogFeedReaderService: RssBlogFeedReaderService,
  ) {}

  async collectFeeds(
    companies: string[] = this.blogSourceCatalog.listCodes(),
  ): Promise<void> {
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

        this.logger.debug(
          `Updated ${source.name} feed in Redis: ${posts.length} valid posts`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(`Error updating ${source.name} feed: ${errorMessage}`);
      }
    }
  }
}
