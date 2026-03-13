import { Injectable } from '@nestjs/common';
import { SourceRegistryService } from '../../../source-registry/source-registry.service';
import { GetSourceRegistryQueryDto } from '../../../source-registry/dto/get-source-registry-query.dto';
import { SourceFreshnessEvaluatorService } from '../../domain/services/source-freshness-evaluator.service';
import { SourceLastUpdateResolverService } from '../services/source-last-update-resolver.service';
import { SourceFreshnessSignal, SourceFreshnessSummary, SourceFreshnessStatus } from '../../domain/models/source-freshness-signal.model';

export interface GetSourceFreshnessSignalsQuery extends GetSourceRegistryQueryDto {
  status?: SourceFreshnessStatus;
}

export interface SourceFreshnessResult {
  generatedAt: string;
  summary: SourceFreshnessSummary;
  signals: SourceFreshnessSignal[];
}

@Injectable()
export class GetSourceFreshnessSignalsUseCase {
  constructor(
    private readonly sourceRegistryService: SourceRegistryService,
    private readonly sourceLastUpdateResolverService: SourceLastUpdateResolverService,
    private readonly sourceFreshnessEvaluatorService: SourceFreshnessEvaluatorService,
  ) {}

  async execute(
    query: GetSourceFreshnessSignalsQuery = {},
  ): Promise<SourceFreshnessResult> {
    const now = new Date();
    const sources = this.sourceRegistryService.list(query);
    const signals = await Promise.all(
      sources.map(async (source) =>
        this.sourceFreshnessEvaluatorService.evaluate(
          source,
          await this.sourceLastUpdateResolverService.resolve(source.id),
          now,
        ),
      ),
    );
    const filteredSignals = query.status
      ? signals.filter((signal) => signal.status === query.status)
      : signals;

    return {
      generatedAt: now.toISOString(),
      summary: this.sourceFreshnessEvaluatorService.summarize(filteredSignals),
      signals: filteredSignals,
    };
  }
}
