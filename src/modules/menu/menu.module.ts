import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { RedisModule } from '../redis/redis.module';
import { MenuCalendarService } from './domain/services/menu-calendar.service';
import { MenuResponseFactoryService } from './domain/services/menu-response-factory.service';
import { MenuLoaderService } from './application/services/menu-loader.service';
import { GetMenuByDateUseCase } from './application/use-cases/get-menu-by-date.use-case';
import { GetWeeklyMenuUseCase } from './application/use-cases/get-weekly-menu.use-case';
import { UpdateMenuCacheUseCase } from './application/use-cases/update-menu-cache.use-case';
import { InitializeMenuCacheUseCase } from './application/use-cases/initialize-menu-cache.use-case';
import { RedisMenuRepository } from './infrastructure/persistence/redis-menu.repository';
import { HanbatMenuSourceGateway } from './infrastructure/gateways/hanbat-menu-source.gateway';
import { MENU_CACHE_REPOSITORY } from './application/ports/menu-cache.repository';
import { MENU_SOURCE_GATEWAY } from './application/ports/menu-source.gateway';
import { MenuResponseMapper } from './presentation/mappers/menu-response.mapper';

@Module({
  imports: [RedisModule],
  controllers: [MenuController],
  providers: [
    MenuService,
    MenuCalendarService,
    MenuResponseFactoryService,
    MenuLoaderService,
    GetMenuByDateUseCase,
    GetWeeklyMenuUseCase,
    UpdateMenuCacheUseCase,
    InitializeMenuCacheUseCase,
    MenuResponseMapper,
    RedisMenuRepository,
    HanbatMenuSourceGateway,
    {
      provide: MENU_CACHE_REPOSITORY,
      useExisting: RedisMenuRepository,
    },
    {
      provide: MENU_SOURCE_GATEWAY,
      useExisting: HanbatMenuSourceGateway,
    },
  ],
  exports: [MenuService, MENU_CACHE_REPOSITORY, MenuCalendarService],
})
export class MenuModule {}
