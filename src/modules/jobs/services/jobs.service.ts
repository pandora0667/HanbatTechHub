import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CompanyType } from '../interfaces/job-posting.interface';
import { GetJobsQueryDto } from '../dto/requests/get-jobs-query.dto';
import { JobPostingResponseDto } from '../dto/responses/job-posting.response.dto';
import { SupportedCompaniesResponseDto } from '../dto/responses/supported-companies.response.dto';
import { JOBS_UPDATE_CRON } from '../constants/redis.constant';
import { isBackgroundSyncEnabled } from '../../../common/utils/background-sync.util';
import { PaginatedResult } from '../domain/types/paginated-result.type';
import { JobPostingResponseMapper } from '../presentation/mappers/job-posting-response.mapper';
import { GetCompanyJobsUseCase } from '../application/use-cases/get-company-jobs.use-case';
import { GetSupportedCompaniesUseCase } from '../application/use-cases/get-supported-companies.use-case';
import { GetTechJobsUseCase } from '../application/use-cases/get-tech-jobs.use-case';
import { InitializeJobsCacheUseCase } from '../application/use-cases/initialize-jobs-cache.use-case';
import { SyncJobCacheUseCase } from '../application/use-cases/sync-job-cache.use-case';

export type PaginatedResponse<T> = PaginatedResult<T>;

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly logger = new Logger(JobsService.name);
  private isUpdatingCache = false;

  constructor(
    private readonly jobPostingResponseMapper: JobPostingResponseMapper,
    private readonly getTechJobsUseCase: GetTechJobsUseCase,
    private readonly getCompanyJobsUseCase: GetCompanyJobsUseCase,
    private readonly getSupportedCompaniesUseCase: GetSupportedCompaniesUseCase,
    private readonly initializeJobsCacheUseCase: InitializeJobsCacheUseCase,
    private readonly syncJobCacheUseCase: SyncJobCacheUseCase,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!isBackgroundSyncEnabled()) {
      this.logger.log(
        'ENABLE_BACKGROUND_SYNC=false, startup job sync is skipped.',
      );
      return;
    }

    await this.initializeJobsCacheUseCase.execute();
  }

  async getTechJobs(
    query: GetJobsQueryDto,
  ): Promise<PaginatedResponse<JobPostingResponseDto>> {
    const result = await this.getTechJobsUseCase.execute(query);
    return this.jobPostingResponseMapper.toPaginatedResponse(result);
  }

  async getCompanyTechJobs(
    company: CompanyType,
    query: GetJobsQueryDto,
  ): Promise<PaginatedResponse<JobPostingResponseDto>> {
    const result = await this.getCompanyJobsUseCase.execute(company, query);
    return this.jobPostingResponseMapper.toPaginatedResponse(result);
  }

  @Cron(JOBS_UPDATE_CRON)
  async updateJobCache(): Promise<void> {
    if (!isBackgroundSyncEnabled()) {
      return;
    }

    if (this.isUpdatingCache) {
      this.logger.warn('Job cache update is already running. Skipping overlap.');
      return;
    }

    this.isUpdatingCache = true;

    try {
      const now = new Date();
      this.logger.log(
        `Updating job cache... [KST: ${now.toLocaleTimeString('ko-KR')}]`,
      );
      await this.syncJobCacheUseCase.execute(now);

      this.logger.log(
        `Job cache updated successfully [KST: ${new Date().toLocaleTimeString('ko-KR')}]`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Job cache update failed: ${errorMessage}`);
    } finally {
      this.isUpdatingCache = false;
    }
  }

  async getSupportedCompanies(): Promise<SupportedCompaniesResponseDto> {
    return this.getSupportedCompaniesUseCase.execute();
  }
}
