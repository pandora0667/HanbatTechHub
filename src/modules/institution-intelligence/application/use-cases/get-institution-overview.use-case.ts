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
import { GetInstitutionDiscoveryUseCase } from './get-institution-discovery.use-case';
import { getInstitutionSourceCatalogEntries } from '../../data/institution-source-catalog.data';
import {
  getInstitutionRegisteredSourceIds,
  mapInstitutionRegistryItem,
} from '../../utils/institution-registry-response.util';

@Injectable()
export class GetInstitutionOverviewUseCase {
  constructor(
    @Inject(MENU_CACHE_REPOSITORY)
    private readonly menuCacheRepository: MenuCacheRepository,
    @Inject(NOTICE_CACHE_REPOSITORY)
    private readonly noticeCacheRepository: NoticeCacheRepository,
    private readonly menuCalendarService: MenuCalendarService,
    private readonly sourceRegistryService: SourceRegistryService,
    private readonly getInstitutionDiscoveryUseCase: GetInstitutionDiscoveryUseCase,
  ) {}

  async execute(
    institution: InstitutionType,
  ): Promise<InstitutionOverviewResponseDto> {
    const registryEntry = getInstitutionRegistryEntry(institution);

    if (!registryEntry) {
      throw new NotFoundException(`Unsupported institution: ${institution}`);
    }

    const [discovery, campusSnapshot] = await Promise.all([
      this.getInstitutionDiscoveryUseCase.execute(institution),
      this.loadInstitutionCampusSnapshot(institution),
    ]);
    const catalog = getInstitutionSourceCatalogEntries(institution);
    const registeredSourceIds = getInstitutionRegisteredSourceIds(registryEntry);
    const registeredSources = this.sourceRegistryService
      .list()
      .filter((source) => registeredSourceIds.includes(source.id))
      .sort((left, right) => left.id.localeCompare(right.id));
    const mergedSnapshot = mergeSnapshotMetadata(
      [discovery.snapshot, campusSnapshot.snapshot].filter(
        (snapshot): snapshot is SnapshotMetadata => snapshot !== undefined,
      ),
    );
    const menus = campusSnapshot.weeklyMenus;
    const notices = campusSnapshot.regularNotices;

    return {
      generatedAt: new Date().toISOString(),
      institution: mapInstitutionRegistryItem(registryEntry),
      snapshot: mergedSnapshot,
      summary: {
        discoveryMode: discovery.summary.mode,
        discoveredServiceTypes: discovery.summary.coveredServiceTypes,
        requestedServiceTypes: discovery.summary.totalRequestedServiceTypes,
        discoveredLinks: discovery.summary.totalDiscoveredLinks,
        pagesVisited: discovery.summary.pagesVisited,
        registeredSources: registeredSources.length,
        regularNotices: notices.length,
        newNotices: campusSnapshot.newNotices.length,
        featuredNotices: campusSnapshot.featuredNotices.length,
        todayNotices: campusSnapshot.todayNotices.length,
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
        newNotices: campusSnapshot.newNotices.slice(0, 5).map((notice) => ({
          nttId: notice.nttId,
          title: notice.title,
          author: notice.author,
          date: notice.date,
          link: notice.link,
        })),
        featuredNotices: campusSnapshot.featuredNotices
          .slice(0, 5)
          .map((notice) => ({
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
        serviceCatalog: catalog,
        discoveredServices: discovery.sections,
        sources: registeredSources,
      },
    };
  }

  private async loadInstitutionCampusSnapshot(institution: InstitutionType) {
    if (institution !== 'HANBAT') {
      return {
        regularNotices: [],
        newNotices: [],
        featuredNotices: [],
        todayNotices: [],
        weeklyMenus: [],
        snapshot: undefined,
      };
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

    return {
      regularNotices: regularNotices ?? [],
      newNotices: newNotices ?? [],
      featuredNotices: featuredNotices ?? [],
      todayNotices: todayNotices ?? [],
      weeklyMenus: weeklyMenus ?? [],
      snapshot: mergeSnapshotMetadata(
        [noticeSnapshot, menuSnapshot].filter(
          (snapshot): snapshot is SnapshotMetadata => snapshot !== undefined,
        ),
      ),
    };
  }
}
