import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import * as Parser from 'rss-parser';
import { BlogPost, BlogPostCache } from './interfaces/blog.interface';
import { TECH_BLOG_RSS, UPDATE_INTERVAL } from './constants/blog.constant';
import {
  BlogResponseDto,
  CompanyListResponseDto,
} from './dto/blog-response.dto';
import { TranslationService } from '../translation/services/translation.service';

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);
  private readonly parser: Parser;
  private cache: Map<string, BlogPostCache> = new Map();

  constructor(private readonly translationService: TranslationService) {
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
    // 서버 시작시 최초 데이터 로드
    this.updateFeeds();
  }

  @Interval(UPDATE_INTERVAL)
  async updateFeeds() {
    this.logger.log('Updating blog feeds...');

    try {
      // 1단계: RSS 피드 수집 및 기본 캐시 업데이트
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

          // 기존 포스트가 있는 경우 번역 상태 유지
          const existingPost = this.cache
            .get(company)
            ?.posts.find((p) => p.id === post.id);
          if (existingPost?.isTranslated) {
            post.isTranslated = true;
            post.title = existingPost.title;
            post.description = existingPost.description;
          }

          posts.push(post);
        }

        this.cache.set(company, {
          lastUpdate: new Date(),
          posts: posts.filter((post) => post.id && post.title && post.link),
        });

        this.logger.debug(
          `Updated ${info.name} feed: ${posts.length} valid posts`,
        );
      } catch (error) {
        this.logger.error(`Error updating ${info.name} feed: ${error.message}`);
      }
    }
  }

  private async translatePendingPosts() {
    for (const [company, cache] of this.cache.entries()) {
      const untranslatedPosts = cache.posts.filter(
        (post) => !post.isTranslated,
      );

      for (const post of untranslatedPosts) {
        try {
          // 한글 포함 여부 확인
          const titleHasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(post.title);
          const descriptionHasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(
            post.description,
          );

          // 영어만 있는지 확인 (숫자, 특수문자 제외)
          const titleIsEnglish = /^[A-Za-z\s\-_]+$/.test(
            post.title.replace(/[0-9\W]/g, ''),
          );

          if (titleHasKorean || descriptionHasKorean) {
            this.logger.debug(
              `Skipping translation for Korean post: ${post.title}`,
            );
            post.isTranslated = true; // 한글 컨텐츠는 번역 완료로 표시
          } else if (titleIsEnglish && descriptionHasKorean) {
            this.logger.debug(
              `Skipping translation for post with English title and Korean description: ${post.title}`,
            );
            post.isTranslated = true;
          } else if (!titleHasKorean && !descriptionHasKorean) {
            this.logger.log(`Translating post: ${post.title}`);

            // description이 비어있는 경우 (예: 넷플릭스 블로그)
            if (!post.description) {
              const translationResult = await this.translationService.translateBlogPost(
                post.title,
                '', // 빈 description 전달
              );

              if (translationResult.success && translationResult.translatedTitle) {
                post.title = translationResult.translatedTitle;
                post.isTranslated = true;
                this.logger.log(`Title-only translation successful for post: ${post.id}`);

                // 번역 성공 후 3초 대기
                this.logger.log('Waiting 3 seconds before next translation...');
                await new Promise((resolve) => setTimeout(resolve, 3000));
              } else {
                this.logger.warn(
                  `Title-only translation failed for post: ${post.id}: ${translationResult.error}`,
                );
              }
              continue; // 다음 포스트로 진행
            }

            const translationResult = await this.translationService.translateBlogPost(
              post.title,
              post.description,
            );

            if (translationResult.success) {
              const translatedTitle = translationResult.translatedTitle;
              const translatedDescription =
                translationResult.translatedDescription;

              if (translatedTitle && translatedDescription) {
                post.title = translatedTitle;
                post.description = translatedDescription;
                post.isTranslated = true;
                this.logger.log(`Translation successful for post: ${post.id}`);

                // 번역 성공 후 3초 대기
                this.logger.log('Waiting 3 seconds before next translation...');
                await new Promise((resolve) => setTimeout(resolve, 3000));
              } else {
                this.logger.warn(
                  `Translation result empty for post: ${post.id}, keeping original content`,
                );
              }
            } else {
              this.logger.warn(
                `Translation failed for post: ${post.id}: ${translationResult.error}`,
              );
            }
          }
        } catch (error) {
          this.logger.error(
            `Translation error for post: ${post.id}`,
            error.stack,
          );
        }
      }

      // 캐시 업데이트
      this.cache.set(company, {
        lastUpdate: cache.lastUpdate,
        posts: cache.posts,
      });
    }
  }

  async getAllPosts(
    page: number = 1,
    limit: number = 10,
  ): Promise<BlogResponseDto> {
    const allPosts = Array.from(this.cache.values())
      .flatMap((cache) => cache.posts)
      .sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());

    const total = allPosts.length;
    const startIndex = (page - 1) * limit;
    const items = allPosts.slice(startIndex, startIndex + limit);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        hasNext: startIndex + limit < total,
      },
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

    const cache = this.cache.get(company);
    if (!cache) {
      return {
        items: [],
        meta: {
          total: 0,
          page,
          limit,
          hasNext: false,
        },
      };
    }

    const total = cache.posts.length;
    const startIndex = (page - 1) * limit;
    const items = cache.posts
      .sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime())
      .slice(startIndex, startIndex + limit);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        hasNext: startIndex + limit < total,
      },
    };
  }
}
