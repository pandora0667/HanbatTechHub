import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
// ioredis 타입을 명시적으로 지정합니다
// @ts-ignore
import { Redis } from 'ioredis';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { RedisService } from '../redis/redis.service';
import { NoticeRepository } from './notice.repository';
import {
  NoticeItemDto,
  NoticeListResponseDto,
  NoticeDetailResponseDto,
  PaginationMetaDto,
  AttachmentDto,
} from './dto/notice.dto';
import {
  REDIS_KEYS,
  NOTICE_UPDATE_CRON,
  NOTICE_CACHE_TTL,
  NOTICE_DETAIL_CACHE_TTL,
  HANBAT_NOTICE,
} from './constants/notice.constant';

@Injectable()
export class NoticeService {
  private readonly logger = new Logger(NoticeService.name);
  private readonly baseUrl =
    'https://www.hanbat.ac.kr/bbs/BBSMSTR_000000001001/list.do';
  private readonly detailBaseUrl =
    'https://www.hanbat.ac.kr/bbs/BBSMSTR_000000001001/view.do';
  private readonly redis: Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly noticeRepository: NoticeRepository,
  ) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB'),
    });

    // 서버 시작시 최초 데이터 로드
    this.updateNoticeData();
  }

  @Cron(NOTICE_UPDATE_CRON)
  async updateNoticeData() {
    try {
      this.logger.log('공지사항 데이터 업데이트 시작...');

      // 공지사항 목록 가져오기
      const notices = await this.fetchNoticeList();

      // 일반 공지사항, 고정 공지사항, 새로운 공지사항, 오늘의 공지사항 분류
      const regularNotices = notices.filter((notice) => notice.no !== '공지');
      const featuredNotices = notices.filter((notice) => notice.no === '공지');
      const newNotices = notices.filter((notice) => notice.isNew);
      const todayNotices = this.filterTodayNotices(notices);

      // Redis에 저장
      await Promise.all([
        this.redis.set(
          REDIS_KEYS.NOTICE_LIST,
          JSON.stringify(regularNotices),
          'EX',
          NOTICE_CACHE_TTL,
        ),
        this.redis.set(
          REDIS_KEYS.NOTICE_FEATURED,
          JSON.stringify(featuredNotices),
          'EX',
          NOTICE_CACHE_TTL,
        ),
        this.redis.set(
          REDIS_KEYS.NOTICE_NEW,
          JSON.stringify(newNotices),
          'EX',
          NOTICE_CACHE_TTL,
        ),
        this.redis.set(
          REDIS_KEYS.NOTICE_TODAY,
          JSON.stringify(todayNotices),
          'EX',
          NOTICE_CACHE_TTL,
        ),
      ]);

      this.logger.log('공지사항 데이터 업데이트 완료');
    } catch (error) {
      this.logger.error(`공지사항 데이터 업데이트 실패: ${error.message}`);
    }
  }

  async getNotices(page = 1, limit = 10): Promise<NoticeListResponseDto> {
    const cacheKey = `${REDIS_KEYS.NOTICE_LIST}:${page}:${limit}`;
    const cachedNotices =
      await this.redisService.get<NoticeListResponseDto>(cacheKey);

    if (cachedNotices) {
      return cachedNotices;
    }

    const notices = await this.noticeRepository.getNotices();
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const total = notices.length;
    const paginatedNotices = notices.slice(startIndex, endIndex);

    const response = {
      items: paginatedNotices,
      meta: this.createPaginationMeta(total, page, limit),
    };

    await this.redisService.set(cacheKey, response, NOTICE_CACHE_TTL);
    return response;
  }

  async getNewNotices(): Promise<NoticeListResponseDto> {
    try {
      const cachedNotices = await this.redis.get(REDIS_KEYS.NOTICE_NEW);
      if (cachedNotices) {
        const notices = JSON.parse(cachedNotices);
        return {
          items: notices,
          meta: this.createPaginationMeta(notices.length, 1, notices.length),
        };
      }

      const notices = await this.fetchNoticeList();
      const newNotices = notices.filter((notice) => notice.isNew);

      await this.redis.set(
        REDIS_KEYS.NOTICE_NEW,
        JSON.stringify(newNotices),
        'EX',
        NOTICE_CACHE_TTL,
      );

      return {
        items: newNotices,
        meta: this.createPaginationMeta(
          newNotices.length,
          1,
          newNotices.length,
        ),
      };
    } catch (error) {
      this.logger.error(`새로운 공지사항 목록 가져오기 실패: ${error.message}`);
      throw error;
    }
  }

  async getFeaturedNotices(): Promise<NoticeListResponseDto> {
    try {
      const cachedNotices = await this.redis.get(REDIS_KEYS.NOTICE_FEATURED);
      if (cachedNotices) {
        const notices = JSON.parse(cachedNotices);
        return {
          items: notices,
          meta: this.createPaginationMeta(notices.length, 1, notices.length),
        };
      }

      const notices = await this.fetchNoticeList();
      const featuredNotices = notices.filter((notice) => notice.no === '공지');

      await this.redis.set(
        REDIS_KEYS.NOTICE_FEATURED,
        JSON.stringify(featuredNotices),
        'EX',
        NOTICE_CACHE_TTL,
      );

      return {
        items: featuredNotices,
        meta: this.createPaginationMeta(
          featuredNotices.length,
          1,
          featuredNotices.length,
        ),
      };
    } catch (error) {
      this.logger.error(`고정 공지사항 목록 가져오기 실패: ${error.message}`);
      throw error;
    }
  }

  async getTodayNotices(): Promise<NoticeListResponseDto> {
    try {
      const cachedNotices = await this.redis.get(REDIS_KEYS.NOTICE_TODAY);
      if (cachedNotices) {
        const notices = JSON.parse(cachedNotices);
        return {
          items: notices,
          meta: this.createPaginationMeta(notices.length, 1, notices.length),
        };
      }

      const notices = await this.fetchNoticeList();
      const todayNotices = this.filterTodayNotices(notices);

      await this.redis.set(
        REDIS_KEYS.NOTICE_TODAY,
        JSON.stringify(todayNotices),
        'EX',
        NOTICE_CACHE_TTL,
      );

      return {
        items: todayNotices,
        meta: this.createPaginationMeta(
          todayNotices.length,
          1,
          todayNotices.length,
        ),
      };
    } catch (error) {
      this.logger.error(`오늘의 공지사항 목록 가져오기 실패: ${error.message}`);
      throw error;
    }
  }

  async getNoticeDetail(nttId: string): Promise<NoticeDetailResponseDto> {
    try {
      // Redis에서 공지사항 상세 정보 확인
      const cacheKey = `${REDIS_KEYS.NOTICE_DETAIL}${nttId}`;
      const cachedDetail = await this.redis.get(cacheKey);
      if (cachedDetail) {
        return JSON.parse(cachedDetail);
      }

      // 캐시가 없으면 직접 가져오기
      const detail = await this.fetchNoticeDetail(nttId);

      // Redis에 저장 (상세 정보는 24시간 캐싱)
      await this.redis.set(
        cacheKey,
        JSON.stringify(detail),
        'EX',
        NOTICE_DETAIL_CACHE_TTL,
      );

      return detail;
    } catch (error) {
      this.logger.error(`공지사항 상세 정보 가져오기 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 공지사항 목록을 가져옵니다.
   * @returns 공지사항 목록
   */
  private async fetchNoticeList(): Promise<NoticeItemDto[]> {
    try {
      const response = await axios.get(this.baseUrl, {
        headers: {
          'User-Agent': HANBAT_NOTICE.USER_AGENT,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
        },
      });

      const $ = cheerio.load(response.data);
      const notices: NoticeItemDto[] = [];

      $('.board_list tbody tr').each((_, element) => {
        const $tds = $(element).find('td');
        const no = $($tds[0]).text().trim();
        const $titleCell = $($tds[1]);
        const $titleLink = $titleCell.find('a');
        const title = $titleLink.text().trim();
        const onclickAttr = $titleLink.attr('onclick') || '';
        const nttIdMatch = onclickAttr.match(/fn_search_detail\('([^']+)'\)/);
        const nttId = nttIdMatch ? nttIdMatch[1] : '';
        const link = nttId ? `${this.detailBaseUrl}?nttId=${nttId}` : '';
        const isNew = $titleCell.find('.ir-bbs-new').length > 0;
        const author = $($tds[2]).text().trim();
        const viewCount = parseInt($($tds[3]).text().trim() || '0');
        const date = $($tds[4]).text().trim();
        const hasAttachment = $($tds[5]).find('a').length > 0;

        notices.push({
          no,
          title,
          author,
          viewCount,
          date,
          link,
          hasAttachment,
          isNew,
          nttId,
        });
      });

      return notices;
    } catch (error) {
      this.logger.error(`공지사항 목록 가져오기 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 공지사항 상세 정보를 가져옵니다.
   * @param nttId 게시글 ID
   * @returns 공지사항 상세 정보
   */
  private async fetchNoticeDetail(
    nttId: string,
  ): Promise<NoticeDetailResponseDto> {
    try {
      const response = await axios.get(`${this.detailBaseUrl}?nttId=${nttId}`, {
        headers: {
          'User-Agent': HANBAT_NOTICE.USER_AGENT,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
        },
      });

      const $ = cheerio.load(response.data);

      const title = $('.board-view-title').text().trim();
      const content = $('.ui.bbs--view--content').text().trim();
      const author = $('.writer').text().trim() || '모바일융합공학과';
      const date = $('.date').text().replace('등록일', '').trim();
      const viewCount = parseInt(
        $('.inq_cnt').text().replace('조회수', '').trim() || '0',
      );

      const attachments: AttachmentDto[] = [];
      $('.ui.bbs--view--file a').each((_, el) => {
        const name = $(el).text().trim();
        const link = $(el).attr('href') || '';
        if (name && link) {
          attachments.push({ name, link });
        }
      });

      return {
        no: nttId,
        title,
        content,
        author,
        date,
        viewCount,
        attachments,
      };
    } catch (error) {
      this.logger.error(`공지사항 상세 정보 가져오기 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 오늘 등록된 공지사항 목록을 필터링합니다.
   * @param notices 공지사항 목록
   * @returns 오늘 등록된 공지사항 목록
   */
  private filterTodayNotices(notices: NoticeItemDto[]): NoticeItemDto[] {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;

    return notices.filter(
      (notice) => notice.date === todayString && notice.no !== '공지',
    );
  }

  private createPaginationMeta(
    total: number,
    page: number,
    limit: number,
  ): PaginationMetaDto {
    const totalPages = Math.ceil(total / limit);
    return {
      totalCount: total,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
