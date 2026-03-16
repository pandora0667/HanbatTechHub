import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../redis/redis.service';
import { appendRedisKey } from '../../../../common/utils/redis-key.util';
import {
  BLOG_CONTENT_HISTORY_LIMIT,
  BLOG_CONTENT_HISTORY_TTL,
  DEFAULT_REDIS_TTL,
  REDIS_KEYS,
} from '../../constants/blog.constant';
import { BlogPost, RedisBlogPost } from '../../interfaces/blog.interface';
import { BlogPostRepository } from '../../application/ports/blog-post.repository';
import { ContentSnapshotHistoryEntry } from '../../../content-intelligence/domain/models/content-snapshot-history.model';

@Injectable()
export class RedisBlogPostRepository implements BlogPostRepository {
  constructor(private readonly redisService: RedisService) {}

  async getCompanyPosts(company: string): Promise<BlogPost[]> {
    const companyKey = appendRedisKey(REDIS_KEYS.BLOG_COMPANY, company);
    const redisPosts = await this.redisService.get<RedisBlogPost[]>(companyKey);

    if (!redisPosts) {
      return [];
    }

    return redisPosts.map((post) => ({
      ...post,
      publishDate: new Date(post.publishDate),
      originalTitle: post.originalTitle ?? post.title,
      originalDescription: post.originalDescription ?? post.description,
    }));
  }

  async getPostsForCompanies(companies: string[]): Promise<BlogPost[]> {
    const posts = await Promise.all(
      companies.map((company) => this.getCompanyPosts(company)),
    );

    return posts.flat();
  }

  async saveCompanyPosts(company: string, posts: BlogPost[]): Promise<void> {
    const companyKey = appendRedisKey(REDIS_KEYS.BLOG_COMPANY, company);
    const redisPosts: RedisBlogPost[] = posts.map((post) => ({
      ...post,
      publishDate: post.publishDate.toISOString(),
    }));

    await this.redisService.set(companyKey, redisPosts, DEFAULT_REDIS_TTL);
  }

  async getCompanyLastUpdate(company: string): Promise<string | null> {
    return this.redisService.get<string>(
      appendRedisKey(REDIS_KEYS.BLOG_LAST_UPDATE, company),
    );
  }

  async setCompanyLastUpdate(
    company: string,
    timestamp: string,
  ): Promise<void> {
    await this.redisService.set(
      appendRedisKey(REDIS_KEYS.BLOG_LAST_UPDATE, company),
      timestamp,
      DEFAULT_REDIS_TTL,
    );
  }

  async getContentSnapshotHistory(
    limit = BLOG_CONTENT_HISTORY_LIMIT,
  ): Promise<ContentSnapshotHistoryEntry[]> {
    const history = await this.redisService.get<ContentSnapshotHistoryEntry[]>(
      REDIS_KEYS.BLOG_CONTENT_HISTORY,
    );

    if (!Array.isArray(history)) {
      return [];
    }

    return history.slice(0, limit);
  }

  async appendContentSnapshotHistory(
    entry: ContentSnapshotHistoryEntry,
  ): Promise<void> {
    const history = await this.getContentSnapshotHistory(BLOG_CONTENT_HISTORY_LIMIT);
    const nextHistory =
      history[0]?.snapshot.collectedAt === entry.snapshot.collectedAt
        ? [entry, ...history.slice(1)]
        : [entry, ...history];

    await this.redisService.set(
      REDIS_KEYS.BLOG_CONTENT_HISTORY,
      nextHistory.slice(0, BLOG_CONTENT_HISTORY_LIMIT),
      BLOG_CONTENT_HISTORY_TTL,
    );
  }
}
