import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { SourceRuntimeRecorderService } from './application/services/source-runtime-recorder.service';

@Module({
  imports: [RedisModule],
  providers: [SourceRuntimeRecorderService],
  exports: [SourceRuntimeRecorderService],
})
export class SourceRuntimeModule {}
