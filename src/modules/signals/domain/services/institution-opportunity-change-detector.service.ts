import { Injectable } from '@nestjs/common';
import {
  InstitutionOpportunityChangeResult,
  InstitutionOpportunityChangeSignal,
  InstitutionOpportunityChangeSummary,
  InstitutionOpportunityChangeType,
} from '../models/institution-opportunity-change-signal.model';
import { InstitutionOpportunityItem } from '../../../institution-intelligence/domain/types/institution-opportunity.type';

interface DetectInput {
  previousItems?: InstitutionOpportunityItem[];
  currentItems: InstitutionOpportunityItem[];
  generatedAt: Date | string;
  baselineCollectedAt?: string;
  snapshot?: InstitutionOpportunityChangeResult['snapshot'];
}

type ComparableField =
  | 'title'
  | 'pageUrl'
  | 'matchedKeywords'
  | 'score'
  | 'rank'
  | 'discoveryMode'
  | 'recordType'
  | 'excerpt'
  | 'postedAt'
  | 'sourceId';

@Injectable()
export class InstitutionOpportunityChangeDetectorService {
  detect(input: DetectInput): InstitutionOpportunityChangeResult {
    if (!input.previousItems || input.previousItems.length === 0) {
      return {
        generatedAt: this.toIsoString(input.generatedAt),
        baselineCollectedAt: input.baselineCollectedAt,
        snapshot: input.snapshot,
        summary: this.createSummary([]),
        signals: [],
      };
    }

    const previousById = new Map(
      input.previousItems.map((item) => [item.id, item] as const),
    );
    const currentById = new Map(
      input.currentItems.map((item) => [item.id, item] as const),
    );
    const signals: InstitutionOpportunityChangeSignal[] = [];

    for (const currentItem of input.currentItems) {
      const previousItem = previousById.get(currentItem.id);

      if (!previousItem) {
        signals.push(this.toSignal('new', currentItem));
        continue;
      }

      const changedFields = this.collectChangedFields(previousItem, currentItem);

      if (changedFields.length > 0) {
        signals.push(this.toSignal('updated', currentItem, changedFields));
      }
    }

    for (const previousItem of input.previousItems) {
      if (!currentById.has(previousItem.id)) {
        signals.push(this.toSignal('removed', previousItem));
      }
    }

    const sortedSignals = signals.sort((left, right) =>
      this.compareSignals(left, right),
    );

    return {
      generatedAt: this.toIsoString(input.generatedAt),
      baselineCollectedAt: input.baselineCollectedAt,
      snapshot: input.snapshot,
      summary: this.createSummary(sortedSignals),
      signals: sortedSignals,
    };
  }

  private collectChangedFields(
    previousItem: InstitutionOpportunityItem,
    currentItem: InstitutionOpportunityItem,
  ): ComparableField[] {
    const previousComparable = this.toComparableMap(previousItem);
    const currentComparable = this.toComparableMap(currentItem);
    const changedFields: ComparableField[] = [];

    for (const field of Object.keys(previousComparable) as ComparableField[]) {
      if (previousComparable[field] !== currentComparable[field]) {
        changedFields.push(field);
      }
    }

    return changedFields;
  }

  private toComparableMap(item: InstitutionOpportunityItem) {
    return {
      title: item.title.trim(),
      pageUrl: item.pageUrl.trim(),
      matchedKeywords: [...item.matchedKeywords].sort().join('|'),
      score: Number(item.score.toFixed(3)).toString(),
      rank: Number(item.rank.toFixed(2)).toString(),
      discoveryMode: item.discoveryMode,
      recordType: item.recordType,
      excerpt: item.excerpt?.trim() ?? '',
      postedAt: item.postedAt ?? '',
      sourceId: item.sourceId,
    };
  }

  private toSignal(
    changeType: InstitutionOpportunityChangeType,
    item: InstitutionOpportunityItem,
    changedFields?: ComparableField[],
  ): InstitutionOpportunityChangeSignal {
    return {
      type: 'institution_opportunity_change',
      changeType,
      opportunityId: item.id,
      institutionId: item.institutionId,
      institutionName: item.institutionName,
      region: item.region,
      serviceType: item.serviceType,
      title: item.title,
      url: item.url,
      pageUrl: item.pageUrl,
      discoveryMode: item.discoveryMode,
      recordType: item.recordType,
      excerpt: item.excerpt,
      postedAt: item.postedAt,
      rank: item.rank,
      sourceId: item.sourceId,
      changedFields,
    };
  }

  private createSummary(
    signals: InstitutionOpportunityChangeSignal[],
  ): InstitutionOpportunityChangeSummary {
    return signals.reduce<InstitutionOpportunityChangeSummary>(
      (summary, signal) => {
        summary.total += 1;

        if (signal.changeType === 'new') {
          summary.created += 1;
        } else if (signal.changeType === 'updated') {
          summary.updated += 1;
        } else {
          summary.removed += 1;
        }

        return summary;
      },
      {
        total: 0,
        created: 0,
        updated: 0,
        removed: 0,
      },
    );
  }

  private compareSignals(
    left: InstitutionOpportunityChangeSignal,
    right: InstitutionOpportunityChangeSignal,
  ): number {
    const changeTypeWeight = this.changeTypeWeight(right.changeType) -
      this.changeTypeWeight(left.changeType);

    if (changeTypeWeight !== 0) {
      return changeTypeWeight;
    }

    if (left.rank !== right.rank) {
      return right.rank - left.rank;
    }

    if (left.postedAt && right.postedAt && left.postedAt !== right.postedAt) {
      return right.postedAt.localeCompare(left.postedAt);
    }

    const institutionOrder = left.institutionName.localeCompare(
      right.institutionName,
      'ko',
    );

    if (institutionOrder !== 0) {
      return institutionOrder;
    }

    const serviceTypeOrder = left.serviceType.localeCompare(right.serviceType);

    if (serviceTypeOrder !== 0) {
      return serviceTypeOrder;
    }

    return left.title.localeCompare(right.title, 'ko');
  }

  private changeTypeWeight(changeType: InstitutionOpportunityChangeType): number {
    if (changeType === 'new') {
      return 3;
    }

    if (changeType === 'updated') {
      return 2;
    }

    return 1;
  }

  private toIsoString(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }
}
