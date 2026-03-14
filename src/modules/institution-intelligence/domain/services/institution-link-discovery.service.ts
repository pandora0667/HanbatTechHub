import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { InstitutionRegistryEntry } from '../../constants/institution-registry.constant';
import { getInstitutionSourceCatalogEntries } from '../../data/institution-source-catalog.data';
import {
  INSTITUTION_SERVICE_TYPE_ENUM,
  InstitutionServiceType,
} from '../../constants/institution-service-type.enum';
import {
  InstitutionDiscoveryLink,
  InstitutionDiscoverySection,
  InstitutionDiscoverySnapshot,
} from '../types/institution-discovery.type';
import { InstitutionDiscoveryPage } from '../../infrastructure/gateways/institution-homepage-source.gateway';

const KEYWORDS: Record<InstitutionServiceType, string[]> = {
  academic_notice: ['공지', 'notice', 'announcement', 'bulletin', '학사공지'],
  academic_calendar: ['학사일정', 'academic calendar', 'calendar', '학사력'],
  scholarship: ['장학', 'scholarship', '학자금', '국가근로', '근로장학'],
  career_program: ['취업', '진로', 'career', 'employment', '대학일자리', '추천채용'],
  job_fair: ['채용박람회', '취업박람회', 'job fair', '채용행사', '채용설명회'],
  field_practice: ['현장실습', 'ipp', 'co-op', '산학현장실습'],
  internship: ['인턴', 'internship'],
  extracurricular: ['비교과', '역량', '학생성장', '유니포인트', '학생활동'],
  mentoring: ['멘토링', 'mentor'],
  startup: ['창업', 'startup', '스타트업'],
  global_program: ['국제교류', 'international', 'global', '교환학생', '어학'],
  support: ['상담', '복지', '장애학생', '인권', '심리', '학생지원'],
  dormitory: ['생활관', '기숙사', 'dormitory'],
  meal: ['식단', '학식', 'cafeteria', '식당'],
};

const GENERIC_TEXT = new Set([
  '더보기',
  '바로가기',
  'more',
  'go',
  'click',
  'view',
  'move',
]);

@Injectable()
export class InstitutionLinkDiscoveryService {
  buildSnapshot(
    institution: InstitutionRegistryEntry,
    pages: InstitutionDiscoveryPage[],
    collectedAt: string,
  ): InstitutionDiscoverySnapshot {
    const sections = institution.priorityServiceTypes.map((serviceType) => ({
      serviceType,
      links: this.discoverLinksForService(serviceType, pages),
    }));

    return {
      institutionId: institution.id,
      mode: 'live',
      collectedAt,
      seedUrls: [...new Set(pages.map((page) => page.url))],
      pagesVisited: [...new Set(pages.map((page) => page.url))],
      sections,
    };
  }

  buildCatalogFallbackSnapshot(
    institution: InstitutionRegistryEntry,
    collectedAt: string,
  ): InstitutionDiscoverySnapshot {
    const sections = institution.priorityServiceTypes.map((serviceType) => {
      const entries = getInstitutionSourceCatalogEntries(institution.id).filter(
        (entry) => entry.serviceType === serviceType,
      );

      return {
        serviceType,
        links: entries.map((entry) => ({
          title: entry.name,
          url: entry.seedUrl,
          pageUrl: entry.seedUrl,
          matchedKeywords: [serviceType],
          score: 1,
        })),
      };
    });

    return {
      institutionId: institution.id,
      mode: 'catalog_fallback',
      collectedAt,
      seedUrls: [...institution.discoverySeedUrls],
      pagesVisited: [],
      sections,
    };
  }

  private discoverLinksForService(
    serviceType: InstitutionServiceType,
    pages: InstitutionDiscoveryPage[],
  ): InstitutionDiscoveryLink[] {
    const discovered = new Map<string, InstitutionDiscoveryLink>();
    const keywords = KEYWORDS[serviceType];

    for (const page of pages) {
      const $ = cheerio.load(page.html);

      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        const title = this.normalizeText($(element).text());

        if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
          return;
        }

        let absoluteUrl: string;
        try {
          absoluteUrl = new URL(href, page.url).toString();
        } catch {
          return;
        }

        if (
          !absoluteUrl.startsWith('http://') &&
          !absoluteUrl.startsWith('https://')
        ) {
          return;
        }

        const titleForMatch = title.toLowerCase();
        const hrefForMatch = absoluteUrl.toLowerCase();
        const matchedKeywords = keywords.filter(
          (keyword) =>
            titleForMatch.includes(keyword.toLowerCase()) ||
            hrefForMatch.includes(keyword.toLowerCase()),
        );

        if (matchedKeywords.length === 0) {
          return;
        }

        const score = this.calculateScore(
          titleForMatch,
          hrefForMatch,
          matchedKeywords,
        );

        if (score <= 0) {
          return;
        }

        const displayTitle =
          title && !GENERIC_TEXT.has(title.toLowerCase())
            ? title
            : this.deriveTitleFromUrl(absoluteUrl);

        const existing = discovered.get(absoluteUrl);
        if (!existing || existing.score < score) {
          discovered.set(absoluteUrl, {
            title: displayTitle,
            url: absoluteUrl,
            pageUrl: page.url,
            matchedKeywords,
            score,
          });
        }
      });
    }

    return [...discovered.values()]
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        return left.title.localeCompare(right.title, 'ko');
      })
      .slice(0, 5);
  }

  private calculateScore(
    title: string,
    href: string,
    matchedKeywords: string[],
  ): number {
    let score = 0;

    for (const keyword of matchedKeywords) {
      const normalized = keyword.toLowerCase();
      if (title.includes(normalized)) {
        score += 4;
      }
      if (href.includes(normalized)) {
        score += 2;
      }
    }

    return score;
  }

  private normalizeText(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  private deriveTitleFromUrl(url: string): string {
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname.split('/').filter(Boolean);
      return pathname[pathname.length - 1] ?? parsed.hostname;
    } catch {
      return url;
    }
  }
}
