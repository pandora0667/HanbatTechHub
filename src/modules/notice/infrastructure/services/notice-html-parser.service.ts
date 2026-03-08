import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { HANBAT_NOTICE } from '../../constants/notice.constant';
import {
  NoticeAttachment,
  NoticeDetail,
  NoticeSummary,
} from '../../domain/models/notice.model';

@Injectable()
export class NoticeHtmlParserService {
  parseList(html: string): NoticeSummary[] {
    const $ = cheerio.load(html);
    const notices: NoticeSummary[] = [];

    $('.board_list tbody tr').each((_, element) => {
      const $tds = $(element).find('td');
      if ($tds.length < 6) {
        return;
      }

      const no = $($tds[0]).text().trim();
      const $titleCell = $($tds[1]);
      const $titleLink = $titleCell.find('a');
      const title = $titleLink.text().trim();
      const nttId = this.extractNoticeId($titleLink.attr('onclick'));
      const link = nttId ? `${HANBAT_NOTICE.VIEW_URL}?nttId=${nttId}` : '';
      const isNew = $titleCell.find('.ir-bbs-new').length > 0;
      const author = $($tds[2]).text().trim();
      const viewCount = this.parseCount($($tds[3]).text().trim());
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
  }

  parseDetail(nttId: string, html: string): NoticeDetail {
    const $ = cheerio.load(html);
    const attachments: NoticeAttachment[] = [];

    $('.ui.bbs--view--file a').each((_, el) => {
      const name = $(el).text().trim();
      const link = $(el).attr('href') || '';
      if (name && link) {
        attachments.push({ name, link });
      }
    });

    return {
      no: nttId,
      title: $('.board-view-title').text().trim(),
      content: $('.ui.bbs--view--content').text().trim(),
      author: $('.writer').text().trim() || '모바일융합공학과',
      date: $('.date').text().replace('등록일', '').trim(),
      viewCount: this.parseCount(
        $('.inq_cnt').text().replace('조회수', '').trim(),
      ),
      attachments,
    };
  }

  private extractNoticeId(onclickAttr?: string): string {
    if (!onclickAttr) {
      return '';
    }

    const nttIdMatch = onclickAttr.match(/fn_search_detail\('([^']+)'\)/);
    return nttIdMatch ? nttIdMatch[1] : '';
  }

  private parseCount(value: string): number {
    return parseInt(value || '0', 10);
  }
}
