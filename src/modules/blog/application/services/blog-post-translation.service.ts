import { Inject, Injectable, Logger } from '@nestjs/common';
import { TranslationService } from '../../../translation/services/translation.service';
import {
  BLOG_POST_REPOSITORY,
  BlogPostRepository,
} from '../ports/blog-post.repository';
import {
  BLOG_SOURCE_CATALOG,
  BlogSourceCatalog,
} from '../ports/blog-source-catalog';

@Injectable()
export class BlogPostTranslationService {
  private readonly logger = new Logger(BlogPostTranslationService.name);

  constructor(
    private readonly translationService: TranslationService,
    @Inject(BLOG_POST_REPOSITORY)
    private readonly blogPostRepository: BlogPostRepository,
    @Inject(BLOG_SOURCE_CATALOG)
    private readonly blogSourceCatalog: BlogSourceCatalog,
  ) {}

  async translatePendingPosts(
    companies: string[] = this.blogSourceCatalog.listCodes(),
  ): Promise<void> {
    for (const company of companies) {
      try {
        const posts = await this.blogPostRepository.getCompanyPosts(company);
        const untranslatedPosts = posts.filter((post) => !post.isTranslated);

        if (untranslatedPosts.length === 0) {
          continue;
        }

        for (const post of untranslatedPosts) {
          try {
            const sourceTitle = post.originalTitle ?? post.title;
            const sourceDescription =
              post.originalDescription ?? post.description;

            post.title = await this.translationService.translate(sourceTitle);
            post.description = await this.translationService.translate(
              sourceDescription,
            );
            post.originalTitle = sourceTitle;
            post.originalDescription = sourceDescription;
            post.isTranslated = true;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            this.logger.error(
              `Translation error for post ${post.id}: ${errorMessage}`,
            );
          }
        }

        await this.blogPostRepository.saveCompanyPosts(company, posts);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Error translating posts for ${company}: ${errorMessage}`,
        );
      }
    }
  }
}
