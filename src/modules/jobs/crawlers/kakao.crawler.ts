import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseJobCrawler } from './base-job.crawler';
import { GetJobsQueryDto } from '../dto/requests/get-jobs-query.dto';
import { JobPosting, CareerType, LocationType } from '../interfaces/job-posting.interface';
import { COMPANY_ENUM, CAREER_TYPE, EMPLOYMENT_TYPE, LOCATION_TYPE } from '../constants/job-codes.constant';
import { HttpClientUtil } from '../utils/http-client.util';
import { BrowserService } from '../services/browser.service';
import { KakaoJobData } from '../interfaces/kakao-job.interface';
import { Page } from 'puppeteer';
import { JobDto } from '../dtos/job.dto';

@Injectable()
export class KakaoCrawler extends BaseJobCrawler {
  protected readonly logger = new Logger(KakaoCrawler.name);

  constructor(
    protected readonly httpClient: HttpClientUtil,
    private readonly browserService: BrowserService,
    protected readonly configService: ConfigService,
  ) {
    super(
      COMPANY_ENUM.KAKAO,
      httpClient,
      'https://careers.kakao.com',
    );
  }

  async fetchJobs(query?: GetJobsQueryDto): Promise<JobPosting[]> {
    this.logger.debug('Starting to fetch Kakao jobs...');
    let page: Page | null = null;

    try {
      // 브라우저 페이지 생성
      this.logger.debug('Creating browser page...');
      page = await this.browserService.createPage();
      if (!page) throw new Error('Failed to create browser page');
      this.logger.debug('Browser page created successfully');

      // 브라우저 설정
      await page.setJavaScriptEnabled(true);
      await page.setDefaultNavigationTimeout(60000);
      await page.setDefaultTimeout(30000);

      // 브라우저 환경 설정
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      });

      // API 직접 호출을 위한 설정
      const jobListUrl = 'https://careers.kakao.com/public/api/job-list';
      const params = new URLSearchParams({
        skillSet: '',
        part: 'TECHNOLOGY',
        company: 'KAKAO',
        employeeType: '',
        page: '1'
      });

