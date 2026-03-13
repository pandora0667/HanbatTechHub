import { Module } from '@nestjs/common';
import { BlogModule } from '../blog/blog.module';
import { NoticeModule } from '../notice/notice.module';
import { SignalsModule } from '../signals/signals.module';
import { GetTodayWorkspaceUseCase } from './application/use-cases/get-today-workspace.use-case';
import { TodayWorkspaceOverviewService } from './domain/services/today-workspace-overview.service';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';

@Module({
  imports: [SignalsModule, BlogModule, NoticeModule],
  controllers: [WorkspaceController],
  providers: [
    WorkspaceService,
    GetTodayWorkspaceUseCase,
    TodayWorkspaceOverviewService,
  ],
})
export class WorkspaceModule {}
