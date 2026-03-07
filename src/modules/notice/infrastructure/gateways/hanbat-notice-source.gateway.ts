import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { HANBAT_NOTICE } from '../../constants/notice.constant';
import { NoticeSourceGateway } from '../../application/ports/notice-source.gateway';

@Injectable()
export class HanbatNoticeSourceGateway implements NoticeSourceGateway {
  async fetchNoticeListHtml(): Promise<string> {
    const response = await axios.get(HANBAT_NOTICE.BASE_URL, {
      headers: this.createHeaders(),
    });

    return response.data as string;
  }

  async fetchNoticeDetailHtml(nttId: string): Promise<string> {
    const response = await axios.get(`${HANBAT_NOTICE.VIEW_URL}?nttId=${nttId}`, {
      headers: this.createHeaders(),
    });

    return response.data as string;
  }

  private createHeaders() {
    return {
      'User-Agent': HANBAT_NOTICE.USER_AGENT,
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
    };
  }
}
