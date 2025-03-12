import { Injectable, Logger } from '@nestjs/common';
import {
  NoticeItemDto,
  NoticeResponseDto,
  NoticeDetailResponseDto,
} from './dto/notice.dto';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { HANBAT_NOTICE } from './constants/notice.constant';
import { IAttachment } from './interfaces/notice.interface';

@Injectable()
export class NoticeService {
  private readonly logger = new Logger(NoticeService.name);

  /**
   * 공지사항 목록을 가져옵니다.
   * @param page 페이지 번호 (1부터 시작)
   * @param searchType 검색 유형 (all, title, writer)
   * @param keyword 검색어
   */
  async getNoticeList(
    page = 1,
    _searchType = 'all',
    _keyword = '',
  ): Promise<NoticeResponseDto> {
    try {
      // 요청 URL 구성
      const url = this.buildListUrl(page);

      this.logger.log(`공지사항 목록 요청: ${url}`);

      // HTTP 요청으로 HTML 가져오기
      const html = await this.fetchHtml(url);

      // HTML 파싱 및 결과 반환
      return this.parseNoticeList(html, page);
    } catch (error) {
      this.logger.error(`공지사항 목록 가져오기 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 공지사항 상세 정보를 가져옵니다.
   * @param nttId 게시글 ID
   */
  async getNoticeDetail(nttId: string): Promise<NoticeDetailResponseDto> {
    try {
      this.logger.log(`공지사항 상세 조회 시작: ${nttId}`);

      // 상세 페이지 URL 생성
      const url = `${HANBAT_NOTICE.VIEW_URL}?nttId=${nttId}`;
      this.logger.debug(`요청 URL: ${url}`);

      // HTML 가져오기
      const html = await this.fetchHtml(url);
      this.logger.debug(`HTML 수신 완료, 길이: ${html.length}`);

      // HTML 파싱
      const detail = this.parseNoticeDetail(html, nttId);

      // 디버깅 로그 추가
      this.logger.debug(
        `파싱 결과: 제목="${detail.title}", 내용 길이=${detail.content?.length || 0}`,
      );

      // 결과 객체 생성
      const result = {
        title: detail.title,
        content: detail.content, // content는 이미 plainContent 값을 가짐
        author: detail.author,
        date: detail.date,
        viewCount: detail.viewCount,
        attachments: detail.attachments,
      };

      // 결과 로깅 (개발 디버깅용)
      this.logger.debug(`결과 객체 필드: ${Object.keys(result).join(', ')}`);

      return result;
    } catch (error) {
      this.logger.error(
        `공지사항 상세 정보 조회 실패: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `공지사항 상세 정보 조회 중 오류가 발생했습니다: ${error.message}`,
      );
    }
  }

