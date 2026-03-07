import {
  Injectable,
  Logger,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import {
  UPDATE_INTERVAL,
} from './constants/blog.constant';
import {
  BlogResponseDto,
  CompanyListResponseDto,
} from './dto/blog-response.dto';
import { TranslationService } from '../translation/services/translation.service';
import { isBackgroundSyncEnabled } from '../../common/utils/background-sync.util';
import { BlogFeedCollectorService } from './application/services/blog-feed-collector.service';
import { GetAllBlogPostsUseCase } from './application/use-cases/get-all-blog-posts.use-case';
import { GetBlogCompaniesUseCase } from './application/use-cases/get-blog-companies.use-case';
import { GetCompanyBlogPostsUseCase } from './application/use-cases/get-company-blog-posts.use-case';
import {
  BLOG_POST_REPOSITORY,
  BlogPostRepository,
} from './application/ports/blog-post.repository';
import {
  BLOG_SOURCE_CATALOG,
  BlogSourceCatalog,
} from './application/ports/blog-source-catalog';

@Injectable()
export class BlogService implements OnModuleInit {
  private readonly logger = new Logger(BlogService.name);
  private isUpdating = false;

  constructor(
    private readonly translationService: TranslationService,
    private readonly blogFeedCollectorService: BlogFeedCollectorService,
    private readonly getAllBlogPostsUseCase: GetAllBlogPostsUseCase,
    private readonly getBlogCompaniesUseCase: GetBlogCompaniesUseCase,
    private readonly getCompanyBlogPostsUseCase: GetCompanyBlogPostsUseCase,
    @Inject(BLOG_POST_REPOSITORY)
    private readonly blogPostRepository: BlogPostRepository,
    @Inject(BLOG_SOURCE_CATALOG)
    private readonly blogSourceCatalog: BlogSourceCatalog,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!isBackgroundSyncEnabled()) {
      this.logger.log(
        'ENABLE_BACKGROUND_SYNC=false, startup blog sync is skipped.',
      );
      return;
    }

    await this.blogFeedCollectorService.collectFeeds();
  }

  @Interval(UPDATE_INTERVAL)
  async updateFeeds() {
    if (!isBackgroundSyncEnabled()) {
      return;
    }

    if (this.isUpdating) {
      this.logger.warn('블로그 피드 업데이트가 이미 실행 중입니다. 이번 실행은 건너뜁니다.');
      return;
    }

    this.isUpdating = true;
    this.logger.log('Updating blog feeds...');

    try {
      await this.blogFeedCollectorService.collectFeeds();

      await this.translatePendingPosts();

      this.logger.log('Blog feeds update completed');
    } catch (error) {
      this.logger.error(`Error in feed update process: ${error.message}`);
    } finally {
      this.isUpdating = false;
    }
  }

  private async translatePendingPosts() {
    for (const company of this.blogSourceCatalog.listCodes()) {
      try {
        const posts = await this.blogPostRepository.getCompanyPosts(company);
        const untranslatedPosts = posts.filter((post) => !post.isTranslated);

        for (const post of untranslatedPosts) {
          try {
            const sourceTitle = post.originalTitle ?? post.title;
            const sourceDescription =
              post.originalDescription ?? post.description;
            const translatedTitle = await this.translationService.translate(
              sourceTitle,
            );
            const translatedDescription =
              await this.translationService.translate(sourceDescription);

            post.title = translatedTitle;
            post.description = translatedDescription;
            post.originalTitle = sourceTitle;
            post.originalDescription = sourceDescription;
            post.isTranslated = true;

            await this.blogPostRepository.saveCompanyPosts(company, posts);
          } catch (error) {
            this.logger.error(
              `Translation error for post ${post.id}: ${error.message}`,
            );
          }
        }
      } catch (error) {
        this.logger.error(
          `Error translating posts for ${company}: ${error.message}`,
        );
      }
    }
  }

  async getAllPosts(
    page: number = 1,
    limit: number = 10,
  ): Promise<BlogResponseDto> {
    return this.getAllBlogPostsUseCase.execute(page, limit);
  }

  async getCompanyList(): Promise<CompanyListResponseDto[]> {
    return this.getBlogCompaniesUseCase.execute();
  }

  async getCompanyPosts(
    company: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<BlogResponseDto> {
    return this.getCompanyBlogPostsUseCase.execute(company, page, limit);
  }
}
