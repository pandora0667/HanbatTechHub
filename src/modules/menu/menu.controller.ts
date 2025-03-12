import { Controller, Get, Query, Logger } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuRequestDto, MenuResponseDto, MenuListResponseDto } from './dto/menu.dto';

@Controller('menus')
export class MenuController {
  private readonly logger = new Logger(MenuController.name);
  
  constructor(private readonly menuService: MenuService) {}

  /**
   * 특정 날짜의 식단 정보를 반환합니다. 날짜가 지정되지 않으면 오늘의 식단을 반환합니다.
   * @param menuRequestDto 날짜 요청 DTO
   */
  @Get()
  async getMenuByDate(@Query() menuRequestDto: MenuRequestDto): Promise<MenuResponseDto> {
    this.logger.log(`식단 정보 요청: 날짜=${menuRequestDto.date || '오늘'}`);
    return this.menuService.getMenuByDate(menuRequestDto.date);
  }

  /**
   * 일주일 간의 식단 정보를 반환합니다. 시작 날짜가 지정되지 않으면 오늘부터의 식단을 반환합니다.
   * @param menuRequestDto 날짜 요청 DTO
   */
  @Get('weekly')
  async getWeeklyMenu(@Query() menuRequestDto: MenuRequestDto): Promise<MenuListResponseDto> {
    this.logger.log(`주간 식단 정보 요청: 시작 날짜=${menuRequestDto.date || '오늘'}`);
    const menus = await this.menuService.getWeeklyMenu(menuRequestDto.date);
    return { menus };
  }
}
