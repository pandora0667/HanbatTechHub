import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

@Module({
  imports: [ConfigModule],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
