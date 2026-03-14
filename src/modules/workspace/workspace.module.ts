import { Module } from '@nestjs/common';
import { BlogModule } from '../blog/blog.module';
import { InstitutionIntelligenceModule } from '../institution-intelligence/institution-intelligence.module';
import { NoticeModule } from '../notice/notice.module';
import { SignalsModule } from '../signals/signals.module';
import { WorkspaceSectionBuilderService } from './application/services/workspace-section-builder.service';
import { GetActWorkspaceUseCase } from './application/use-cases/get-act-workspace.use-case';
import { GetRadarWorkspaceUseCase } from './application/use-cases/get-radar-workspace.use-case';
import { GetTodayWorkspaceUseCase } from './application/use-cases/get-today-workspace.use-case';
import { ActWorkspaceOverviewService } from './domain/services/act-workspace-overview.service';
import { RadarWorkspaceOverviewService } from './domain/services/radar-workspace-overview.service';
import { TodayWorkspaceOverviewService } from './domain/services/today-workspace-overview.service';
import { WorkspaceActionBuilderService } from './domain/services/workspace-action-builder.service';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';

@Module({
  imports: [SignalsModule, BlogModule, NoticeModule, InstitutionIntelligenceModule],
  controllers: [WorkspaceController],
  providers: [
    WorkspaceService,
    WorkspaceSectionBuilderService,
    GetActWorkspaceUseCase,
    GetRadarWorkspaceUseCase,
    GetTodayWorkspaceUseCase,
    WorkspaceActionBuilderService,
    ActWorkspaceOverviewService,
    RadarWorkspaceOverviewService,
    TodayWorkspaceOverviewService,
  ],
})
export class WorkspaceModule {}
