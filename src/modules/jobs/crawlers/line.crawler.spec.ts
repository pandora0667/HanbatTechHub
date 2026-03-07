import { ConfigService } from '@nestjs/config';
import { LineCrawler } from './line.crawler';
import { HttpClientUtil } from '../utils/http-client.util';
import {
  COMPANY_ENUM,
  EMPLOYMENT_TYPE,
  LOCATION_TYPE,
} from '../constants/job-codes.constant';

describe('LineCrawler', () => {
  let crawler: LineCrawler;
  const httpClient = {
    get: jest.fn(),
    getRandomUserAgent: jest.fn(() => 'test-agent'),
  } as unknown as HttpClientUtil;
  const configService = {
    get: jest.fn(),
  } as unknown as ConfigService;

  beforeEach(() => {
    crawler = new LineCrawler(httpClient, configService);
    jest.clearAllMocks();
  });

  it('parses Gatsby page-data and keeps only public engineering jobs in East Asia', async () => {
    httpClient.get = jest.fn().mockResolvedValue({
      result: {
        data: {
          allStrapiJobs: {
            edges: [
              {
                node: {
                  strapiId: 2964,
                  publish: true,
                  is_public: true,
                  is_filters_public: true,
                  until_filled: true,
                  start_date: '2026-02-12T03:00:00.000Z',
                  title: 'System Trading Engineer',
                  title_en: 'System Trading Engineer',
                  employment_type: [{ name: 'Full-time' }],
                  job_unit: [{ name: 'Engineering' }],
                  job_fields: [{ name: 'Server-side' }],
                  companies: [{ name: 'LINE Investment Technologies ' }],
                  cities: [{ name: 'Bundang' }],
                  regions: [{ name: 'East Asia' }],
                },
              },
              {
                node: {
                  strapiId: 2890,
                  publish: true,
                  is_public: true,
                  is_filters_public: true,
                  until_filled: true,
                  start_date: '2025-10-16T03:00:00.000Z',
                  title: 'Senior UX/UI Designer',
                  title_en: 'Senior UX/UI Designer',
                  employment_type: [{ name: 'Full-time' }],
                  job_unit: [{ name: 'Design' }, { name: 'Engineering' }],
                  job_fields: [{ name: 'UX Design' }],
                  companies: [{ name: 'LINE Pay (Thailand) Company Limited' }],
                  cities: [{ name: 'Gwacheon' }],
                  regions: [{ name: 'East Asia' }],
                },
              },
              {
                node: {
                  strapiId: 2000,
                  publish: true,
                  is_public: true,
                  is_filters_public: true,
                  title: 'Product Designer',
                  employment_type: [{ name: 'Full-time' }],
                  job_unit: [{ name: 'Design' }],
                  job_fields: [{ name: 'Product Design' }],
                  companies: [{ name: 'LINE Plus' }],
                  cities: [{ name: 'Bundang' }],
                  regions: [{ name: 'East Asia' }],
                },
              },
              {
                node: {
                  strapiId: 2001,
                  publish: true,
                  is_public: true,
                  is_filters_public: false,
                  title: 'Backend Engineer',
                  employment_type: [{ name: 'Temporary' }],
                  job_unit: [{ name: 'Engineering' }],
                  job_fields: [{ name: 'Server-side' }],
                  companies: [{ name: 'LINE Plus' }],
                  cities: [{ name: 'Bundang' }],
                  regions: [{ name: 'East Asia' }],
                },
              },
            ],
          },
        },
      },
    });

    const jobs = await crawler.fetchJobs();

    expect(httpClient.get).toHaveBeenCalledWith(
      'https://careers.linecorp.com/page-data/ko/jobs/page-data.json?ca=Engineering&ci=Gwacheon%2CBundang&co=East+Asia',
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/json, text/plain, */*',
        }),
      }),
    );
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toEqual(
      expect.objectContaining({
        id: '2964',
        company: COMPANY_ENUM.LINE,
        title: 'System Trading Engineer',
        department: 'Engineering',
        field: 'Server-side',
        employmentType: EMPLOYMENT_TYPE.FULL_TIME,
        locations: [LOCATION_TYPE.BUNDANG],
        url: 'https://careers.linecorp.com/ko/jobs/2964',
      }),
    );
    expect(jobs[0].requirements.skills).toEqual(['Server-side']);
    expect(jobs[1]).toEqual(
      expect.objectContaining({
        id: '2890',
        department: 'Engineering',
        field: 'UX Design',
        locations: [LOCATION_TYPE.BUNDANG],
      }),
    );
  });

  it('returns an empty array when the LINE payload is malformed', async () => {
    httpClient.get = jest.fn().mockResolvedValue({});

    await expect(crawler.fetchJobs()).resolves.toEqual([]);
  });
});
