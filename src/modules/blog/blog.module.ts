import { Module } from '@nestjs/common';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { TranslationModule } from '../translation/translation.module';

@Module({
  imports: [TranslationModule],
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule {}
