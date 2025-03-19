import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseJobCrawler } from './base-job.crawler';
import { GetJobsQueryDto } from '../dto/requests/get-jobs-query.dto';
import {
  JobPosting,
  CareerType,
  LocationType,
} from '../interfaces/job-posting.interface';
import {
  COMPANY_ENUM,
  CAREER_TYPE,
  EMPLOYMENT_TYPE,
  LOCATION_TYPE,
} from '../constants/job-codes.constant';
import { HttpClientUtil } from '../utils/http-client.util';
import { KakaoJobData } from '../interfaces/kakao-job.interface';

@Injectable()
export class KakaoCrawler extends BaseJobCrawler {
  protected readonly logger = new Logger(KakaoCrawler.name);

  constructor(
    protected readonly httpClient: HttpClientUtil,
    protected readonly configService: ConfigService,
  ) {
    super(COMPANY_ENUM.KAKAO, httpClient, 'https://careers.kakao.com');
  }

  async fetchJobs(_query?: GetJobsQueryDto): Promise<JobPosting[]> {
    this.logger.debug('Starting to fetch Kakao jobs...');

    try {
      // API 직접 호출을 위한 설정
      const jobListUrl = 'https://careers.kakao.com/public/api/job-list';
      const params = new URLSearchParams({
        skillSet: '',
        part: 'TECHNOLOGY',
        company: 'KAKAO',
        employeeType: '',
        page: '1',
      });

      // API 호출
      this.logger.debug(`Fetching jobs from API: ${jobListUrl}?${params}`);
      const response = await this.httpClient.get(jobListUrl, {
        params: Object.fromEntries(params),
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'ko-KR,ko;q=0.9',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Referer: 'https://careers.kakao.com/jobs',
          'sec-ch-ua':
            '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
        },
      });

      this.logger.debug('API Response:', JSON.stringify(response, null, 2));
      this.logger.debug(
        'API Response data:',
        JSON.stringify(response.data, null, 2),
      );

      // API 응답에서 채용 공고 추출
      const jobs =
        response?.jobList?.map(
          (job: any): KakaoJobData => ({
            id: job.realId?.replace('P-', '') || '',
            title: job.jobOfferTitle || '',
            department: job.jobPartName || '',
            field: job.skillSetList?.[0]?.skillSetName || '',
            career: this.parseCareer(job.qualification || ''),
            employmentType: job.employeeTypeName || '',
            location: job.locationName || '',
            period: {
              start: job.regDate || '',
              end: job.endDate || '',
            },
            url: `https://careers.kakao.com/jobs/${job.realId}`,
            requirements: this.parseRequirements(job.qualification || ''),
            preferences: this.parsePreferences(job.qualification || ''),
            description: this.parseDescription(
              job.workContentDesc || '',
              job.introduction || '',
            ),
            benefits: this.parseBenefits(job.workTypeDesc || ''),
            skills: this.extractSkills(job),
          }),
        ) || [];

      this.logger.debug(`Extracted ${jobs.length} job listings from API`);

      // 데이터 변환
      const transformedJobs = await this.transformJobData(jobs);
      this.logger.debug(`Transformed ${transformedJobs.length} job postings`);

      return transformedJobs;
    } catch (error) {
      this.logger.error('Error fetching Kakao jobs:', error);
      this.logger.error('Error stack:', error.stack);
      throw error;
    }
  }

  private parseCareer(qualification: string): string {
    if (qualification.includes('신입')) {
      return '신입';
    } else if (qualification.includes('경력')) {
      const match = qualification.match(/경력\s*(\d+)[년~\s]*(\d+)?/);
      if (match) {
        const start = match[1];
        const end = match[2];
        return end ? `${start}~${end}년` : `${start}년 이상`;
      }
    }
    return '경력무관';
  }

  private parseRequirements(qualification: string): string[] {
    const requirements: string[] = [];
    const lines = qualification.split('<br/>');
    let isRequirements = true;

    for (const line of lines) {
      if (line.includes('우대사항')) {
        isRequirements = false;
        continue;
      }

      if (isRequirements && line.trim().startsWith('-')) {
        requirements.push(line.trim().substring(1).trim());
      }
    }

    return requirements;
  }

  private parsePreferences(qualification: string): string[] {
    const preferences: string[] = [];
    const lines = qualification.split('<br/>');
    let isPreferences = false;

    for (const line of lines) {
      if (line.includes('우대사항')) {
        isPreferences = true;
        continue;
      }

      if (isPreferences && line.trim().startsWith('-')) {
        preferences.push(line.trim().substring(1).trim());
      }
    }

    return preferences;
  }

  private parseDescription(workContent: string, introduction: string): string {
    return `${introduction}\n\n[주요업무]\n${workContent}`.replace(
      /<br\/>/g,
      '\n',
    );
  }

  private parseBenefits(workTypeDesc: string): string[] {
    return workTypeDesc
      .split('<br>')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('•'))
      .map((line) => line.substring(1).trim());
  }

  private extractSkills(job: any): string[] {
    const skills = new Set<string>();

    // Add skills from qualification field
    const qualification = job.qualification || '';
    this.logger.debug('Qualification text:', qualification);

    const skillMatches = qualification.match(
      /(?:Java|Kotlin|Spring|Kubernetes|Docker|Linux|MySQL|NoSQL|Redis|Elasticsearch|Kafka|Python|JavaScript|TypeScript|React|Vue|Angular|Node\.js|AWS|GCP|Azure|CI\/CD|Git|Swift|SwiftUI|Objective-C|iOS|Android|Golang|Shell|Ansible|Spark|HBase|Hadoop|\bAI\b|Machine Learning|Deep Learning)[a-zA-Z0-9.]*\b/g,
    );

    if (skillMatches) {
      this.logger.debug('Found skills in qualification:', skillMatches);
      skillMatches.forEach((skill) => skills.add(skill));
    }

    // Add skills from skillSetList
    if (job.skillSetList) {
      this.logger.debug('SkillSetList:', job.skillSetList);
      job.skillSetList.forEach((skillSet: any) => {
        if (
          skillSet.skillSetName &&
          !['etc', '기타'].includes(skillSet.skillSetName)
        ) {
          skills.add(skillSet.skillSetName);
        }
      });
    }

    const extractedSkills = Array.from(skills);
    this.logger.debug('Extracted skills:', extractedSkills);
    return extractedSkills;
  }

  private async transformJobData(jobs: KakaoJobData[]): Promise<JobPosting[]> {
    return Promise.all(
      jobs.map(async (job) => ({
        id: job.id,
        company: COMPANY_ENUM.KAKAO,
        title: job.title,
        department: job.department,
        field: job.field,
        requirements: {
          career: this.mapCareerType(job.career),
          skills: job.skills || [],
        },
        employmentType: EMPLOYMENT_TYPE.FULL_TIME,
        locations: [this.mapLocationType(job.location)],
        period: {
          start: new Date(job.period.start),
          end: job.period.end
            ? new Date(job.period.end)
            : new Date('2099-12-31'),
        },
        url: job.url,
        source: {
          originalId: job.id,
          originalUrl: job.url,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );
  }

  private mapCareerType(career: string): CareerType {
    if (career.includes('신입')) {
      return CAREER_TYPE.NEW;
    } else if (career.includes('경력')) {
      return CAREER_TYPE.EXPERIENCED;
    }
    return CAREER_TYPE.ANY;
  }

  private mapLocationType(location: string): LocationType {
    switch (location) {
      case '판교':
      case '분당':
        return LOCATION_TYPE.BUNDANG;
      case '제주':
        return LOCATION_TYPE.SEOUL;
      default:
        return LOCATION_TYPE.BUNDANG;
    }
  }
}
