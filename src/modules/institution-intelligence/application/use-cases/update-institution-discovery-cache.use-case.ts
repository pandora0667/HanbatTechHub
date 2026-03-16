import { Injectable, Logger } from '@nestjs/common';
import { INSTITUTION_REGISTRY } from '../../constants/institution-registry.constant';
import { InstitutionType } from '../../constants/institution-id.constant';
import { getInstitutionDiscoverySourceId } from '../../constants/institution-discovery.constant';
import { GetInstitutionDiscoveryUseCase } from './get-institution-discovery.use-case';
import { SourceRuntimeRecorderService } from '../../../source-registry/application/services/source-runtime-recorder.service';

@Injectable()
export class UpdateInstitutionDiscoveryCacheUseCase {
  private readonly logger = new Logger(UpdateInstitutionDiscoveryCacheUseCase.name);

  constructor(
    private readonly getInstitutionDiscoveryUseCase: GetInstitutionDiscoveryUseCase,
    private readonly sourceRuntimeRecorderService: SourceRuntimeRecorderService,
  ) {}

  async execute(targetInstitutions?: InstitutionType[]): Promise<void> {
    const institutions =
      targetInstitutions ?? INSTITUTION_REGISTRY.map((entry) => entry.id);

    for (const institution of institutions) {
      const sourceId = getInstitutionDiscoverySourceId(institution);
      try {
        await this.getInstitutionDiscoveryUseCase.execute(institution, {
          forceRefresh: true,
        });
        await this.sourceRuntimeRecorderService.recordSuccess(sourceId);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error ?? 'unknown');
        await this.sourceRuntimeRecorderService.recordFailure(sourceId, message);
        this.logger.warn(
          `Institution discovery refresh failed for ${institution}: ${message}`,
        );
      }
    }
  }
}
