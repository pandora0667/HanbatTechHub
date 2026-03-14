import { Inject, Injectable } from '@nestjs/common';
import { BLOG_POST_REPOSITORY, BlogPostRepository } from '../../../blog/application/ports/blog-post.repository';
import { appendRedisKey } from '../../../../common/utils/redis-key.util';
import {
  INSTITUTION_DISCOVERY_REDIS_KEYS,
} from '../../../institution-intelligence/constants/institution-discovery.constant';
import {
  INSTITUTION_ENUM,
  InstitutionType,
} from '../../../institution-intelligence/constants/institution-id.constant';
import { InstitutionDiscoverySnapshot } from '../../../institution-intelligence/domain/types/institution-discovery.type';
import { JOB_POSTING_CACHE_REPOSITORY, JobPostingCacheRepository } from '../../../jobs/application/ports/job-posting-cache.repository';
import { MENU_CACHE_REPOSITORY, MenuCacheRepository } from '../../../menu/application/ports/menu-cache.repository';
import { NOTICE_CACHE_REPOSITORY, NoticeCacheRepository } from '../../../notice/application/ports/notice-cache.repository';
import { RedisService } from '../../../redis/redis.service';
import { formatDate, getMondayDate } from '../../../../common/utils/date.utils';

const BLOG_SOURCE_PREFIX = 'content.blog.';
const JOB_SOURCE_PREFIX = 'opportunity.jobs.';
const INSTITUTION_DISCOVERY_SOURCE_PATTERN = /^institution\.([a-z0-9_]+)\.discovery$/;

@Injectable()
export class SourceRuntimeStatusService {
  constructor(
    @Inject(JOB_POSTING_CACHE_REPOSITORY)
    private readonly jobPostingCacheRepository: JobPostingCacheRepository,
    @Inject(BLOG_POST_REPOSITORY)
    private readonly blogPostRepository: BlogPostRepository,
    @Inject(NOTICE_CACHE_REPOSITORY)
    private readonly noticeCacheRepository: NoticeCacheRepository,
    @Inject(MENU_CACHE_REPOSITORY)
    private readonly menuCacheRepository: MenuCacheRepository,
    private readonly redisService: RedisService,
  ) {}

  async getLastSuccessAt(sourceId: string): Promise<string | null> {
    if (sourceId.startsWith(JOB_SOURCE_PREFIX)) {
      const company = sourceId.substring(JOB_SOURCE_PREFIX.length).toUpperCase();
      const entry = await this.jobPostingCacheRepository.getCompanyJobs(company as never);
      return entry?.snapshot?.collectedAt ?? null;
    }

    if (sourceId.startsWith(BLOG_SOURCE_PREFIX)) {
      const company = sourceId.substring(BLOG_SOURCE_PREFIX.length).toUpperCase();
      return this.blogPostRepository.getCompanyLastUpdate(company);
    }

    if (sourceId === 'institution.hanbat.notice') {
      return this.noticeCacheRepository.getLastUpdate();
    }

    if (sourceId === 'institution.hanbat.menu') {
      const monday = formatDate(getMondayDate(new Date()));
      return this.menuCacheRepository.getWeeklyMenuLastUpdate(monday);
    }

    const discoveryMatch = sourceId.match(INSTITUTION_DISCOVERY_SOURCE_PATTERN);
    if (discoveryMatch) {
      const institution = discoveryMatch[1].toUpperCase() as InstitutionType;
      if (Object.values(INSTITUTION_ENUM).includes(institution)) {
        const snapshot = await this.redisService.get<InstitutionDiscoverySnapshot>(
          appendRedisKey(INSTITUTION_DISCOVERY_REDIS_KEYS.SNAPSHOT, institution),
        );
        return snapshot?.collectedAt ?? null;
      }
    }

    return null;
  }
}
