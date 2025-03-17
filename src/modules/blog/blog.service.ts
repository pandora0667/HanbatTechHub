import { Injectable, Logger } from '@nestjs/common';
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
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);
  private readonly parser: Parser;
  private readonly redis: Redis;

  constructor(
    private readonly translationService: TranslationService,
    private readonly configService: ConfigService,
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

    // Redis 클라이언트 초기화
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB'),
    });

    // 서버 시작시 최초 데이터 로드
    this.updateFeeds();
  }

  @Interval(UPDATE_INTERVAL)
  async updateFeeds() {
    this.logger.log('Updating blog feeds...');

    try {
      // 1단계: RSS 피드 수집 및 Redis 업데이트
      await this.collectFeeds();

      // 2단계: 번역 필요한 포스트 처리
      await this.translatePendingPosts();

      this.logger.log('Blog feeds update completed');
    } catch (error) {
      this.logger.error(`Error in feed update process: ${error.message}`);
    }
  }

  private async collectFeeds() {
    for (const [company, info] of Object.entries(TECH_BLOG_RSS)) {
      try {
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

          const post: BlogPost = {
            id: item.guid || item.link || '',
            company: info.name,
            title: item.title?.trim() || '',
            description: description || item.contentSnippet || '',
            link: item.link || item.guid || '',
            author:
              item.creator || item.author || item['dc:creator'] || undefined,
            publishDate: new Date(
              item.pubDate || item.isoDate || item.updated || Date.now(),
            ),
            isTranslated: false,
          };

          posts.push(post);
        }

        // Redis에 저장
        await this.saveCompanyPostsToRedis(company, posts);
        await this.redis.set(
          `${REDIS_KEYS.BLOG_LAST_UPDATE}${company}`,
          new Date().toISOString(),
          'EX',
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
            const translatedTitle = await this.translationService.translate(
              post.title,
            );
            const translatedDescription =
              await this.translationService.translate(post.description);

            post.title = translatedTitle;
            post.description = translatedDescription;
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
    const postsJson = await this.redis.get(companyKey);

    if (!postsJson) return [];

    const redisPosts: RedisBlogPost[] = JSON.parse(postsJson);
    return redisPosts.map((post) => ({
      ...post,
      publishDate: new Date(post.publishDate),
    }));
  }

  private async saveCompanyPostsToRedis(company: string, posts: BlogPost[]) {
    const companyKey = `${REDIS_KEYS.BLOG_COMPANY}${company}`;
    const redisPosts: RedisBlogPost[] = posts.map((post) => ({
      ...post,
      publishDate: post.publishDate.toISOString(),
    }));

    await this.redis.set(
      companyKey,
      JSON.stringify(redisPosts),
      'EX',
      DEFAULT_REDIS_TTL,
    );
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
    const companyInfo = TECH_BLOG_RSS[company];
    if (!companyInfo) {
      throw new Error(`Company ${company} not found`);
    }

    const posts = await this.getCompanyPostsFromRedis(company);
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
    const totalPages = Math.ceil(total / limit);
    return {
      totalCount: total,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
