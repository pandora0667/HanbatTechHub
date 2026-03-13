import { Injectable } from '@nestjs/common';
import { GetRadarWorkspaceUseCase } from './application/use-cases/get-radar-workspace.use-case';
import { GetRadarWorkspaceQueryDto } from './dto/get-radar-workspace-query.dto';
import { GetTodayWorkspaceUseCase } from './application/use-cases/get-today-workspace.use-case';
import { GetTodayWorkspaceQueryDto } from './dto/get-today-workspace-query.dto';
import { RadarWorkspaceResponseDto } from './dto/radar-workspace.response.dto';
import { TodayWorkspaceResponseDto } from './dto/today-workspace.response.dto';

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly getTodayWorkspaceUseCase: GetTodayWorkspaceUseCase,
    private readonly getRadarWorkspaceUseCase: GetRadarWorkspaceUseCase,
  ) {}

  async getTodayWorkspace(
    query: GetTodayWorkspaceQueryDto,
  ): Promise<TodayWorkspaceResponseDto> {
    return this.getTodayWorkspaceUseCase.execute(query);
  }

  async getRadarWorkspace(
    query: GetRadarWorkspaceQueryDto,
  ): Promise<RadarWorkspaceResponseDto> {
    return this.getRadarWorkspaceUseCase.execute(query);
  }
}
