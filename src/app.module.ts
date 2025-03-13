import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MenuModule } from './modules/menu/menu.module';
import { NoticeModule } from './modules/notice/notice.module';
import { BlogModule } from './modules/blog/blog.module';
import { TranslationModule } from './modules/translation/translation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development.local', '.env.development', '.env'],
    }),
    MenuModule,
    NoticeModule,
    BlogModule,
    TranslationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
