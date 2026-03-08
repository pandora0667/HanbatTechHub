import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { MenuSourceGateway } from '../../application/ports/menu-source.gateway';
import { HanbatMenuSourceRow } from '../models/hanbat-menu-source.model';

@Injectable()
export class HanbatMenuSourceGateway implements MenuSourceGateway {
  private readonly logger = new Logger(HanbatMenuSourceGateway.name);
  private readonly baseUrl =
    'https://www.hanbat.ac.kr/prog/carteGuidance/kor/sub06_030301/C1/calendar.do';
  private readonly ajaxUrl =
    'https://www.hanbat.ac.kr/prog/carteGuidance/kor/sub06_030301/C1/getCalendar.do';

  async fetchMenuData(mondayDate: string): Promise<HanbatMenuSourceRow[]> {
    try {
      this.logger.log(
        `AJAX 엔드포인트에서 메뉴 데이터 요청: bgnde=${mondayDate}`,
      );

      const response = await axios.post(this.ajaxUrl, `bgnde=${mondayDate}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          Referer: this.baseUrl,
        },
      });

      if (
        response.data &&
        response.data.item &&
        Array.isArray(response.data.item)
      ) {
        this.logger.log(
          `메뉴 데이터 가져오기 성공: ${response.data.item.length}개 항목`,
        );
        return response.data.item;
      }

      this.logger.warn('메뉴 데이터가 없거나 형식이 다릅니다.');
      this.logger.warn(`응답 데이터: ${JSON.stringify(response.data)}`);
      return [];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`AJAX 데이터 가져오기 실패: ${errorMessage}`);
      throw error;
    }
  }
}