      // API 호출
      this.logger.debug(`Fetching jobs from API: ${jobListUrl}?${params}`);
      const response = await page.evaluate(async (url, params) => {
        const response = await fetch(`${url}?${params}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Accept-Language': 'ko-KR,ko;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Referer': 'https://careers.kakao.com/jobs',
            'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        return response.json();
      }, jobListUrl, params.toString());

      this.logger.debug('API Response:', response);

      // API 응답에서 채용 공고 추출
      const jobs = response.jobList?.map((job: any): KakaoJobData => ({
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
        description: this.parseDescription(job.workContentDesc || '', job.introduction || ''),
        benefits: this.parseBenefits(job.workTypeDesc || ''),
        skills: this.extractSkills(job)
      })) || [];

      this.logger.debug(`Extracted ${jobs.length} job listings from API`);

      // 데이터 변환
      const transformedJobs = await this.transformJobData(jobs);
      this.logger.debug(`Transformed ${transformedJobs.length} job postings`);

      return transformedJobs;
    } catch (error) {
      this.logger.error('Error fetching Kakao jobs:', error);
      this.logger.error('Error stack:', error.stack);
      throw error;
    } finally {
      if (page) {
        try {
          this.logger.debug('Closing browser page...');
          await page.close({ runBeforeUnload: true });
          this.logger.debug('Browser page closed');
        } catch (error) {
          this.logger.error('Error closing browser page:', error);
        }
      }
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
    return `${introduction}\n\n[주요업무]\n${workContent}`.replace(/<br\/>/g, '\n');
  }

  private parseBenefits(workTypeDesc: string): string[] {
    return workTypeDesc
      .split('<br>')
      .map(line => line.trim())
      .filter(line => line.startsWith('•'))
      .map(line => line.substring(1).trim());
  }

  private extractSkills(job: any): string[] {
    const skills = new Set<string>();
    
    // Add skills from qualification field
    const qualification = job.qualification || '';
    this.logger.debug('Qualification text:', qualification);
    
    const skillMatches = qualification.match(/(?:Java|Kotlin|Spring|Kubernetes|Docker|Linux|MySQL|NoSQL|Redis|Elasticsearch|Kafka|Python|JavaScript|TypeScript|React|Vue|Angular|Node\.js|AWS|GCP|Azure|CI\/CD|Git|Swift|SwiftUI|Objective-C|iOS|Android|Golang|Shell|Ansible|Spark|HBase|Hadoop|\bAI\b|Machine Learning|Deep Learning)[a-zA-Z0-9.]*\b/g);
    
    if (skillMatches) {
      this.logger.debug('Found skills in qualification:', skillMatches);
      skillMatches.forEach(skill => skills.add(skill));
    }

    // Add skills from skillSetList
    if (job.skillSetList) {
      this.logger.debug('SkillSetList:', job.skillSetList);
      job.skillSetList.forEach((skillSet: any) => {
        if (skillSet.skillSetName && !['etc', '기타'].includes(skillSet.skillSetName)) {
          skills.add(skillSet.skillSetName);
        }
      });
    }

    const extractedSkills = Array.from(skills);
    this.logger.debug('Extracted skills:', extractedSkills);
    return extractedSkills;
  }

  private async extractJobListings(page: Page): Promise<KakaoJobData[]> {
    this.logger.debug('Starting job listings extraction...');
    
    try {
      // 채용 공고 데이터 추출
      const jobListings = await page.evaluate(() => {
        const jobs: KakaoJobData[] = [];
        const jobCards = document.querySelectorAll('ul.list_jobs > li');
        console.log(`Found ${jobCards.length} job cards`);

        jobCards.forEach((card) => {
          try {
            // URL에서 job ID 추출
            const linkElement = card.querySelector('a[href^="/jobs/P-"]');
            const href = linkElement?.getAttribute('href') || '';
            const jobId = href.match(/P-(\d+)/)?.[1] || '';

            const job: KakaoJobData = {
              id: jobId,
              title: card.querySelector('h4.tit_jobs')?.textContent?.trim() || '',
              department: '', // 부서 정보는 별도로 추출
              field: '', // 분야 정보는 태그에서 추출
              career: card.querySelector('dl.list_info dd')?.textContent?.trim() || '',
              employmentType: card.querySelector('dl.item_subinfo dd:first-child')?.textContent?.trim() || '',
              location: card.querySelector('dl.item_subinfo dd:last-child')?.textContent?.trim() || '',
              period: {
                start: '',
                end: '',  // 기간 정보는 별도로 처리
              },
              url: href ? new URL(href, 'https://careers.kakao.com').toString() : '',
              requirements: [],
              preferences: [],
              description: '',
              benefits: [],
            };

            // 태그 정보 추출
            const tags = card.querySelectorAll('div.list_tag span.link_tag');
            tags.forEach(tag => {
              const tagText = tag.textContent?.trim() || '';
              if (tagText.includes('개발')) {
                job.field = tagText;
              }
            });

            // 부서 정보 추출 (태그 정보에서)
            const departmentTag = Array.from(tags).find(tag => 
              tag.textContent?.includes('서비스') || 
              tag.textContent?.includes('플랫폼') ||
              tag.textContent?.includes('인프라')
            );
            if (departmentTag) {
              job.department = departmentTag.textContent?.trim() || '';
            }

            jobs.push(job);
          } catch (error) {
            console.error('Error extracting job card:', error);
          }
        });

        return jobs;
      });

      this.logger.debug(`Successfully extracted ${jobListings.length} job listings`);
      if (jobListings.length > 0) {
        this.logger.debug('Sample job listing:', JSON.stringify(jobListings[0], null, 2));
      }

      return jobListings;
    } catch (error) {
      this.logger.error('Error in extractJobListings:', error);
      throw error;
    }
  }

  private async transformJobData(jobs: KakaoJobData[]): Promise<JobPosting[]> {
    this.logger.debug(`Starting job data transformation for ${jobs.length} jobs`);
    
    return jobs.map((job) => {
      try {
        const template = this.createJobPostingTemplate();
        
        // 경력 타입 매핑
        let career: CareerType = CAREER_TYPE.ANY;
        if (job.career.includes('신입')) {
          career = CAREER_TYPE.NEW;
        } else if (job.career.includes('경력')) {
          career = CAREER_TYPE.EXPERIENCED;
        }

        // 위치 매핑
        let location: LocationType = LOCATION_TYPE.SEOUL;  // 기본값
        if (job.location.includes('판교')) {
          location = LOCATION_TYPE.BUNDANG;
        } else if (job.location.includes('춘천')) {
          location = LOCATION_TYPE.CHUNCHEON;
        } else if (job.location.includes('세종')) {
          location = LOCATION_TYPE.SEJONG;
        }
        
        const posting: JobPosting = {
          ...template,
          id: job.id,
          title: job.title,
          company: this.company,
          department: job.department,
          field: job.field,
          requirements: {
            ...template.requirements,
            career: career,
            skills: job.skills || []
          },
          employmentType: EMPLOYMENT_TYPE.FULL_TIME,
          locations: [location],
          url: job.url,
          period: {
            start: new Date(),
            end: this.getDateMonthLater(1),
          },
          source: {
            originalId: job.id,
            originalUrl: job.url,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return posting;
      } catch (error) {
        this.logger.error('Error transforming job data:', error);
        throw error;
      }
    });
  }

  private async fetchJobDetail(jobId: string): Promise<any> {
    try {
      const page = await this.browserService.createPage();
      if (!page) {
        console.error(`Failed to create page for job ${jobId}`);
        return null;
      }

      await page.goto(`https://careers.kakao.com/jobs/P-${jobId}`, {
        waitUntil: 'networkidle0',
      });

      const jobData = await page.evaluate(() => {
        const script = document.querySelector('script#__NEXT_DATA__');
        if (!script) return null;
        
        const data = JSON.parse(script.textContent || '{}');
        const jobData = data.props?.pageProps?.jobData || null;

        // Extract skills from tech tags
        const skills = new Set<string>();
        document.querySelectorAll('.link_tag.cursor_hand').forEach((tag) => {
          const text = tag.textContent?.trim();
          if (text && text.length > 1 && !text.includes('직무')) {
            skills.add(text);
          }
        });

        // Extract skills from job requirements
        if (jobData?.qualification) {
          const requirements = jobData.qualification.split('<br/>');
          requirements.forEach(req => {
            const matches = req.match(/[A-Za-z0-9+#]+/g);
            if (matches) {
              matches.forEach(skill => {
                if (skill.length > 1 && !['the', 'and', 'or', 'in', 'on', 'at', 'to', 'for'].includes(skill.toLowerCase())) {
                  skills.add(skill);
                }
              });
            }
          });
        }

        if (jobData) {
          jobData.skills = Array.from(skills);
        }

        return jobData;
      });

      await page.close();
      return jobData;
    } catch (error) {
      console.error(`Error fetching job detail for ${jobId}:`, error);
      return null;
    }
  }

  private async parseJobData(job: any): Promise<JobDto> {
    const jobData = await this.fetchJobDetail(job.jobIdx);
    const skills = jobData?.skills || [];

    const startDate = jobData?.regDate ? new Date(jobData.regDate) : new Date();
    const endDate = jobData?.endDate ? new Date(jobData.endDate) : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      id: job.jobIdx.toString(),
      company: 'KAKAO',
      title: job.jobOfferTitle,
      department: '테크',
      field: job.jobPartName || '기타',
      requirements: {
        career: job.careerType === 'NEW' ? '신입' : job.careerType === 'ANY' ? '무관' : '경력',
        skills,
      },
      employmentType: '정규',
      locations: [job.location || '분당'],
      period: {
        start: startDate,
        end: endDate,
      },
      url: `https://careers.kakao.com/jobs/P-${job.jobIdx}`,
      source: {
        originalId: job.jobIdx.toString(),
        originalUrl: `https://careers.kakao.com/jobs/P-${job.jobIdx}`,
      },
      createdAt: startDate,
      updatedAt: new Date(),
      tags: [],
    };
  }
} 