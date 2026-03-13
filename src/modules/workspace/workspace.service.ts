import { Injectable } from '@nestjs/common';
import { GetActWorkspaceUseCase } from './application/use-cases/get-act-workspace.use-case';
import { GetActWorkspaceQueryDto } from './dto/get-act-workspace-query.dto';
import { GetRadarWorkspaceUseCase } from './application/use-cases/get-radar-workspace.use-case';
import { GetRadarWorkspaceQueryDto } from './dto/get-radar-workspace-query.dto';
import { GetTodayWorkspaceUseCase } from './application/use-cases/get-today-workspace.use-case';
import { GetTodayWorkspaceQueryDto } from './dto/get-today-workspace-query.dto';
import { ActWorkspaceResponseDto } from './dto/act-workspace.response.dto';
import { RadarWorkspaceResponseDto } from './dto/radar-workspace.response.dto';
import { TodayWorkspaceResponseDto } from './dto/today-workspace.response.dto';

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly getActWorkspaceUseCase: GetActWorkspaceUseCase,
    private readonly getTodayWorkspaceUseCase: GetTodayWorkspaceUseCase,
    private readonly getRadarWorkspaceUseCase: GetRadarWorkspaceUseCase,
  ) {}

  async getActWorkspace(
    query: GetActWorkspaceQueryDto,
  ): Promise<ActWorkspaceResponseDto> {
    return this.getActWorkspaceUseCase.execute(query);
  }

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
