import { Module } from '@nestjs/common';
import { SourceRegistryController } from './source-registry.controller';
import { SourceRegistryService } from './source-registry.service';

@Module({
  controllers: [SourceRegistryController],
  providers: [SourceRegistryService],
  exports: [SourceRegistryService],
})
export class SourceRegistryModule {}
