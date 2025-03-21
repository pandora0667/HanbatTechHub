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
import * as cheerio from 'cheerio';

@Injectable()
export class TossCrawler extends BaseJobCrawler {
  protected readonly logger = new Logger(TossCrawler.name);
  public readonly baseUrl = 'https://toss.im/career/jobs';

  constructor(
    protected readonly httpClient: HttpClientUtil,
    protected readonly configService: ConfigService,
  ) {
    super(COMPANY_ENUM.TOSS, httpClient, 'https://toss.im/career/jobs');
  }

  async fetchJobs(query?: GetJobsQueryDto): Promise<JobPosting[]> {
    try {
      const url = this.buildUrl(query);
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle0' });

      // 직군 필터링
      await page.evaluate(() => {
        const categories = [
          'Backend',
          'Frontend',
          'Infra',
          'QA',
          'Full Stack',
          'App',
          'Engineering',
        ];
        // TODO: 필터링 로직 구현
      });

      const html = await page.content();
      await browser.close();

      return this.parseJobListings(html);
    } catch (err) {
      this.handleError('Failed to fetch jobs', err);
      return [];
    }
  }

  private buildUrl(query?: GetJobsQueryDto): string {
    const params = new URLSearchParams({
      category: 'Backend,Frontend,Infra,QA,Full Stack,App,Engineering',
    });

    return `${this.baseUrl}?${params.toString()}`;
  }

  private parseJobListings(html: string): JobPosting[] {
    try {
      const $ = cheerio.load(html);
      const jobs: JobPosting[] = [];

      // 토스 채용 페이지의 직무 목록 파싱
      $('div[href^="/career/job-detail"]').each((_, element) => {
        try {
          const $item = $(element);
          const href = $item.attr('href') || '';
          const id = href.split('job_id=')[1] || '';
          
          // 제목 파싱
          const $titleDiv = $item.find('div[class*="css-17tyauz"]');
          const title = $titleDiv.find('span[class*="typography--bold"]').text().trim();
          const subTitle = $titleDiv.find('span[class*="typography--regular"]').text().trim();
          
          // 정보 파싱
          const $infoDiv = $item.find('div[class*="css-84449y"]');
          const info = $infoDiv.text().trim();
          
          // 정보를 파싱합니다
          const infoParts = info.split('・').map(part => part.trim()).filter(Boolean);
          
          // 기술 스택 파싱
          const techStack = new Set<string>();
          const fullText = [title, subTitle, info].join(' ');
          
          if (fullText.includes('TypeScript')) techStack.add('TypeScript');
          if (fullText.includes('JavaScript')) techStack.add('JavaScript');
          if (fullText.includes('Python')) techStack.add('Python');
          if (fullText.includes('Java') && !fullText.includes('JavaScript')) techStack.add('Java');
          if (fullText.includes('Kotlin')) techStack.add('Kotlin');
          if (fullText.includes('Swift')) techStack.add('Swift');
          if (fullText.includes('React')) techStack.add('React');
          if (fullText.includes('Node.js')) techStack.add('Node.js');
          if (fullText.includes('Django')) techStack.add('Django');
          if (fullText.includes('Spring')) techStack.add('Spring');
          if (fullText.includes('Next.js')) techStack.add('Next.js');
          if (fullText.includes('Nest.js')) techStack.add('Nest.js');
          if (fullText.includes('Kubernetes')) techStack.add('Kubernetes');
          if (fullText.includes('Docker')) techStack.add('Docker');
          if (fullText.includes('AWS')) techStack.add('AWS');
          if (fullText.includes('GCP')) techStack.add('GCP');
          if (fullText.includes('Azure')) techStack.add('Azure');
          if (fullText.includes('CI/CD')) techStack.add('CI/CD');
          if (fullText.includes('Jenkins')) techStack.add('Jenkins');
          if (fullText.includes('Terraform')) techStack.add('Terraform');
          if (fullText.includes('Ansible')) techStack.add('Ansible');
          if (fullText.includes('Linux')) techStack.add('Linux');
          if (fullText.includes('Windows')) techStack.add('Windows');
          if (fullText.includes('Network')) techStack.add('Network');
          if (fullText.includes('Security')) techStack.add('Security');
          if (fullText.includes('IDC')) techStack.add('IDC');
          if (fullText.includes('Datacenter')) techStack.add('Datacenter');
          if (fullText.includes('RDBMS')) techStack.add('RDBMS');

          const rawTitle = `${title} ${subTitle}`;
          const cleanedTitle = this.cleanTitle(rawTitle);

          this.logger.debug(`Found job: ${cleanedTitle} | ${infoParts.join(' | ')} | ${id}`);
          
          // 기술 직군 필터링
          if (
            fullText.includes('개발') ||
            fullText.includes('엔지니어') ||
            fullText.includes('Developer') ||
            fullText.includes('Engineer') ||
            fullText.includes('프론트엔드') ||
            fullText.includes('백엔드') ||
            fullText.includes('인프라') ||
            fullText.includes('보안') ||
            fullText.includes('네트워크')
          ) {
            const jobTemplate = this.createJobPostingTemplate();
            const job: JobPosting = {
              ...jobTemplate,
              id,
              title: cleanedTitle,
              company: this.extractCompany(fullText),
              department: this.extractDepartment(fullText),
              field: this.extractField(fullText),
              requirements: {
                ...jobTemplate.requirements,
                career: CAREER_TYPE.ANY,
                skills: Array.from(techStack),
              },
              employmentType: this.extractEmploymentType(fullText),
              locations: [LOCATION_TYPE.SEOUL],
              period: {
                start: new Date(),
                end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
              url: this.getJobDetailUrl(id),
              source: {
                originalId: id,
                originalUrl: this.getJobDetailUrl(id),
              },
              jobCategory: this.extractJobCategory(fullText),
            } as JobPosting;

            if (this.validateJob(job)) {
              jobs.push(job);
            }
          }
        } catch (err) {
          this.logger.warn(`Failed to parse job: ${err.message}`);
        }
      });

      this.logger.debug(`Parsed ${jobs.length} jobs from ${this.company}`);
      return jobs;
    } catch (err) {
      this.handleError('Failed to parse job listings', err);
      return [];
    }
  }

  private cleanTitle(title: string): string {
    // 불필요한 문자 제거
    let cleanedTitle = title
      .replace(/・/g, '') // 불필요한 구분자 제거
      .replace(/\s+/g, ' ') // 연속된 공백을 하나로
      .trim();

    // 중복된 단어 제거 (대소문자 구분 없이)
    const words = cleanedTitle.split(' ');
    const seen = new Set<string>();
    const uniqueWords = words.filter(word => {
      const lowerWord = word.toLowerCase();
      if (seen.has(lowerWord)) {
        return false;
      }
      seen.add(lowerWord);
      return true;
    });

    // 기술 스택을 requirements로 이동하고 제목에서는 제거
    const techKeywords = [
      'TypeScript',
      'JavaScript',
      'Python',
      'Java',
      'Kotlin',
      'Swift',
      'React',
      'Node.js',
      'Django',
      'Spring',
      'Next.js',
      'Nest.js',
      'Kubernetes',
      'Docker',
      'AWS',
      'GCP',
      'Azure',
      'CI/CD',
      'Jenkins',
      'Terraform',
      'Ansible',
      'Linux',
      'Windows',
      'Network',
      'Security',
      'IDC',
      'Datacenter',
      'RDBMS'
    ];

    // 제목에서 기술 스택 제거 (단, 직무명에 포함된 경우는 유지)
    const finalWords = uniqueWords.filter(word => {
      // Frontend Developer, Backend Developer 등의 직무명은 유지
      if (word.includes('Developer') || word.includes('Engineer')) {
        return true;
      }
      // 그 외 기술 스택은 제거
      return !techKeywords.some(tech => 
        word.toLowerCase() === tech.toLowerCase() ||
        word.toLowerCase().includes(tech.toLowerCase())
      );
    });

    // 괄호 안의 내용 정리
    let result = finalWords.join(' ');
    result = result.replace(/\(\s*([^)]+)\s*\)/g, '($1)'); // 괄호 안 공백 정리
    result = result.replace(/\s*\(\s*/g, ' ('); // 괄호 앞 공백 정리
    result = result.replace(/\s*\)/g, ')'); // 괄호 뒤 공백 정리

    return result.trim();
  }

