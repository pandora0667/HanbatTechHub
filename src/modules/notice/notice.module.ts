import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { NoticeController } from './notice.controller';
import { NoticeService } from './notice.service';
import { NoticeRepository } from './notice.repository';

@Module({
  imports: [RedisModule],
  controllers: [NoticeController],
  providers: [NoticeService, NoticeRepository],
  exports: [NoticeService],
})
export class NoticeModule {}
