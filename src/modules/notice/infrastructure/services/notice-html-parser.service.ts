import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import {
  AttachmentDto,
  NoticeDetailResponseDto,
  NoticeItemDto,
} from '../../dto/notice.dto';
import { HANBAT_NOTICE } from '../../constants/notice.constant';

@Injectable()
export class NoticeHtmlParserService {
  parseList(html: string): NoticeItemDto[] {
    const $ = cheerio.load(html);
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
      const link = nttId ? `${HANBAT_NOTICE.VIEW_URL}?nttId=${nttId}` : '';
      const isNew = $titleCell.find('.ir-bbs-new').length > 0;
      const author = $($tds[2]).text().trim();
      const viewCount = parseInt($($tds[3]).text().trim() || '0', 10);
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

  parseDetail(nttId: string, html: string): NoticeDetailResponseDto {
    const $ = cheerio.load(html);
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
      title: $('.board-view-title').text().trim(),
      content: $('.ui.bbs--view--content').text().trim(),
      author: $('.writer').text().trim() || '모바일융합공학과',
      date: $('.date').text().replace('등록일', '').trim(),
      viewCount: parseInt(
        $('.inq_cnt').text().replace('조회수', '').trim() || '0',
        10,
      ),
      attachments,
    };
  }
}
