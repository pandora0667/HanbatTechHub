import { Injectable } from '@nestjs/common';
import { GetTodayWorkspaceUseCase } from './application/use-cases/get-today-workspace.use-case';
import { GetTodayWorkspaceQueryDto } from './dto/get-today-workspace-query.dto';
import { TodayWorkspaceResponseDto } from './dto/today-workspace.response.dto';

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly getTodayWorkspaceUseCase: GetTodayWorkspaceUseCase,
  ) {}

  async getTodayWorkspace(
    query: GetTodayWorkspaceQueryDto,
  ): Promise<TodayWorkspaceResponseDto> {
    return this.getTodayWorkspaceUseCase.execute(query);
  }
}
