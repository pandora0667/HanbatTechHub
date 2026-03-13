import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WorkspaceService } from './workspace.service';
import { GetTodayWorkspaceQueryDto } from './dto/get-today-workspace-query.dto';
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
}
