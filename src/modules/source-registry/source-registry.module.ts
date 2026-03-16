import { Module } from '@nestjs/common';
import { BlogModule } from '../blog/blog.module';
import { JobsModule } from '../jobs/jobs.module';
import { MenuModule } from '../menu/menu.module';
import { NoticeModule } from '../notice/notice.module';
import { RedisModule } from '../redis/redis.module';
import { GetSourceHealthUseCase } from './application/use-cases/get-source-health.use-case';
import { SourceRuntimeStatusService } from './application/services/source-runtime-status.service';
import { SourceRuntimeModule } from './source-runtime.module';
import { SourceRegistryController } from './source-registry.controller';
import { SourceRegistryService } from './source-registry.service';

@Module({
  imports: [
    JobsModule,
    BlogModule,
    NoticeModule,
    MenuModule,
    RedisModule,
    SourceRuntimeModule,
  ],
  controllers: [SourceRegistryController],
  providers: [
    SourceRegistryService,
    SourceRuntimeStatusService,
    GetSourceHealthUseCase,
  ],
  exports: [SourceRegistryService],
})
export class SourceRegistryModule {}
