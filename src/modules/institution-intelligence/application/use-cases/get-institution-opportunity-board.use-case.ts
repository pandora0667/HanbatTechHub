import { Injectable } from '@nestjs/common';
import { mergeSnapshotMetadata } from '../../../../common/utils/snapshot.util';
import { paginateArray } from '../../../../common/utils/pagination.util';
import { SourceRegistryService } from '../../../source-registry/source-registry.service';
import { INSTITUTION_REGISTRY } from '../../constants/institution-registry.constant';
import { InstitutionOpportunitiesResponseDto } from '../../dto/institution.response.dto';
import {
  GetInstitutionOpportunityBoardQueryDto,
  parseInstitutionFilter,
} from '../../dto/get-institution-opportunities-query.dto';
import { GetInstitutionOpportunitiesUseCase } from './get-institution-opportunities.use-case';

@Injectable()
export class GetInstitutionOpportunityBoardUseCase {
  constructor(
    private readonly getInstitutionOpportunitiesUseCase: GetInstitutionOpportunitiesUseCase,
    private readonly sourceRegistryService: SourceRegistryService,
  ) {}

  async execute(
    query: GetInstitutionOpportunityBoardQueryDto,
  ): Promise<InstitutionOpportunitiesResponseDto> {
    const institutionFilter = parseInstitutionFilter(query.institutions);
    const targetedInstitutions = INSTITUTION_REGISTRY.filter((entry) => {
      if (institutionFilter && !institutionFilter.includes(entry.id)) {
        return false;
      }

      if (query.rolloutWave && entry.rolloutWave !== query.rolloutWave) {
        return false;
      }

      if (
        query.region &&
        !entry.region.toLowerCase().includes(query.region.trim().toLowerCase())
      ) {
        return false;
      }

      return true;
    });
    const generatedAt = new Date().toISOString();

    if (targetedInstitutions.length === 0) {
      return {
        generatedAt,
        snapshot: undefined,
        summary: {
          totalOpportunities: 0,
          serviceTypesCovered: 0,
          liveInstitutions: 0,
          fallbackInstitutions: 0,
        },
        meta: {
          totalCount: 0,
          currentPage: query.page ?? 1,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          limit: query.limit ?? 20,
          serviceType: query.serviceType,
          keyword: query.keyword,
          snapshot: undefined,
        },
        items: [],
        sources: [],
      };
    }

    const institutionResponses = await Promise.all(
      targetedInstitutions.map((institution) =>
        this.getInstitutionOpportunitiesUseCase.execute(institution.id, query),
      ),
    );
    const filteredByMode = institutionResponses.filter((response) => {
      if (!query.mode) {
        return true;
      }

      return response.summary.liveInstitutions === 1
        ? query.mode === 'live'
        : query.mode === 'catalog_fallback';
    });
    const allItems = filteredByMode
      .flatMap((response) => response.items)
      .sort((left, right) => {
        if (right.rank !== left.rank) {
          return right.rank - left.rank;
        }

        if (left.postedAt && right.postedAt && left.postedAt !== right.postedAt) {
          return right.postedAt.localeCompare(left.postedAt);
        }

        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return left.institutionName.localeCompare(right.institutionName, 'ko');
      });
    const paginated = paginateArray(
      allItems,
      query.page ?? 1,
      query.limit ?? 20,
      20,
    );
    const mergedSnapshot = mergeSnapshotMetadata(
      filteredByMode
        .map((response) => response.snapshot)
        .filter((snapshot) => snapshot !== undefined),
    );

    return {
      generatedAt,
      snapshot: mergedSnapshot,
      summary: {
        totalOpportunities: allItems.length,
        serviceTypesCovered: new Set(allItems.map((item) => item.serviceType))
          .size,
        liveInstitutions: filteredByMode.filter(
          (response) => response.summary.liveInstitutions === 1,
        ).length,
        fallbackInstitutions: filteredByMode.filter(
          (response) => response.summary.fallbackInstitutions === 1,
        ).length,
      },
      meta: {
        ...paginated.meta,
        limit: query.limit ?? 20,
        serviceType: query.serviceType,
        keyword: query.keyword,
        snapshot: mergedSnapshot,
      },
      items: paginated.items,
      sources: mergedSnapshot
        ? this.sourceRegistryService
            .list()
            .filter((source) => mergedSnapshot.sourceIds.includes(source.id))
            .sort((left, right) => left.id.localeCompare(right.id))
        : [],
    };
  }
}
