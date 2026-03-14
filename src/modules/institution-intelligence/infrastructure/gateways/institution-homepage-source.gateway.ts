import { Injectable, Logger } from '@nestjs/common';
import { Agent as HttpsAgent } from 'https';
import axios, { AxiosInstance } from 'axios';
import { InstitutionRegistryEntry } from '../../constants/institution-registry.constant';
import {
  INSTITUTION_SITE_FAMILY_ENUM,
  InstitutionSiteFamily,
} from '../../constants/institution-site-family.constant';

export interface InstitutionDiscoveryPage {
  url: string;
  html: string;
}

@Injectable()
export class InstitutionHomepageSourceGateway {
  private readonly logger = new Logger(InstitutionHomepageSourceGateway.name);
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: 12000,
      maxRedirects: 5,
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      },
    });
  }

  async fetchPages(
    institution: Pick<
      InstitutionRegistryEntry,
      | 'id'
      | 'name'
      | 'officialEntryUrl'
      | 'discoverySeedUrls'
      | 'requestOptions'
      | 'siteFamily'
    >,
  ): Promise<InstitutionDiscoveryPage[]> {
    const pages: InstitutionDiscoveryPage[] = [];

    for (const url of this.buildCandidateUrls(
      institution.discoverySeedUrls,
      institution.officialEntryUrl,
      institution.siteFamily,
    )) {
      try {
        const response = await this.client.get<string>(url, {
          responseType: 'text',
          insecureHTTPParser: institution.requestOptions?.insecureHttpParser,
          httpsAgent: new HttpsAgent({
            rejectUnauthorized:
              institution.requestOptions?.rejectUnauthorized !== false,
          }),
        });
        const html =
          typeof response.data === 'string'
            ? response.data
            : String(response.data ?? '');

        if (!html) {
          continue;
        }

        pages.push({
          url,
          html,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error ?? 'unknown');
        this.logger.warn(
          `Failed to fetch institution page for ${institution.id}: ${url} (${message})`,
        );
      }
    }

    return pages;
  }

  private buildCandidateUrls(
    discoverySeedUrls: string[],
    officialEntryUrl: string,
    siteFamily: InstitutionSiteFamily,
  ): string[] {
    const official = new URL(officialEntryUrl);
    const candidates = new Set<string>(discoverySeedUrls);

    if (official.pathname !== '/' || official.search) {
      candidates.add(`${official.origin}/`);
    }

    if (
      siteFamily === INSTITUTION_SITE_FAMILY_ENUM.HTML_PORTAL &&
      official.pathname.includes('/intro/')
    ) {
      candidates.add(new URL('/www/main.do', official.origin).toString());
    }

    if (siteFamily === INSTITUTION_SITE_FAMILY_ENUM.JSP_PORTAL) {
      candidates.add(new URL('/index.jsp', official.origin).toString());
    }

    if (siteFamily === INSTITUTION_SITE_FAMILY_ENUM.DO_PORTAL) {
      candidates.add(new URL('/main.do', official.origin).toString());
      candidates.add(new URL('/Main.do', official.origin).toString());
    }

    if (siteFamily === INSTITUTION_SITE_FAMILY_ENUM.K2WEB) {
      candidates.add(new URL('/sites/kr/index.do', official.origin).toString());
    }

    return [...candidates].slice(0, 3);
  }
}
