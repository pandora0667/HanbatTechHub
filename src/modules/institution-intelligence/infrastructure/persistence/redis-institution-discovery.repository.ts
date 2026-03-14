import { Injectable } from '@nestjs/common';
import { appendRedisKey } from '../../../../common/utils/redis-key.util';
import { RedisService } from '../../../redis/redis.service';
import {
  INSTITUTION_DISCOVERY_CACHE_TTL,
  INSTITUTION_DISCOVERY_REDIS_KEYS,
} from '../../constants/institution-discovery.constant';
import { InstitutionType } from '../../constants/institution-id.constant';
import { InstitutionDiscoveryRepository } from '../../application/ports/institution-discovery.repository';
import { InstitutionDiscoverySnapshot } from '../../domain/types/institution-discovery.type';

@Injectable()
export class RedisInstitutionDiscoveryRepository
  implements InstitutionDiscoveryRepository
{
  constructor(private readonly redisService: RedisService) {}

  async getSnapshot(
    institution: InstitutionType,
  ): Promise<InstitutionDiscoverySnapshot | null> {
    return this.redisService.get<InstitutionDiscoverySnapshot>(
      appendRedisKey(INSTITUTION_DISCOVERY_REDIS_KEYS.SNAPSHOT, institution),
    );
  }

  async saveSnapshot(
    institution: InstitutionType,
    snapshot: InstitutionDiscoverySnapshot,
  ): Promise<void> {
    await this.redisService.set(
      appendRedisKey(INSTITUTION_DISCOVERY_REDIS_KEYS.SNAPSHOT, institution),
      snapshot,
      INSTITUTION_DISCOVERY_CACHE_TTL,
    );
  }
}