  private extractDepartment(fullText: string): string {
    if (fullText.includes('Frontend') || fullText.includes('프론트엔드')) return 'Frontend';
    if (fullText.includes('Backend') || fullText.includes('백엔드')) return 'Backend';
    if (fullText.includes('Data') || fullText.includes('데이터')) return 'Data';
    if (fullText.includes('Security') || fullText.includes('보안')) return 'Security';
    if (fullText.includes('DevOps') || fullText.includes('SRE') || fullText.includes('인프라')) return 'Infrastructure';
    if (fullText.includes('QA')) return 'QA';
    if (fullText.includes('Android')) return 'Mobile';
    if (fullText.includes('iOS')) return 'Mobile';
    return 'Engineering';
  }

  private extractField(fullText: string): string {
    return this.extractDepartment(fullText);
  }

  private extractCompany(fullText: string): string {
    const companies = [
      '토스뱅크',
      '토스페이먼츠',
      '토스증권',
      '토스인슈어런스',
      '토스씨엑스',
      '토스플레이스',
      '토스인컴',
      '토스인사이트',
      '토스'
    ];

    for (const company of companies) {
      if (fullText.includes(company)) {
        return company;
      }
    }

    return '토스';
  }

  private extractEmploymentType(fullText: string): string {
    if (fullText.includes('단기계약직')) return EMPLOYMENT_TYPE.CONTRACT;
    if (fullText.includes('계약직')) return EMPLOYMENT_TYPE.CONTRACT;
    if (fullText.includes('인턴')) return EMPLOYMENT_TYPE.INTERN;
    return EMPLOYMENT_TYPE.FULL_TIME;
  }

  private extractJobCategory(fullText: string): string {
    return this.extractDepartment(fullText);
  }

  getJobDetailUrl(jobId: string): string {
    return `${this.baseUrl}/job-detail?job_id=${jobId}`;
  }

  private mapEmploymentType(type: string): string {
    if (type.includes('정규')) return EMPLOYMENT_TYPE.FULL_TIME;
    if (type.includes('계약')) return EMPLOYMENT_TYPE.CONTRACT;
    if (type.includes('인턴')) return EMPLOYMENT_TYPE.INTERN;
    return EMPLOYMENT_TYPE.FULL_TIME;
  }

  private mapLocationType(location: string): string {
    if (location.includes('서울')) return LOCATION_TYPE.SEOUL;
    if (location.includes('분당')) return LOCATION_TYPE.BUNDANG;
    if (location.includes('춘천')) return LOCATION_TYPE.CHUNCHEON;
    if (location.includes('세종')) return LOCATION_TYPE.SEJONG;
    if (location.includes('부산')) return LOCATION_TYPE.BUSAN;
    if (location.includes('글로벌')) return LOCATION_TYPE.GLOBAL;
    return LOCATION_TYPE.OTHER;
  }
} 