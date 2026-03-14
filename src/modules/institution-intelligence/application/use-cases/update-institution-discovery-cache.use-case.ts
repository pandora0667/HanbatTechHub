import { Injectable, Logger } from '@nestjs/common';
import { INSTITUTION_REGISTRY } from '../../constants/institution-registry.constant';
import { InstitutionType } from '../../constants/institution-id.constant';
import { GetInstitutionDiscoveryUseCase } from './get-institution-discovery.use-case';

@Injectable()
export class UpdateInstitutionDiscoveryCacheUseCase {
  private readonly logger = new Logger(UpdateInstitutionDiscoveryCacheUseCase.name);

  constructor(
    private readonly getInstitutionDiscoveryUseCase: GetInstitutionDiscoveryUseCase,
  ) {}

  async execute(targetInstitutions?: InstitutionType[]): Promise<void> {
    const institutions =
      targetInstitutions ?? INSTITUTION_REGISTRY.map((entry) => entry.id);

    for (const institution of institutions) {
      try {
        await this.getInstitutionDiscoveryUseCase.execute(institution, {
          forceRefresh: true,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error ?? 'unknown');
        this.logger.warn(
          `Institution discovery refresh failed for ${institution}: ${message}`,
        );
      }
    }
  }
}
