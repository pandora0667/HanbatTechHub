import { Inject, Injectable } from '@nestjs/common';
import { BLOG_POST_REPOSITORY, BlogPostRepository } from '../../../blog/application/ports/blog-post.repository';
import { JOB_POSTING_CACHE_REPOSITORY, JobPostingCacheRepository } from '../../../jobs/application/ports/job-posting-cache.repository';
import { MENU_CACHE_REPOSITORY, MenuCacheRepository } from '../../../menu/application/ports/menu-cache.repository';
import { NOTICE_CACHE_REPOSITORY, NoticeCacheRepository } from '../../../notice/application/ports/notice-cache.repository';
import { formatDate, getMondayDate } from '../../../../common/utils/date.utils';

const BLOG_SOURCE_PREFIX = 'content.blog.';
const JOB_SOURCE_PREFIX = 'opportunity.jobs.';

@Injectable()
export class SourceLastUpdateResolverService {
  constructor(
    @Inject(JOB_POSTING_CACHE_REPOSITORY)
    private readonly jobPostingCacheRepository: JobPostingCacheRepository,
    @Inject(BLOG_POST_REPOSITORY)
    private readonly blogPostRepository: BlogPostRepository,
    @Inject(NOTICE_CACHE_REPOSITORY)
    private readonly noticeCacheRepository: NoticeCacheRepository,
    @Inject(MENU_CACHE_REPOSITORY)
    private readonly menuCacheRepository: MenuCacheRepository,
  ) {}

  async resolve(sourceId: string): Promise<string | null> {
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

    return null;
  }
}
