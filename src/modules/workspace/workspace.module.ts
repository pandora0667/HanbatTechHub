import { Module } from '@nestjs/common';
import { BlogModule } from '../blog/blog.module';
import { NoticeModule } from '../notice/notice.module';
import { SignalsModule } from '../signals/signals.module';
import { GetRadarWorkspaceUseCase } from './application/use-cases/get-radar-workspace.use-case';
import { GetTodayWorkspaceUseCase } from './application/use-cases/get-today-workspace.use-case';
import { RadarWorkspaceOverviewService } from './domain/services/radar-workspace-overview.service';
import { TodayWorkspaceOverviewService } from './domain/services/today-workspace-overview.service';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';

@Module({
  imports: [SignalsModule, BlogModule, NoticeModule],
  controllers: [WorkspaceController],
  providers: [
    WorkspaceService,
    GetRadarWorkspaceUseCase,
    GetTodayWorkspaceUseCase,
    RadarWorkspaceOverviewService,
    TodayWorkspaceOverviewService,
  ],
})
export class WorkspaceModule {}