  /**
   * 일반 공지사항 목록을 가져옵니다. (no가 "공지"가 아닌 항목만)
   * @param page 페이지 번호 (1부터 시작)
   * @param searchType 검색 유형 (all, title, writer)
   * @param keyword 검색어
   */
  async getRegularNoticeList(
    page = 1,
    _searchType = 'all',
    _keyword = '',
  ): Promise<NoticeResponseDto> {
    try {
      // 요청 URL 구성
      const url = this.buildListUrl(page);

      this.logger.log(`일반 공지사항 목록 요청: ${url}`);

      // HTTP 요청으로 HTML 가져오기
      const html = await this.fetchHtml(url);

      // HTML 파싱
      const result = this.parseNoticeList(html, page);

      // 일반 공지사항만 필터링 (no가 숫자인 항목)
      result.items = result.items.filter((item) => item.no !== '공지');

      return result;
    } catch (error) {
      this.logger.error(`일반 공지사항 목록 가져오기 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 새로운 공지사항 목록을 가져옵니다. (isNew가 true인 항목만)
   * @param page 페이지 번호 (1부터 시작)
   * @param searchType 검색 유형 (all, title, writer)
   * @param keyword 검색어
   */
  async getNewNoticeList(
    page = 1,
    _searchType = 'all',
    _keyword = '',
  ): Promise<NoticeResponseDto> {
    try {
      // 요청 URL 구성
      const url = this.buildListUrl(page);

      this.logger.log(`새로운 공지사항 목록 요청: ${url}`);

      // HTTP 요청으로 HTML 가져오기
      const html = await this.fetchHtml(url);

      // HTML 파싱
      const result = this.parseNoticeList(html, page);

      // 새 공지사항만 필터링 (isNew가 true인 항목)
      result.items = result.items.filter((item) => item.isNew);

      return result;
    } catch (error) {
      this.logger.error(`새로운 공지사항 목록 가져오기 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 고정 공지사항 목록을 가져옵니다. (no가 "공지"인 항목만)
   * @param page 페이지 번호 (1부터 시작)
   * @param searchType 검색 유형 (all, title, writer)
   * @param keyword 검색어
   */
  async getFeaturedNoticeList(
    page = 1,
    _searchType = 'all',
    _keyword = '',
  ): Promise<NoticeResponseDto> {
    try {
      // 요청 URL 구성
      const url = this.buildListUrl(page);

      this.logger.log(`고정 공지사항 목록 요청: ${url}`);

      // HTTP 요청으로 HTML 가져오기
      const html = await this.fetchHtml(url);

      // HTML 파싱
      const result = this.parseNoticeList(html, page);

      // 고정 공지사항만 필터링 (no가 "공지"인 항목)
      result.items = result.items.filter((item) => item.no === '공지');

      return result;
    } catch (error) {
      this.logger.error(`고정 공지사항 목록 가져오기 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 오늘 등록된 공지사항 목록을 가져옵니다.
   * @param page 페이지 번호
   * @param searchType 검색 유형
   * @param keyword 검색어
   * @returns 공지사항 목록
   */
  async getTodayNoticeList(
    page: number,
    _searchType: string,
    _keyword: string,
  ): Promise<NoticeResponseDto> {
    try {
      const url = this.buildListUrl(page);
      const html = await this.fetchHtml(url);
      const response = this.parseNoticeList(html, page);

      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayString = `${year}-${month}-${day}`;

      // 데모를 위해 특정 날짜(2025-03-11)로 고정
      // const todayString = '2025-03-11';

      this.logger.log(`기준 날짜: ${todayString}, 필터링 시작`);

      // 지정된 날짜와 일치하면서 no가 숫자인 항목만 필터링
      response.items = response.items.filter(
        (item) => item.date === todayString && item.no !== '공지',
      );

      this.logger.log(
        `해당 날짜 등록된 공지사항 (no가 숫자인 항목만): ${response.items.length}개`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `오늘 공지사항 목록 조회 중 오류 발생: ${error.message}`,
      );
      return { items: [], totalCount: 0, currentPage: page, totalPages: 0 };
    }
  }

  /**
   * 목록 URL을 구성합니다.
   * @param page 페이지 번호
   * @returns 구성된 URL
   */
  private buildListUrl(page: number): string {
    return `${HANBAT_NOTICE.BASE_URL}?mno=${HANBAT_NOTICE.MENU_PARAM}&pageIndex=${page}`;
  }

  /**
   * 웹 페이지의 HTML을 가져옵니다.
   * @param url 요청 URL
   * @returns HTML 문자열
   */
  private async fetchHtml(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': HANBAT_NOTICE.USER_AGENT,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
          Referer: HANBAT_NOTICE.BASE_URL,
        },
        timeout: 10000, // 10초 타임아웃
      });

      this.logger.debug(
        `응답 상태 코드: ${response.status}, 컨텐츠 타입: ${response.headers['content-type']}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(`HTML 가져오기 실패: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 공지사항 목록 HTML을 파싱합니다.
   * @param html HTML 문자열
   * @param _currentPage 현재 페이지 번호
   * @returns 파싱된 공지사항 목록
   */
  private parseNoticeList(
    html: string,
    _currentPage: number,
  ): NoticeResponseDto {
    const $ = cheerio.load(html);

    // 공지사항 항목 추출
    const items = this.extractNoticeItems($);

    // 페이지네이션 비활성화 - 항상 같은 값 반환
    return {
      items,
      totalCount: items.length,
      currentPage: 1,
      totalPages: 1,
    };
  }

  /**
   * 공지사항 항목들을 추출합니다.
   * @param $ Cheerio 객체
   * @returns 공지사항 항목 배열
   */
  private extractNoticeItems($: cheerio.CheerioAPI): NoticeItemDto[] {
    const items: NoticeItemDto[] = [];

    // 테이블에서 각 행 처리
    $('.board_list tbody tr').each((index, element) => {
      const $tds = $(element).find('td');

      // 번호 (공지사항은 '공지'로 표시)
      const no = $($tds[0]).text().trim();

      // 제목 및 링크
      const $titleCell = $($tds[1]);
      const $titleLink = $titleCell.find('a');
      const title = $titleLink.text().trim();

      // 상세 페이지 링크 추출 (onclick 이벤트에서 ID 추출)
      const onclickAttr = $titleLink.attr('onclick') || '';
      const nttIdMatch = onclickAttr.match(/fn_search_detail\('([^']+)'\)/);
      const nttId = nttIdMatch ? nttIdMatch[1] : '';
      const link = nttId ? `${HANBAT_NOTICE.VIEW_URL}?nttId=${nttId}` : '';

      // 새 글 여부
      const isNew = $titleCell.find('.ir-bbs-new').length > 0;

      // 작성자
      const author = $($tds[2]).text().trim();

      // 조회수
      const viewCount = parseInt($($tds[3]).text().trim() || '0');

      // 등록일
      const date = $($tds[4]).text().trim();

      // 첨부파일 여부
      const hasAttachment = $($tds[5]).find('a').length > 0;

      // 결과 추가
      items.push({
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

    return items;
  }

  /**
   * 공지사항 상세 정보를 파싱합니다.
   * @param html HTML 문자열
   * @param nttId 게시글 ID (디버깅용)
   * @returns 파싱된 공지사항 상세 정보
   */
  private parseNoticeDetail(
    html: string,
    nttId: string,
  ): NoticeDetailResponseDto {
    try {
      const $ = cheerio.load(html, {
        decodeEntities: false,
      } as cheerio.CheerioOptions);

      this.logger.debug('HTML 로드 완료, 파싱 시작');

      // 제목 추출 시도
      let title = '';

      // 공공누리 저작권 영역의 제목 시도 (가장 정확한 제목 정보가 있는 곳)
      if ($('.kogl--text span i').length > 0) {
        title = $('.kogl--text span i').text().trim();
        this.logger.debug(`공공누리 영역에서 제목 추출: ${title}`);
      }

      // 여전히 제목이 없으면 다른 위치 시도
      if (!title) {
        // 직전 게시물 내비게이션에서 현재 제목 추출 시도
        const prevPostText = $('.board--nav--list .prev').text().trim();
        if (prevPostText) {
          title = $('h1.board-view-title, .box-title').text().trim();
          this.logger.debug(`내비게이션 영역에서 제목 추출: ${title}`);
        }
      }

      // 여전히 제목이 없으면 HTML title 태그 시도
      if (!title) {
        const pageTitle = $('title').text().trim();
        if (pageTitle) {
          title = pageTitle.replace(/한밭대학교|모바일융합공학과/g, '').trim();
          this.logger.debug(`HTML title 태그에서 제목 추출: ${title}`);
        }
      }

      // 내용 추출 - 개선된 버전
      let content = '';

      // 1. 가장 명확한 공지사항 내용 선택자
      const $actualContent = $('.ui.bbs--view--content');

      if ($actualContent.length > 0) {
        // 본문 내용 텍스트 추출을 위한 클론 생성
        const $plainContentEl = $actualContent.clone();

        // 테이블 셀 내용 추출 및 정리
        $plainContentEl.find('table').each((_, table) => {
          const $table = $(table);
          const tableText: string[] = [];

          // 테이블 헤더 처리
          $table.find('th').each((_, th) => {
            tableText.push($(th).text().trim());
          });

          if (tableText.length > 0) {
            tableText.push('\n');
          }

          // 각 행과 셀 처리
          $table.find('tr').each((_, tr) => {
            const rowText: string[] = [];
            $(tr)
              .find('td')
              .each((_, td) => {
                const cellText = $(td).text().trim().replace(/\s+/g, ' ');
                if (cellText) {
                  rowText.push(cellText);
                }
              });

            if (rowText.length > 0) {
              tableText.push(rowText.join('\t'));
              tableText.push('\n');
            }
          });

          // 테이블 요소를 텍스트로 대체
          $table.replaceWith(tableText.join(''));
        });

        // 줄바꿈 처리
        $plainContentEl.find('br').replaceWith('\n');
        $plainContentEl
          .find('p, div, h1, h2, h3, h4, h5, h6, li')
          .each((_, el) => {
            $(el).append('\n');
          });

        // 순수 텍스트 추출
        content = $plainContentEl
          .text()
          .replace(/\n\s*\n/g, '\n\n') // 중복 줄바꿈 제거
          .replace(/[ \t]+/g, ' ') // 중복 공백 제거
          .trim();

        this.logger.debug(
          `순수 텍스트 내용 추출 완료, 길이: ${content.length}`,
        );

        // IFRAME 내용이 있는 경우 (PDF 뷰어)
        const $iframe = $actualContent.find('iframe');
        if ($iframe.length > 0) {
          const iframeSrc = $iframe.attr('src') || '';
          if (iframeSrc.includes('pdf.js')) {
            this.logger.debug(`PDF 뷰어 발견: ${iframeSrc}`);
            // PDF 링크 정보 추가
            content = `[PDF 문서가 포함된 공지사항입니다]\n\n${content}`;
          }
        }
      }

      // 내용이 여전히 없으면 기본 선택자로 시도
      if (!content) {
        // 기본 선택자에서 텍스트 추출
        const $plainTextEl = $('.ui.bbs--view--cont').clone();
        $plainTextEl.find('br').replaceWith('\n');
        $plainTextEl
          .find('p, div, h1, h2, h3, h4, h5, h6, li')
          .each((_, el) => {
            $(el).append('\n');
          });

        content = $plainTextEl
          .text()
          .replace(/\n\s*\n/g, '\n\n')
          .trim();
      }

      // 첨부파일 정보 추출
      const attachments: IAttachment[] = [];

      // 새로운 첨부파일 추출 로직
      $('.ui.bbs--view--file a.btn-file').each((i, el) => {
        // 이름에서 파일 크기 정보 제거
        const fullName = $(el).text().trim();
        const name = fullName.replace(/\s*\[\d+\.?\d*\s*KB\]$/, '').trim();

        // 링크 추출 - javascript:fn_egov_downFile 형식 처리
        const href = $(el).attr('href') || '';
        let link = '';

        if (href.includes('javascript:fn_egov_downFile')) {
          // 정규식으로 파일 ID와 순번 추출
          const fileIdMatch = href.match(
            /fn_egov_downFile\('([^']+)',\s*'(\d+)'\)/,
          );
          if (fileIdMatch && fileIdMatch.length >= 3) {
            const fileId = fileIdMatch[1];
            const fileSn = fileIdMatch[2];
            link = `https://www.hanbat.ac.kr/cmm/fms/FileDown.do?atchFileId=${fileId}&fileSn=${fileSn}`;
          }
        } else {
          link = href.startsWith('/')
            ? `https://www.hanbat.ac.kr${href}`
            : href;
        }

        if (name && link) {
          attachments.push({ name, link });
          this.logger.debug(`첨부파일 추출: ${name}, ${link}`);
        }
      });

      // 날짜 추출 개선
      let date = '';

      // 1. 날짜 클래스에서 직접 추출
      const dateText = $('.date').text().trim();
      const dateMatch = dateText.match(/등록일\s*:?\s*(\d{4}-\d{2}-\d{2})/);
      if (dateMatch && dateMatch[1]) {
        date = dateMatch[1];
        this.logger.debug(`날짜 클래스에서 추출: ${date}`);
      }

      // 2. 여전히 날짜가 없으면 다른 방법 시도
      if (!date) {
        const metaText = $('.ui.bbs--view--header').text();
        const altDateMatch = metaText.match(/(\d{4})[.-](\d{2})[.-](\d{2})/);
        if (altDateMatch) {
          date = `${altDateMatch[1]}-${altDateMatch[2]}-${altDateMatch[3]}`;
          this.logger.debug(`메타데이터에서 날짜 추출: ${date}`);
        } else {
          // 기본값 설정
          date = new Date().toISOString().split('T')[0]; // 오늘 날짜
        }
      }

      // 작성자 추출
      let author = '';
      const authorText = $('.ui.bbs--view--header span:contains("작성자")')
        .text()
        .trim();
      if (authorText) {
        author = authorText.replace('작성자', '').trim();
        this.logger.debug(`작성자 추출: ${author}`);
      }

      // 작성자가 없으면 기본값 설정
      if (!author) {
        author = '모바일융합공학과'; // 기본값
      }

      // 조회수 추출
      let viewCount = 0;
      const viewText = $('.inq_cnt').text().trim();
      const viewMatch = viewText.match(/조회수\s*:?\s*(\d+)/);
      if (viewMatch && viewMatch[1]) {
        viewCount = parseInt(viewMatch[1]);
        this.logger.debug(`조회수 추출: ${viewCount}`);
      }

      // 내용 정제 - HTML 태그 정리 및 불필요한 요소 제거
      if (content) {
        // 스크립트, 스타일 제거
        content = content
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<link\b[^>]*>/gi, '')
          .replace(/<meta\b[^>]*>/gi, '');

        // 내용 최대 길이 제한
        const maxLength = 50000;
        if (content.length > maxLength) {
          content =
            content.substring(0, maxLength) +
            '... (내용이 너무 길어 잘렸습니다)';
        }
      }

      // 순수 텍스트 내용 정리
      if (content) {
        // 연속된 줄바꿈 및 공백 정리
        content = content
          .replace(/\n{3,}/g, '\n\n')
          .replace(/[ \t]+/g, ' ')
          .trim();

        // 특수 문자 처리
        content = content
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');
      }

      return {
        title,
        content,
        author,
        date,
        viewCount,
        attachments,
      };
    } catch (error) {
      this.logger.error(`HTML 파싱 실패: ${error.message}`, error.stack);
      return {
        title: `파싱 오류 (ID: ${nttId})`,
        content: `상세 정보를 파싱하는 중 오류가 발생했습니다: ${error.message}`,
        author: '',
        date: '',
        viewCount: 0,
        attachments: [],
      };
    }
  }
}
