import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseJobCrawler } from './base-job.crawler';
import { GetJobsQueryDto } from '../dto/requests/get-jobs-query.dto';
import { JobPosting } from '../interfaces/job-posting.interface';
import {
  COMPANY_ENUM,
  CAREER_TYPE,
  EMPLOYMENT_TYPE,
  LOCATION_TYPE,
} from '../constants/job-codes.constant';
import { HttpClientUtil } from '../utils/http-client.util';
import * as puppeteer from 'puppeteer';

@Injectable()
export class BaeminCrawler extends BaseJobCrawler {
  protected readonly logger = new Logger(BaeminCrawler.name);

  constructor(
    protected readonly httpClient: HttpClientUtil,
    protected readonly configService: ConfigService,
  ) {
    super(COMPANY_ENUM.BAEMIN, httpClient, 'https://career.woowahan.com');
  }

  async fetchJobs(query?: GetJobsQueryDto): Promise<JobPosting[]> {
    let browser;
    try {
      this.logger.log('배민 채용 정보 가져오기 시작');
      const url = this.buildUrl(query);
      this.logger.debug(`요청 URL: ${url}`);

      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080',
        ],
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
      });

      const page = await browser.newPage();

      // User-Agent 설정
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      );

      // 타임아웃 설정
      page.setDefaultTimeout(30000);
      page.setDefaultNavigationTimeout(30000);

      // 페이지 로드
      await page.goto(url, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 30000,
      });

      // Vue.js 앱이 마운트될 때까지 대기
      await page.waitForFunction(
        () => document.querySelector('.recruit-type-list') !== null,
        { timeout: 10000 },
      );

      // 스크롤을 끝까지 내려서 모든 데이터 로드
      await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });

      // 데이터 로딩 대기
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 채용공고 데이터 추출
      const jobs = await page.evaluate(() => {
        const inferFieldFromTitle = (title: string): string => {
          const titleLower = title.toLowerCase();

          if (
            titleLower.includes('프론트엔드') ||
            titleLower.includes('frontend')
          ) {
            return '프론트엔드 개발';
          } else if (
            titleLower.includes('백엔드') ||
            titleLower.includes('backend') ||
            titleLower.includes('서버')
          ) {
            return '백엔드 개발';
          } else if (
            titleLower.includes('데이터') ||
            titleLower.includes('data')
          ) {
            return '데이터 엔지니어링';
          } else if (
            titleLower.includes('ai') ||
            titleLower.includes('ml') ||
            titleLower.includes('머신러닝')
          ) {
            return 'AI/ML';
          } else if (
            titleLower.includes('devops') ||
            titleLower.includes('sre')
          ) {
            return 'DevOps/SRE';
          } else if (titleLower.includes('qa') || titleLower.includes('test')) {
            return 'QA/테스트';
          } else if (
            titleLower.includes('security') ||
            titleLower.includes('보안')
          ) {
            return '보안';
          }

          return '개발';
        };

        const parseLocation = (location: string): string => {
          if (location.includes('서울')) return '서울';
          if (location.includes('경기')) return '경기';
          if (location.includes('인천')) return '인천';
          if (location.includes('부산')) return '부산';
          if (location.includes('대구')) return '대구';
          if (location.includes('대전')) return '대전';
          if (location.includes('광주')) return '광주';
          if (location.includes('울산')) return '울산';
          if (location.includes('세종')) return '세종';
          if (location.includes('강원')) return '강원';
          if (location.includes('충북')) return '충북';
          if (location.includes('충남')) return '충남';
          if (location.includes('전북')) return '전북';
          if (location.includes('전남')) return '전남';
          if (location.includes('경북')) return '경북';
          if (location.includes('경남')) return '경남';
          if (location.includes('제주')) return '제주';
          return '기타';
        };

        const jobElements = document.querySelectorAll('.recruit-type-list li');
        return Array.from(jobElements)
          .map((element) => {
            const titleElement = element.querySelector('a[class="title"]');
            const href = titleElement?.getAttribute('href') || '';
            const id = href.match(/jobCodes=([^&]+)/)?.[1] || '';

            const title =
              element.querySelector('.fr-view')?.textContent?.trim() || '';
            const careerElement = element.querySelector('.flag-career');
            const career = careerElement?.textContent?.trim() || '';

            // DOM 쿼리는 유지하고 변수 할당만 제거
            element.querySelector('.flag-type')?.textContent?.trim();
            const location =
              element.querySelector('.flag-btn')?.textContent?.trim() || '서울';

            // 태그 정보 추출 및 기술 스택 분리
            const tags = Array.from(element.querySelectorAll('.flag-tag'))
              .map((tag) => tag.textContent?.trim())
              .filter((tag) => tag) as string[];

            // 기술 스택 태그만 추출 (#으로 시작하는 태그)
            const rawSkills = tags
              .filter((tag) => tag.startsWith('#'))
              .flatMap((tag) => {
                const skillText = tag.replace(/^#\s*/, '').trim();
                // 실제 스킬 이름 추출 (괄호 제거)
                return skillText
                  .split('#')
                  .map((name) => name.trim())
                  .filter((name) => name && name !== '#');
              });

            // 복합 기술 스택 처리
            const compositeSkills = [
              'Spring Framework',
              'Spring Boot',
              'Spring Batch',
              'Spring Cloud',
              'Spring Security',
              'Node.js',
              'Next.js',
              'React Native',
              'Amazon Web Services',
              'Google Cloud Platform',
              'Microsoft Azure',
              'Machine Learning',
              'Deep Learning',
              'Natural Language Processing',
              'Computer Vision',
            ];

            // 기술 스택 정규화
            const skills = rawSkills
              .map((skill) => {
                // 복합 기술 스택 매칭
                const matchedSkill = compositeSkills.find(
                  (cs) =>
                    cs.toLowerCase().includes(skill.toLowerCase()) ||
                    skill.toLowerCase().includes(cs.toLowerCase()),
                );

                return matchedSkill || skill.trim();
              })
              .filter((skill) => skill && skill !== '#');

            // 중복 제거
            const uniqueSkills = Array.from(new Set(skills));

            // 기술 스택이 아닌 태그는 field 정보로 사용
            const fieldTags = tags.filter((tag) => !tag.startsWith('#'));

            // 부서 정보 추출
            const titleParts = title.split(']');
            const departmentInfo = titleParts[1]?.trim().split(' ') || [];
            let extractedDepartment = '';

            // 부서명 추출 (실 또는 팀으로 끝나는 단어 찾기)
            for (const part of departmentInfo) {
              if (part.endsWith('실') || part.endsWith('팀')) {
                extractedDepartment = part;
                break;
              }
            }

            return {
              id,
              title,
              department: extractedDepartment,
              field: inferFieldFromTitle(title),
              career,
              employmentType: '정규직',
              location: parseLocation(location),
              period: '채용시까지',
              skills: uniqueSkills,
              tags: fieldTags,
              originalUrl: `https://career.woowahan.com${href}`,
            };
          })
          .filter((job) => job.title);
      });

      if (!jobs || jobs.length === 0) {
        this.logger.warn('채용공고 데이터를 찾을 수 없습니다.');
        return [];
      }

      // JobPosting 형식으로 변환
      const jobPostings = jobs.map((job) => {
        const jobTemplate = this.createJobPostingTemplate();
        const now = new Date();
        const endDate = this.getDateMonthLater(1);

        return {
          ...jobTemplate,
          id: job.id || this.generateId(job.title),
          title: job.title,
          company: this.company,
          department: job.department,
          field: job.field,
          requirements: {
            ...jobTemplate.requirements,
            career: this.mapCareerType(job.career),
            skills: job.skills,
          },
          employmentType: this.mapEmploymentType(job.employmentType),
          locations: [this.mapLocationType(job.location)],
          period: {
            start: now,
            end: endDate,
          },
          url: job.originalUrl,
          source: {
            originalId: job.id || this.generateId(job.title),
            originalUrl: job.originalUrl,
          },
          jobCategory: this.inferJobCategory(job.title),
          tags: job.tags,
        } as JobPosting;
      });

      this.logger.log(`배민 채용 정보 ${jobPostings.length}건 가져오기 완료`);
      return jobPostings;
    } catch (error) {
      this.logger.error('배민 채용 정보 가져오기 실패:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private buildUrl(query?: GetJobsQueryDto): string {
    const params = new URLSearchParams({
      jobCodes: '',
      employmentTypeCodes: '',
      serviceSectionCodes: '',
      careerPeriod: '',
      keyword: '',
      category: 'jobGroupCodes:BA005001',
    });

    if (query?.page) {
      params.append('page', query.page.toString());
    }

    return `${this.baseUrl}?${params.toString()}#recruit-list`;
  }

  private parseDateRange(period: string): [Date, Date] {
    const now = new Date();
    const [startStr, endStr] = period.split('~').map((date) => date.trim());

    let startDate = now;
    let endDate = this.getDateMonthLater(1);

    try {
      if (startStr) {
        startDate = new Date(startStr);
      }
      if (endStr && endStr !== '채용시까지') {
        endDate = new Date(endStr);
      } else if (endStr === '채용시까지') {
        endDate = new Date('2099-12-31');
      }
    } catch {
      this.logger.warn(`날짜 파싱 실패: ${period}`);
    }

    return [startDate, endDate];
  }

  private mapCareerType(
    career: string,
  ): (typeof CAREER_TYPE)[keyof typeof CAREER_TYPE] {
    if (career.includes('신입')) {
      return CAREER_TYPE.NEW;
    } else if (career.includes('경력')) {
      return CAREER_TYPE.EXPERIENCED;
    }
    return CAREER_TYPE.ANY;
  }

  private mapEmploymentType(
    type: string,
  ): (typeof EMPLOYMENT_TYPE)[keyof typeof EMPLOYMENT_TYPE] {
    if (type.includes('계약')) {
      return EMPLOYMENT_TYPE.CONTRACT;
    } else if (type.includes('인턴')) {
      return EMPLOYMENT_TYPE.INTERN;
    }
    return EMPLOYMENT_TYPE.FULL_TIME;
  }

  private mapLocationType(
    location: string,
  ): (typeof LOCATION_TYPE)[keyof typeof LOCATION_TYPE] {
    if (location.includes('서울')) {
      return LOCATION_TYPE.SEOUL;
    } else if (location.includes('부산')) {
      return LOCATION_TYPE.BUSAN;
    }
    return LOCATION_TYPE.OTHER;
  }

  getJobDetailUrl(jobId: string): string {
    return `${this.baseUrl}/jobs/${jobId}`;
  }

  private generateId(title: string): string {
    // 제목에서 특수문자 제거하고 공백을 -로 변경
    const sanitizedTitle = title
      .replace(/[\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();

    // 현재 타임스탬프 추가
    return `${sanitizedTitle}-${Date.now()}`;
  }
}
