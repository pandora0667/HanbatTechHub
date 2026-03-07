import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MenuModule } from './modules/menu/menu.module';
import { NoticeModule } from './modules/notice/notice.module';
import { BlogModule } from './modules/blog/blog.module';
import { TranslationModule } from './modules/translation/translation.module';
import { HealthModule } from './modules/health/health.module';
import { JobsModule } from './modules/jobs/jobs.module';

// KST 시간대 설정
process.env.TZ = 'Asia/Seoul';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development.local', '.env.development', '.env'],
    }),
    ScheduleModule.forRoot(),
    MenuModule,
    NoticeModule,
    BlogModule,
    TranslationModule,
    HealthModule,
    JobsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
