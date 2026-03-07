export interface KakaoJobData {
  /**
   * 채용 공고 ID
   */
  id: string;

  /**
   * 채용 공고 제목
   */
  title: string;

  /**
   * 채용 조직 (부서)
   */
  department: string;

  /**
   * 채용 분야
   */
  field: string;

  /**
   * 경력 요구사항
   */
  career: string;

  /**
   * 고용 형태
   */
  employmentType: string;

  /**
   * 근무 위치
   */
  location: string;

  /**
   * 채용 기간
   */
  period: {
    start: string;
    end: string;
  };

  /**
   * 상세 페이지 URL
   */
  url: string;

  /**
   * 기술 스택 및 자격 요건
   */
  requirements: string[];

  /**
   * 우대사항
   */
  preferences: string[];

  /**
   * 직무 설명
   */
  description: string;

  /**
   * 복리후생
   */
  benefits: string[];

  /**
   * 기술 스택
   */
  skills?: string[];
}
