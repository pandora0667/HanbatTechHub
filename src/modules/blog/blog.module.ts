import { Module } from '@nestjs/common';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { TranslationModule } from '../translation/translation.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [TranslationModule, RedisModule],
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule {}
