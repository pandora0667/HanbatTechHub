import { Test } from '@nestjs/testing';
import { SourceRegistryService } from '../../../source-registry/source-registry.service';
import { GetInstitutionCatalogUseCase } from './get-institution-catalog.use-case';

describe('GetInstitutionCatalogUseCase', () => {
  let useCase: GetInstitutionCatalogUseCase;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        GetInstitutionCatalogUseCase,
        {
          provide: SourceRegistryService,
          useValue: {
            list: jest.fn(() => [
              { id: 'institution.hanbat.menu', name: 'Hanbat Menu' },
              { id: 'institution.hanbat.notice', name: 'Hanbat Notice' },
            ]),
          },
        },
      ],
    }).compile();

    useCase = moduleRef.get(GetInstitutionCatalogUseCase);
  });

  it('returns a registry-backed source catalog for implemented institutions', () => {
    const result = useCase.execute('HANBAT');

    expect(result.institution.id).toBe('HANBAT');
    expect(result.summary.registeredSources).toBe(2);
    expect(result.services).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          serviceType: 'academic_notice',
          implementationStatus: 'implemented',
          sourceId: 'institution.hanbat.notice',
        }),
        expect.objectContaining({
          serviceType: 'meal',
          implementationStatus: 'implemented',
          sourceId: 'institution.hanbat.menu',
        }),
      ]),
    );
  });

  it('returns planned blueprints for pilot institutions before implementation', () => {
    const result = useCase.execute('SNU');

    expect(result.institution.rolloutStatus).toBe('pilot');
    expect(result.institution.overviewAvailable).toBe(true);
    expect(result.summary.implementedBlueprints).toBe(0);
    expect(result.services.length).toBeGreaterThan(0);
  });
});
