import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SnapshotMetadata } from '../../../../common/types/snapshot.types';
import {
  buildSnapshotMetadata,
  mergeSnapshotMetadata,
} from '../../../../common/utils/snapshot.util';
import {
  MENU_CACHE_REPOSITORY,
  MenuCacheRepository,
} from '../../../menu/application/ports/menu-cache.repository';
import {
  MENU_CACHE_TTL,
  MENU_SOURCE_CONFIDENCE,
  MENU_SOURCE_ID,
} from '../../../menu/constants/menu.constant';
import { MenuCalendarService } from '../../../menu/domain/services/menu-calendar.service';
import {
  NOTICE_CACHE_REPOSITORY,
  NoticeCacheRepository,
} from '../../../notice/application/ports/notice-cache.repository';
import {
  NOTICE_CACHE_TTL,
  NOTICE_SOURCE_CONFIDENCE,
  NOTICE_SOURCE_ID,
} from '../../../notice/constants/notice.constant';
import { SourceRegistryService } from '../../../source-registry/source-registry.service';
import {
  getInstitutionRegistryEntry,
  InstitutionType,
} from '../../constants/institution-registry.constant';
import { InstitutionOverviewResponseDto } from '../../dto/institution.response.dto';

@Injectable()
export class GetInstitutionOverviewUseCase {
  constructor(
    @Inject(MENU_CACHE_REPOSITORY)
    private readonly menuCacheRepository: MenuCacheRepository,
    @Inject(NOTICE_CACHE_REPOSITORY)
    private readonly noticeCacheRepository: NoticeCacheRepository,
    private readonly menuCalendarService: MenuCalendarService,
    private readonly sourceRegistryService: SourceRegistryService,
  ) {}

  async execute(
    institution: InstitutionType,
  ): Promise<InstitutionOverviewResponseDto> {
    const registryEntry = getInstitutionRegistryEntry(institution);

    if (!registryEntry) {
      throw new NotFoundException(`Unsupported institution: ${institution}`);
    }

    if (registryEntry.sourceIds.length === 0) {
      throw new NotFoundException(
        `Institution overview is not implemented yet for ${institution}`,
      );
    }

    const mondayDate = this.menuCalendarService.formatDate(
      this.menuCalendarService.getMondayDate(new Date()),
    );
    const [
      regularNotices,
      newNotices,
      featuredNotices,
      todayNotices,
      weeklyMenus,
      noticeLastUpdate,
      weeklyMenuLastUpdate,
    ] = await Promise.all([
      this.noticeCacheRepository.getRegularNotices(),
      this.noticeCacheRepository.getNoticeGroup('new'),
      this.noticeCacheRepository.getNoticeGroup('featured'),
      this.noticeCacheRepository.getNoticeGroup('today'),
      this.menuCacheRepository.getWeeklyMenu(mondayDate),
      this.noticeCacheRepository.getLastUpdate(),
      this.menuCacheRepository.getWeeklyMenuLastUpdate(mondayDate),
    ]);
    const noticeSnapshot = noticeLastUpdate
      ? buildSnapshotMetadata({
          collectedAt: noticeLastUpdate,
          ttlSeconds: NOTICE_CACHE_TTL,
          confidence: NOTICE_SOURCE_CONFIDENCE,
          sourceIds: [NOTICE_SOURCE_ID],
        })
      : undefined;
    const menuSnapshot = weeklyMenuLastUpdate
      ? buildSnapshotMetadata({
          collectedAt: weeklyMenuLastUpdate,
          ttlSeconds: MENU_CACHE_TTL,
          confidence: MENU_SOURCE_CONFIDENCE,
          sourceIds: [MENU_SOURCE_ID],
        })
      : undefined;
    const mergedSnapshot = mergeSnapshotMetadata(
      [noticeSnapshot, menuSnapshot].filter(
        (snapshot): snapshot is SnapshotMetadata => snapshot !== undefined,
      ),
    );
    const menus = weeklyMenus ?? [];
    const notices = regularNotices ?? [];

    return {
      generatedAt: new Date().toISOString(),
      institution: {
        id: registryEntry.id,
        name: registryEntry.name,
        region: registryEntry.region,
        audience: registryEntry.audience,
        institutionType: registryEntry.institutionType,
        officialEntryUrl: registryEntry.officialEntryUrl,
        siteFamily: registryEntry.siteFamily,
        rolloutWave: registryEntry.rolloutWave,
        rolloutStatus: registryEntry.rolloutStatus,
        overviewAvailable: true,
        priorityServiceTypes: [...registryEntry.priorityServiceTypes],
        implementedServiceTypes: [...registryEntry.implementedServiceTypes],
        sourceIds: [...registryEntry.sourceIds],
      },
      snapshot: mergedSnapshot,
      summary: {
        regularNotices: notices.length,
        newNotices: (newNotices ?? []).length,
        featuredNotices: (featuredNotices ?? []).length,
        todayNotices: (todayNotices ?? []).length,
        weeklyMenus: menus.length,
        lunchAvailableDays: menus.filter((menu) => menu.lunch.length > 0).length,
        dinnerAvailableDays: menus.filter((menu) => menu.dinner.length > 0).length,
      },
      sections: {
        latestNotices: notices.slice(0, 5).map((notice) => ({
          nttId: notice.nttId,
          title: notice.title,
          author: notice.author,
          date: notice.date,
          link: notice.link,
        })),
        newNotices: (newNotices ?? []).slice(0, 5).map((notice) => ({
          nttId: notice.nttId,
          title: notice.title,
          author: notice.author,
          date: notice.date,
          link: notice.link,
        })),
        featuredNotices: (featuredNotices ?? []).slice(0, 5).map((notice) => ({
          nttId: notice.nttId,
          title: notice.title,
          author: notice.author,
          date: notice.date,
          link: notice.link,
        })),
        weeklyMenus: menus.map((menu) => ({
          date: menu.date,
          lunch: [...menu.lunch],
          dinner: [...menu.dinner],
        })),
        sources: this.sourceRegistryService
          .list()
          .filter((source) => registryEntry.sourceIds.includes(source.id))
          .sort((left, right) => left.id.localeCompare(right.id)),
      },
    };
  }
}
