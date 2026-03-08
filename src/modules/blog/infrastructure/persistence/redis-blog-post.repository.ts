import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../redis/redis.service';
import { appendRedisKey } from '../../../../common/utils/redis-key.util';
import { DEFAULT_REDIS_TTL, REDIS_KEYS } from '../../constants/blog.constant';
import { BlogPost, RedisBlogPost } from '../../interfaces/blog.interface';
import { BlogPostRepository } from '../../application/ports/blog-post.repository';

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
}
