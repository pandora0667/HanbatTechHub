import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import * as Parser from 'rss-parser';
import { BlogPost, RedisBlogPost } from './interfaces/blog.interface';
import {
  TECH_BLOG_RSS,
  UPDATE_INTERVAL,
  REDIS_KEYS,
  DEFAULT_REDIS_TTL,
} from './constants/blog.constant';
import {
  BlogResponseDto,
  CompanyListResponseDto,
  PaginationMetaDto,
} from './dto/blog-response.dto';
import { TranslationService } from '../translation/services/translation.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class BlogService implements OnModuleInit {
  private readonly logger = new Logger(BlogService.name);
  private readonly parser: Parser;
  private isUpdating = false;

  constructor(
    private readonly translationService: TranslationService,
    private readonly redisService: RedisService,
  ) {
    this.parser = new Parser({
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; HanbatTechHub/1.0; +https://github.com/pandora0667/HanbatTechHub)',
        Accept:
          'application/rss+xml, application/xml, application/atom+xml, text/xml, */*',
      },
      customFields: {
        item: [
          ['dc:creator', 'creator'],
          ['content:encoded', 'content'],
          ['atom:updated', 'updated'],
          ['slash:comments', 'comments'],
          ['wfw:commentRss', 'commentRss'],
          ['category', 'categories'],
        ],
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.collectFeeds();
  }

  @Interval(UPDATE_INTERVAL)
  async updateFeeds() {
    if (this.isUpdating) {
      this.logger.warn('블로그 피드 업데이트가 이미 실행 중입니다. 이번 실행은 건너뜁니다.');
      return;
    }

    this.isUpdating = true;
    this.logger.log('Updating blog feeds...');

    try {
      // 1단계: RSS 피드 수집 및 Redis 업데이트
      await this.collectFeeds();

      // 2단계: 번역 필요한 포스트 처리
      await this.translatePendingPosts();

      this.logger.log('Blog feeds update completed');
    } catch (error) {
      this.logger.error(`Error in feed update process: ${error.message}`);
    } finally {
      this.isUpdating = false;
    }
  }

  private async collectFeeds(
    companies: string[] = Object.keys(TECH_BLOG_RSS),
  ): Promise<void> {
    for (const company of companies) {
      const info = TECH_BLOG_RSS[company as keyof typeof TECH_BLOG_RSS];
      if (!info) {
        continue;
      }

      try {
        const existingPosts = await this.getCompanyPostsFromRedis(company);
        const existingPostMap = new Map(
          existingPosts.map((post) => [post.id, post]),
        );
        const feed = await this.parser.parseURL(info.url);
        this.logger.debug(
          `Fetched ${info.name} feed: ${feed.items.length} items`,
        );

        const posts: BlogPost[] = [];

        for (const item of feed.items) {
          if (!item.title || !(item.link || item.guid)) continue;

          let description = '';
          if (item.description) {
            description = item.description
              .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
              .replace(/<[^>]*>/g, '')
              .replace(/\[…\]|\[\.{3}\]|\[\.\.\.\]/g, '')
              .trim();
          }

          const sourceTitle = item.title?.trim() || '';
          const sourceDescription = description || item.contentSnippet || '';
          const id = item.guid || item.link || '';
          const publishDate = new Date(
            item.pubDate || item.isoDate || item.updated || Date.now(),
          );
          const existingPost = existingPostMap.get(id);
          const canReuseExistingPost = Boolean(
            existingPost &&
              existingPost.originalTitle === sourceTitle &&
              existingPost.originalDescription === sourceDescription,
          );

          const post: BlogPost = {
            id,
            company: info.name,
            title:
              canReuseExistingPost && existingPost
                ? existingPost.title
                : sourceTitle,
            description:
              canReuseExistingPost && existingPost
              ? existingPost.description
              : sourceDescription,
            originalTitle: sourceTitle,
            originalDescription: sourceDescription,
            link: item.link || item.guid || '',
            author:
              item.creator || item.author || item['dc:creator'] || undefined,
            publishDate,
            isTranslated:
              canReuseExistingPost && existingPost
                ? existingPost.isTranslated
                : false,
          };

          posts.push(post);
        }

        // Redis에 저장
        await this.saveCompanyPostsToRedis(company, posts);
        await this.redisService.set(
          `${REDIS_KEYS.BLOG_LAST_UPDATE}${company}`,
          new Date().toISOString(),
          DEFAULT_REDIS_TTL,
        );

        this.logger.debug(
          `Updated ${info.name} feed in Redis: ${posts.length} valid posts`,
        );
      } catch (error) {
        this.logger.error(`Error updating ${info.name} feed: ${error.message}`);
      }
    }
  }

  private async translatePendingPosts() {
    for (const [company] of Object.entries(TECH_BLOG_RSS)) {
      try {
        const posts = await this.getCompanyPostsFromRedis(company);
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

            // 번역된 포스트 업데이트
            await this.saveCompanyPostsToRedis(company, posts);
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

  private async getCompanyPostsFromRedis(company: string): Promise<BlogPost[]> {
    const companyKey = `${REDIS_KEYS.BLOG_COMPANY}${company}`;
    const redisPosts = await this.redisService.get<RedisBlogPost[]>(companyKey);

    if (!redisPosts) return [];

    return redisPosts.map((post) => ({
      ...post,
      publishDate: new Date(post.publishDate),
      originalTitle: post.originalTitle ?? post.title,
      originalDescription: post.originalDescription ?? post.description,
    }));
  }

  private async saveCompanyPostsToRedis(company: string, posts: BlogPost[]) {
    const companyKey = `${REDIS_KEYS.BLOG_COMPANY}${company}`;
    const redisPosts: RedisBlogPost[] = posts.map((post) => ({
      ...post,
      publishDate: post.publishDate.toISOString(),
    }));

    await this.redisService.set(companyKey, redisPosts, DEFAULT_REDIS_TTL);
  }

  async getAllPosts(
    page: number = 1,
    limit: number = 10,
  ): Promise<BlogResponseDto> {
    const allPosts: BlogPost[] = [];

    for (const company of Object.keys(TECH_BLOG_RSS)) {
      const posts = await this.getCompanyPostsFromRedis(company);
      allPosts.push(...posts);
    }

    if (allPosts.length === 0) {
      await this.collectFeeds();
      for (const company of Object.keys(TECH_BLOG_RSS)) {
        const posts = await this.getCompanyPostsFromRedis(company);
        allPosts.push(...posts);
      }
    }

    const sortedPosts = allPosts.sort(
      (a, b) => b.publishDate.getTime() - a.publishDate.getTime(),
    );
    const total = sortedPosts.length;
    const startIndex = (page - 1) * limit;
    const items = sortedPosts.slice(startIndex, startIndex + limit);

    return {
      items,
      meta: this.createPaginationMeta(total, page, limit),
    };
  }

  async getCompanyList(): Promise<CompanyListResponseDto[]> {
    return Object.entries(TECH_BLOG_RSS).map(([code, info]) => ({
      code,
      name: info.name,
    }));
  }

  async getCompanyPosts(
    company: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<BlogResponseDto> {
    const companyInfo = TECH_BLOG_RSS[company as keyof typeof TECH_BLOG_RSS];
    if (!companyInfo) {
      throw new NotFoundException(`Company ${company} not found`);
    }

    let posts = await this.getCompanyPostsFromRedis(company);
    if (posts.length === 0) {
      await this.collectFeeds([company]);
      posts = await this.getCompanyPostsFromRedis(company);
    }

    const total = posts.length;
    const startIndex = (page - 1) * limit;
    const items = posts
      .sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime())
      .slice(startIndex, startIndex + limit);

    return {
      items,
      meta: this.createPaginationMeta(total, page, limit),
    };
  }

  private createPaginationMeta(
    total: number,
    page: number,
    limit: number,
  ): PaginationMetaDto {
    const safeLimit = limit > 0 ? limit : 1;
    const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);
    return {
      totalCount: total,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
