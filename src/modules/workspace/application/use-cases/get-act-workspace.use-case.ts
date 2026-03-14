import { Inject, Injectable } from '@nestjs/common';
import { SnapshotMetadata } from '../../../../common/types/snapshot.types';
import {
  buildSnapshotMetadata,
  mergeSnapshotMetadata,
} from '../../../../common/utils/snapshot.util';
import {
  BLOG_POST_REPOSITORY,
  BlogPostRepository,
} from '../../../blog/application/ports/blog-post.repository';
import {
  BLOG_SOURCE_CATALOG,
  BlogSourceCatalog,
} from '../../../blog/application/ports/blog-source-catalog';
import {
  BLOG_SOURCE_CONFIDENCE,
  DEFAULT_REDIS_TTL,
  getBlogSourceId,
} from '../../../blog/constants/blog.constant';
import { NoticeCacheRepository, NOTICE_CACHE_REPOSITORY } from '../../../notice/application/ports/notice-cache.repository';
import {
  NOTICE_CACHE_TTL,
  NOTICE_SOURCE_CONFIDENCE,
  NOTICE_SOURCE_ID,
} from '../../../notice/constants/notice.constant';
import { SignalsService } from '../../../signals/signals.service';
import { GetInstitutionOpportunityBoardUseCase } from '../../../institution-intelligence/application/use-cases/get-institution-opportunity-board.use-case';
import { GetActWorkspaceQueryDto } from '../../dto/get-act-workspace-query.dto';
import { ActWorkspaceResponseDto } from '../../dto/act-workspace.response.dto';
import { ActWorkspaceOverviewService } from '../../domain/services/act-workspace-overview.service';
import { WorkspaceActionBuilderService } from '../../domain/services/workspace-action-builder.service';

@Injectable()
export class GetActWorkspaceUseCase {
  constructor(
    private readonly signalsService: SignalsService,
    private readonly getInstitutionOpportunityBoardUseCase: GetInstitutionOpportunityBoardUseCase,
    @Inject(BLOG_POST_REPOSITORY)
    private readonly blogPostRepository: BlogPostRepository,
    @Inject(BLOG_SOURCE_CATALOG)
    private readonly blogSourceCatalog: BlogSourceCatalog,
    @Inject(NOTICE_CACHE_REPOSITORY)
    private readonly noticeCacheRepository: NoticeCacheRepository,
    private readonly workspaceActionBuilderService: WorkspaceActionBuilderService,
    private readonly actWorkspaceOverviewService: ActWorkspaceOverviewService,
  ) {}

  async execute(
    query: GetActWorkspaceQueryDto = {},
  ): Promise<ActWorkspaceResponseDto> {
    const [
      upcomingDeadlines,
      newOpportunities,
      updatedOpportunities,
      institutionChecks,
      institutionOpportunities,
      readingQueue,
    ] = await Promise.all([
      this.signalsService.getUpcomingOpportunitySignals({
        days: query.deadlineWindowDays,
        limit: query.deadlineLimit,
      }),
      this.signalsService.getOpportunityChangeSignals({
        changeType: 'new',
        limit: query.newJobLimit,
      }),
      this.signalsService.getOpportunityChangeSignals({
        changeType: 'updated',
        limit: query.updatedJobLimit,
      }),
      this.getInstitutionChecks(query.noticeLimit ?? 3),
      this.getInstitutionOpportunityActions(
        query.institutionLimit ?? 3,
        query.institutions,
      ),
      this.getReadingQueue(query.contentLimit ?? 3),
    ]);
    const applyNow = upcomingDeadlines.signals.map((signal) =>
      this.workspaceActionBuilderService.fromUpcomingDeadline(signal),
    );
    const reviewChanges = [
      ...newOpportunities.signals.map((signal) =>
        this.workspaceActionBuilderService.fromJobChange(signal),
      ),
      ...updatedOpportunities.signals.map((signal) =>
        this.workspaceActionBuilderService.fromJobChange(signal),
      ),
    ];
    const institutionActions = institutionChecks.items.map((notice) =>
      this.workspaceActionBuilderService.fromNotice(notice),
    );
    const institutionOpportunityActions = institutionOpportunities.items.map((item) =>
      this.workspaceActionBuilderService.fromInstitutionOpportunity(item),
    );
    const contentActions = readingQueue.items.map((post) =>
      this.workspaceActionBuilderService.fromContent(post),
    );
    const actions = this.workspaceActionBuilderService.rank(
      [
        ...applyNow,
        ...reviewChanges,
        ...institutionActions,
        ...institutionOpportunityActions,
        ...contentActions,
      ],
      query.limit ?? 12,
    );
    const generatedAt = new Date().toISOString();

    return {
      generatedAt,
      snapshot: mergeSnapshotMetadata(
        [
          upcomingDeadlines.snapshot,
          newOpportunities.snapshot,
          updatedOpportunities.snapshot,
          institutionChecks.snapshot,
          institutionOpportunities.snapshot,
          readingQueue.snapshot,
        ].filter((snapshot): snapshot is SnapshotMetadata => snapshot !== undefined),
      ),
      overview: this.actWorkspaceOverviewService.build(actions),
      sections: {
        applyNow,
        reviewChanges,
        institutionChecks: institutionActions,
        institutionOpportunities: institutionOpportunityActions,
        readingQueue: contentActions,
      },
      actions,
    };
  }

  private async getInstitutionChecks(limit: number) {
    const notices = await this.noticeCacheRepository.getNoticeGroup('new');
    const lastUpdate = await this.noticeCacheRepository.getLastUpdate();

    return {
      items: (notices ?? []).slice(0, limit),
      snapshot: lastUpdate
        ? buildSnapshotMetadata({
            collectedAt: lastUpdate,
            ttlSeconds: NOTICE_CACHE_TTL,
            confidence: NOTICE_SOURCE_CONFIDENCE,
            sourceIds: [NOTICE_SOURCE_ID],
          })
        : undefined,
    };
  }

  private async getReadingQueue(limit: number) {
    const companyCodes = this.blogSourceCatalog.listCodes();
    const [posts, snapshots] = await Promise.all([
      this.blogPostRepository.getPostsForCompanies(companyCodes),
      Promise.all(
        companyCodes.map(async (companyCode) => {
          const lastUpdate = await this.blogPostRepository.getCompanyLastUpdate(companyCode);
          if (!lastUpdate) {
            return undefined;
          }

          return buildSnapshotMetadata({
            collectedAt: lastUpdate,
            ttlSeconds: DEFAULT_REDIS_TTL,
            confidence: BLOG_SOURCE_CONFIDENCE,
            sourceIds: [getBlogSourceId(companyCode)],
          });
        }),
      ),
    ]);

    return {
      items: posts
        .slice()
        .sort(
          (left, right) =>
            new Date(right.publishDate).getTime() -
            new Date(left.publishDate).getTime(),
        )
        .slice(0, limit),
      snapshot: mergeSnapshotMetadata(
        snapshots.filter(
          (snapshot): snapshot is SnapshotMetadata => snapshot !== undefined,
        ),
      ),
    };
  }

  private getInstitutionOpportunityActions(limit: number, institutions?: string) {
    return this.getInstitutionOpportunityBoardUseCase.execute({
      institutions,
      rolloutWave: institutions ? undefined : 1,
      limit,
      page: 1,
    });
  }
}
