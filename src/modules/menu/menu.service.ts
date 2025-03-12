import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { MenuItemDto, MenuResponseDto } from './dto/menu.dto';

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);
  private readonly baseUrl =
    'https://www.hanbat.ac.kr/prog/carteGuidance/kor/sub06_030301/C1/calendar.do';
  private readonly ajaxUrl =
    'https://www.hanbat.ac.kr/prog/carteGuidance/kor/sub06_030301/C1/getCalendar.do';

  /**
   * 특정 날짜의 식단 정보를 가져옵니다.
   * @param date YYYY-MM-DD 형식의 날짜 문자열, 지정하지 않으면 오늘 날짜
   */
  async getMenuByDate(date?: string): Promise<MenuResponseDto> {
    try {
      const targetDate = date ? new Date(date) : new Date();
      const formattedDate = this.formatDate(targetDate);

      // 해당 주의 월요일 날짜 계산
      const mondayDate = this.getMondayDate(targetDate);
      const formattedMondayDate = this.formatDate(mondayDate);

      // AJAX 엔드포인트에서 데이터 직접 가져오기
      const menuData = await this.fetchMenuDataFromAjax(formattedMondayDate);

      // 해당 날짜의 요일 인덱스 (0: 월, 1: 화, 2: 수, 3: 목, 4: 금)
      const dayIndex = this.getDayIndex(targetDate);

      // 해당 날짜의 메뉴 아이템 추출
      const menuItems = this.extractMenuItemsFromData(
        menuData,
        formattedDate,
        dayIndex,
      );

      return this.formatMenuResponse(menuItems, formattedDate);
    } catch (error) {
      this.logger.error(`식단 정보 가져오기 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 한 주 동안의 식단 정보를 가져옵니다.
   * @param startDate 시작 날짜, 지정하지 않으면 오늘 날짜
   */
  async getWeeklyMenu(startDate?: string): Promise<MenuResponseDto[]> {
    try {
      const startDay = startDate ? new Date(startDate) : new Date();
      const mondayDate = this.getMondayDate(startDay);
      const formattedMondayDate = this.formatDate(mondayDate);

      // AJAX 엔드포인트에서 데이터 직접 가져오기
      const menuData = await this.fetchMenuDataFromAjax(formattedMondayDate);

      const weekMenus: MenuResponseDto[] = [];

      // 일주일간의 메뉴 (월~금)
      for (let i = 0; i < 5; i++) {
        const targetDate = new Date(mondayDate);
        targetDate.setDate(mondayDate.getDate() + i);
        const formattedDate = this.formatDate(targetDate);

        // 해당 요일의 메뉴 아이템 추출
        const menuItems = this.extractMenuItemsFromData(
          menuData,
          formattedDate,
          i,
        );

        const menuResponse = this.formatMenuResponse(menuItems, formattedDate);
        weekMenus.push(menuResponse);
      }

      // 주말 (토, 일) 추가 - 메뉴 없음
      for (let i = 5; i < 7; i++) {
        const targetDate = new Date(mondayDate);
        targetDate.setDate(mondayDate.getDate() + i);
        const formattedDate = this.formatDate(targetDate);

        weekMenus.push({
          date: formattedDate,
          lunch: [],
          dinner: [],
        });
      }

      return weekMenus;
    } catch (error) {
      this.logger.error(`주간 식단 정보 가져오기 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 날짜에 해당하는 요일 인덱스를 가져옵니다. (0: 월, 1: 화, 2: 수, 3: 목, 4: 금)
   * @param date 날짜 객체
   */
  private getDayIndex(date: Date): number {
    const day = date.getDay(); // 0(일) ~ 6(토)
    return day === 0 ? -1 : day === 6 ? -1 : day - 1; // 월~금만 처리, 주말은 -1
  }

  /**
   * 해당 주의 월요일 날짜를 계산합니다.
   * @param date 날짜 객체
   */
  private getMondayDate(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay(); // 0(일) ~ 6(토)

    // 현재가 일요일이면 다음날이 월요일
    if (day === 0) {
      result.setDate(result.getDate() + 1);
    }
    // 현재가 월~토이면 현재 날짜에서 요일만큼 빼서 월요일 구하기
    else {
      result.setDate(result.getDate() - (day - 1));
    }

    return result;
  }

  /**
   * AJAX 엔드포인트에서 직접 메뉴 데이터를 가져옵니다.
   * @param mondayDate YYYY-MM-DD 형식의 월요일 날짜 문자열
   */
  private async fetchMenuDataFromAjax(mondayDate: string): Promise<any> {
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
      } else {
        this.logger.warn('메뉴 데이터가 없거나 형식이 다릅니다.');
        this.logger.warn(`응답 데이터: ${JSON.stringify(response.data)}`);
        return [];
      }
    } catch (error) {
      this.logger.error(`AJAX 데이터 가져오기 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * AJAX 응답에서 특정 날짜의 메뉴 아이템을 추출합니다.
   * @param menuData AJAX 응답 데이터
   * @param date 날짜 문자열
   * @param dayIndex 요일 인덱스 (0: 월, 1: 화, 2: 수, 3: 목, 4: 금)
   */
  private extractMenuItemsFromData(
    menuData: any[],
    date: string,
    dayIndex: number,
  ): MenuItemDto[] {
    const menuItems: MenuItemDto[] = [];

    if (!menuData || menuData.length === 0 || dayIndex < 0 || dayIndex > 4) {
      this.logger.warn(`${date} 날짜의 메뉴 데이터가 없거나 주말입니다.`);
      return menuItems;
    }

    try {
      // 메뉴 키 매핑 (dayIndex에 1을 더해 menu1, menu2, ... 등의 키를 얻음)
      const menuKey = `menu${dayIndex + 1}`;

      // 중식(점심) 메뉴 추출 - 타입 "B" (11:00 ~ 14:00)
      const lunchData = menuData.find((item) => item.type === 'B');
      if (lunchData && lunchData[menuKey]) {
        const lunchMenu = lunchData[menuKey];

        if (lunchMenu && lunchMenu.trim() !== '') {
          // HTML 태그 제거 및 줄바꿈 기준으로 분리
          const lunchMenuItems = this.parseMenuText(lunchMenu);

          if (lunchMenuItems.length > 0) {
            menuItems.push({
              date,
              meal: 'lunch',
              menu: lunchMenuItems,
            });
          }
        }
      }

      // 석식(저녁) 메뉴 추출 - 타입 "C" (17:00 ~ 18:30)
      const dinnerData = menuData.find((item) => item.type === 'C');
      if (dinnerData && dinnerData[menuKey]) {
        const dinnerMenu = dinnerData[menuKey];

        if (dinnerMenu && dinnerMenu.trim() !== '') {
          // HTML 태그 제거 및 줄바꿈 기준으로 분리
          const dinnerMenuItems = this.parseMenuText(dinnerMenu);

          if (dinnerMenuItems.length > 0) {
            menuItems.push({
              date,
              meal: 'dinner',
              menu: dinnerMenuItems,
            });
          }
        }
      }

      return menuItems;
    } catch (error) {
      this.logger.error(`메뉴 아이템 추출 실패: ${error.message}`);
      return [];
    }
  }

  /**
   * 메뉴 텍스트를 파싱하여 배열로 변환합니다.
   * @param menuText 메뉴 텍스트
   */
  private parseMenuText(menuText: string): string[] {
    if (!menuText) return [];

    // HTML 태그 제거 및 특수 문자 처리
    const cleanText = menuText
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&quot;/g, '"')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/<br>/gi, '\n')
      .replace(/<[^>]*>/g, '');

    // \r\n으로 줄바꿈된 텍스트를 분리하고 빈 문자열 제거
    return cleanText
      .split(/\r\n|\n|\r/)
      .map((item) => item.trim())
      .filter((item) => item && item !== '-');
  }

  /**
   * 메뉴 아이템 리스트를 응답 형식으로 변환합니다.
   * @param menuItems 메뉴 아이템 리스트
   * @param date 날짜 문자열
   */
  private formatMenuResponse(
    menuItems: MenuItemDto[],
    date: string,
  ): MenuResponseDto {
    const lunchMenu =
      menuItems.find((item) => item.meal === 'lunch')?.menu || [];
    const dinnerMenu =
      menuItems.find((item) => item.meal === 'dinner')?.menu || [];

    return {
      date,
      lunch: lunchMenu,
      dinner: dinnerMenu,
    };
  }

  /**
   * 날짜를 YYYY-MM-DD 형식으로 포맷팅합니다.
   * @param date 날짜 객체
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
