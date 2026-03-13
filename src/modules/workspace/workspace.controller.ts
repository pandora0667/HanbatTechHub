import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WorkspaceService } from './workspace.service';
import { GetRadarWorkspaceQueryDto } from './dto/get-radar-workspace-query.dto';
import { GetTodayWorkspaceQueryDto } from './dto/get-today-workspace-query.dto';
import { RadarWorkspaceResponseDto } from './dto/radar-workspace.response.dto';
import { TodayWorkspaceResponseDto } from './dto/today-workspace.response.dto';

@ApiTags('workspace')
@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get('today')
  @ApiOperation({
    summary: '내부 스냅샷 기준 오늘의 터미널 집계 뷰 조회',
  })
  @ApiResponse({
    status: 200,
    description: '오늘의 변화, 콘텐츠, 공지, 데이터 상태를 묶은 워크스페이스 뷰',
    type: TodayWorkspaceResponseDto,
  })
  async getTodayWorkspace(
    @Query() query: GetTodayWorkspaceQueryDto,
  ): Promise<TodayWorkspaceResponseDto> {
    return this.workspaceService.getTodayWorkspace(query);
  }

  @Get('radar')
  @ApiOperation({
    summary: '내부 스냅샷 기준 변화 중심 레이더 뷰 조회',
  })
  @ApiResponse({
    status: 200,
    description: 'stale/missing 소스와 채용 변화 신호를 묶은 레이더 뷰',
    type: RadarWorkspaceResponseDto,
  })
  async getRadarWorkspace(
    @Query() query: GetRadarWorkspaceQueryDto,
  ): Promise<RadarWorkspaceResponseDto> {
    return this.workspaceService.getRadarWorkspace(query);
  }
}
