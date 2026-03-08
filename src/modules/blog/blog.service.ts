import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { UPDATE_INTERVAL } from './constants/blog.constant';
import {
  BlogResponseDto,
  CompanyListResponseDto,
} from './dto/blog-response.dto';
import { isBackgroundSyncEnabled } from '../../common/utils/background-sync.util';
import { GetAllBlogPostsUseCase } from './application/use-cases/get-all-blog-posts.use-case';
import { GetBlogCompaniesUseCase } from './application/use-cases/get-blog-companies.use-case';
import { GetCompanyBlogPostsUseCase } from './application/use-cases/get-company-blog-posts.use-case';
import { InitializeBlogFeedsUseCase } from './application/use-cases/initialize-blog-feeds.use-case';
import { UpdateBlogFeedsUseCase } from './application/use-cases/update-blog-feeds.use-case';
import { BlogResponseMapper } from './presentation/mappers/blog-response.mapper';

@Injectable()
export class BlogService implements OnModuleInit {
  private readonly logger = new Logger(BlogService.name);
  private isUpdating = false;

  constructor(
    private readonly getAllBlogPostsUseCase: GetAllBlogPostsUseCase,
    private readonly getBlogCompaniesUseCase: GetBlogCompaniesUseCase,
    private readonly getCompanyBlogPostsUseCase: GetCompanyBlogPostsUseCase,
    private readonly initializeBlogFeedsUseCase: InitializeBlogFeedsUseCase,
    private readonly updateBlogFeedsUseCase: UpdateBlogFeedsUseCase,
    private readonly blogResponseMapper: BlogResponseMapper,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!isBackgroundSyncEnabled()) {
      this.logger.log(
        'ENABLE_BACKGROUND_SYNC=false, startup blog sync is skipped.',
      );
      return;
    }

    await this.initializeBlogFeedsUseCase.execute();
  }

  @Interval(UPDATE_INTERVAL)
  async updateFeeds() {
    if (!isBackgroundSyncEnabled()) {
      return;
    }

    if (this.isUpdating) {
      this.logger.warn(
        '블로그 피드 업데이트가 이미 실행 중입니다. 이번 실행은 건너뜁니다.',
      );
      return;
    }

    this.isUpdating = true;
    this.logger.log('Updating blog feeds...');

    try {
      await this.updateBlogFeedsUseCase.execute();

      this.logger.log('Blog feeds update completed');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error in feed update process: ${errorMessage}`);
    } finally {
      this.isUpdating = false;
    }
  }

  async getAllPosts(
    page: number = 1,
    limit: number = 10,
  ): Promise<BlogResponseDto> {
    const posts = await this.getAllBlogPostsUseCase.execute(page, limit);
    return this.blogResponseMapper.toPostsResponse(posts);
  }

  async getCompanyList(): Promise<CompanyListResponseDto[]> {
    const companies = this.getBlogCompaniesUseCase.execute();
    return this.blogResponseMapper.toCompanyList(companies);
  }

  async getCompanyPosts(
    company: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<BlogResponseDto> {
    const posts = await this.getCompanyBlogPostsUseCase.execute(
      company,
      page,
      limit,
    );
    return this.blogResponseMapper.toPostsResponse(posts);
  }
}
