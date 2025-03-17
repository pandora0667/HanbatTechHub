import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

@Module({
  imports: [ConfigModule, ScheduleModule.forRoot()],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
