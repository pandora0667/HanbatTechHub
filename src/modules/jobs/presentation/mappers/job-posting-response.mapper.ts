import { Injectable } from '@nestjs/common';
import { JobPostingResponseDto } from '../../dto/responses/job-posting.response.dto';
import { JobPosting } from '../../interfaces/job-posting.interface';
import { PaginatedResult } from '../../domain/types/paginated-result.type';

@Injectable()
export class JobPostingResponseMapper {
  toPaginatedResponse(
    result: PaginatedResult<JobPosting>,
  ): PaginatedResult<JobPostingResponseDto> {
    return {
      data: result.data.map((job) => this.toResponse(job)),
      meta: result.meta,
    };
  }

  private toResponse(job: JobPosting): JobPostingResponseDto {
    const dto = new JobPostingResponseDto();

    Object.assign(dto, {
      ...job,
      requirements: {
        ...job.requirements,
        skills: job.requirements.skills || [],
      },
    });

    return dto;
  }
}
