import { Injectable } from '@nestjs/common';
import { MenuQueryResult, WeeklyMenuQueryResult } from '../../domain/types/menu-query-result.type';
import { MenuListResponseDto, MenuResponseDto } from '../../dto/menu.dto';

@Injectable()
export class MenuResponseMapper {
  toResponse(result: MenuQueryResult): MenuResponseDto {
    return {
      date: result.menu.date,
      lunch: [...result.menu.lunch],
      dinner: [...result.menu.dinner],
      snapshot: result.snapshot,
    };
  }

  toResponseList(result: WeeklyMenuQueryResult): MenuListResponseDto {
    return {
      menus: result.menus.map((menu) => ({
        date: menu.date,
        lunch: [...menu.lunch],
        dinner: [...menu.dinner],
      })),
      snapshot: result.snapshot,
    };
  }
}
