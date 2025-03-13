# HanbatTechHub (테크누리)

한밭대학교 모바일융합공학과를 위한 통합 정보 API 서비스입니다. 대학 공지사항과 IT 관련 다양한 소식을 단일 API에서 제공합니다.

## 기능

- 한밭대학교 모바일융합공학과 공지사항 목록 조회
- 새로운 공지사항 필터링
- 고정 공지사항 필터링
- 오늘 등록된 공지사항 조회
- 공지사항 상세 정보 조회 (첨부파일 포함)
- 특정 날짜의 식단 정보 조회 (점심/저녁)
- 일주일 간의 식단 정보 조회
- 주요 IT 기업 기술 블로그 포스트 조회
  - 무신사, 네이버 D2, 토스, 뱅크샐러드, 긱뉴스
  - 메타, 넷플릭스, 구글, 아마존, 마켓컬리, 카카오엔터프라이즈
- API 서비스 상태 모니터링 (health check)

## 개발 환경

- Node.js: 22.x
- Nest.js
- Cheerio: 웹 스크래핑
- Axios: HTTP 요청
- Swagger: API 문서화

## 설치 및 실행

```bash
# 패키지 설치
$ pnpm install

# 개발 모드 실행
$ pnpm run dev

# 또는
$ pnpm run start:dev

# 배포 모드 실행
$ pnpm run start:prod
```

## Docker 환경

```bash
# Docker 이미지 빌드
$ pnpm run docker:build

# Docker 컨테이너 시작
$ pnpm run docker:start

# Docker 컨테이너 중지
$ pnpm run docker:stop

# Docker 컨테이너 로그 보기
$ pnpm run docker:logs
```

## API 엔드포인트

### 상태 확인 (Health Check) API

- `GET /health` - API 서비스 상태 확인
  - 응답: 서비스 상태 정보 (메모리, 디스크, API 엔드포인트 상태 등)
  - 예시: `curl -X GET "http://localhost:3000/health"`
  - 응답 예시:
  ```json
  {
    "status": "ok",
    "info": {
      "memory_heap": { "status": "up" },
      "memory_rss": { "status": "up" },
      "disk": { "status": "up" },
      "notices_api": { "status": "up" },
      "menus_api": { "status": "up" },
      "blogs_api": { "status": "up" },
      "blog_companies_api": { "status": "up" }
    },
    "error": {},
    "details": {
      "memory_heap": { "status": "up" },
      "memory_rss": { "status": "up" },
      "disk": { "status": "up" },
      "notices_api": { "status": "up" },
      "menus_api": { "status": "up" },
      "blogs_api": { "status": "up" },
      "blog_companies_api": { "status": "up" }
    }
  }
  ```

### 공지사항 API

- `GET /api/v1/notices` - 일반 공지사항 목록 조회
  - 응답: 일반 공지사항 목록 (no가 "공지"가 아닌 항목)
  - 예시: `curl -X GET "http://localhost:3000/api/v1/notices"`

- `GET /api/v1/notices/new` - 새로운 공지사항 목록 조회
  - 응답: 새로운 공지사항 목록 (isNew가 true인 항목)
  - 예시: `curl -X GET "http://localhost:3000/api/v1/notices/new"`

- `GET /api/v1/notices/featured` - 고정 공지사항 목록 조회
  - 응답: 고정 공지사항 목록 (no가 "공지"인 항목)
  - 예시: `curl -X GET "http://localhost:3000/api/v1/notices/featured"`

- `GET /api/v1/notices/today` - 오늘 등록된 공지사항 목록 조회
  - 응답: 오늘 날짜에 등록된 공지사항 목록 (no가 숫자인 항목만)
  - 예시: `curl -X GET "http://localhost:3000/api/v1/notices/today"`

- `GET /api/v1/notices/:id` - 공지사항 상세 정보 조회
  - 파라미터: `id` (공지사항 ID)
  - 응답: 공지사항 상세 정보 (제목, 내용, 작성자, 날짜, 조회수, 첨부파일 등)
  - 예시: `curl -X GET "http://localhost:3000/api/v1/notices/B000000153965Ac8bR9y"`

### 식단 API

- `GET /api/v1/menus` - 특정 날짜의 식단 조회 (기본값: 오늘)
  - 쿼리 파라미터: `date` (YYYY-MM-DD 형식, 선택사항)
  - 예시: `curl -X GET "http://localhost:3000/api/v1/menus?date=2025-03-15"`

- `GET /api/v1/menus/weekly` - 일주일 간의 식단 조회
  - 쿼리 파라미터: `date` (시작 날짜, YYYY-MM-DD 형식, 선택사항)
  - 예시: `curl -X GET "http://localhost:3000/api/v1/menus/weekly?date=2025-03-15"`

### 기술 블로그 API

- `GET /api/v1/blogs/companies` - 지원하는 기업 목록 조회
  - 응답: 기술 블로그를 제공하는 기업 목록
  - 예시: `curl -X GET "http://localhost:3000/api/v1/blogs/companies"`
  - 기본 응답: 전체 기업 목록 (페이지네이션 없음)

- `GET /api/v1/blogs` - 전체 기업의 기술 블로그 포스트 조회
  - 쿼리 파라미터:
    - `page`: 페이지 번호 (기본값: 1)
    - `limit`: 페이지당 항목 수 (기본값: 10)
  - 예시: `curl -X GET "http://localhost:3000/api/v1/blogs?page=1&limit=3"`
  - 기본 응답: 최신순으로 정렬된 10개의 포스트
  - 정렬 기준: 작성일 기준 내림차순 (최신순)


- `GET /api/v1/blogs/companies/:companyId` - 특정 기업의 기술 블로그 포스트 조회
  - 파라미터: `companyId` (기업 ID, 예: MUSINSA, NAVER_D2, TOSS 등)
  - 쿼리 파라미터:
    - `page`: 페이지 번호 (기본값: 1)
    - `limit`: 페이지당 항목 수 (기본값: 10)
  - 예시: `curl -X GET "http://localhost:3000/api/v1/blogs/companies/MUSINSA?page=1&limit=3"`
  - 기본 응답: 해당 기업의 최신순 10개 포스트
  - 정렬 기준: 작성일 기준 내림차순 (최신순)

### 페이지네이션 정보

모든 페이지네이션이 적용된 API는 다음과 같은 메타 정보를 포함합니다:
- `totalCount`: 전체 아이템 수
- `currentPage`: 현재 페이지 번호
- `totalPages`: 전체 페이지 수
- `hasNextPage`: 다음 페이지 존재 여부
- `hasPreviousPage`: 이전 페이지 존재 여부

### 기술 블로그 응답 형식

```json
{
  "items": [
    {
      "title": "GitHub Copilot 도입 후기",
      "link": "https://example.com/post/1",
      "date": "2024-03-15",
      "company": "MUSINSA",
      "description": "GitHub Copilot을 도입하고 경험한 개발 생산성 향상에 대한 이야기"
    }
    // ... 추가 항목
  ],
  "meta": {
    "totalCount": 98,
    "currentPage": 1,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### 에러 응답

잘못된 요청이나 서버 오류 발생 시 다음과 같은 형식으로 응답합니다:

```json
{
  "statusCode": 400,
  "message": "Invalid page number",
  "error": "Bad Request"
}
```

주요 에러 코드:
- `400`: 잘못된 요청 (페이지 번호나 limit이 유효하지 않은 경우)
- `404`: 리소스를 찾을 수 없음 (존재하지 않는 기업 ID 등)
- `429`: 요청이 너무 많음 (Rate limit 초과)
- `500`: 서버 내부 오류

## 응답 형식

### 공지사항 목록 응답

```json
{
  "items": [
    {
      "no": "585",
      "title": "[2,3,4학년] 2025년 상반기 연구실 정기 안전교육 실시 안내",
      "author": "모바일융합공학과",
      "viewCount": 56,
      "date": "2025-03-11",
      "link": "https://www.hanbat.ac.kr/bbs/BBSMSTR_000000001001/view.do?nttId=B000000153965Ac8bR9y",
      "hasAttachment": true,
      "isNew": true,
      "nttId": "B000000153965Ac8bR9y"
    },
    // ... 추가 항목
  ],
  "totalCount": 19,
  "currentPage": 1,
  "totalPages": 1
}
```

### 공지사항 상세 정보 응답

```json
{
  "title": "[2,3,4학년] 2025년 상반기 연구실 정기 안전교육 실시 안내",
  "content": "안전교육 실시 계획을 아래와 같이 안내합니다...",
  "author": "모바일융합공학과",
  "date": "2025-03-11",
  "viewCount": 56,
  "attachments": [
    {
      "name": "1. 2025년 상반기 연구실 정기 안전교육 실시 계획.hwp",
      "link": "https://www.hanbat.ac.kr/cmm/fms/FileDown.do?atchFileId=FILE_000000167672Le0&fileSn=0"
    }
    // ... 추가 첨부파일
  ]
}
```

## 개발자 문서

API 문서는 애플리케이션이 실행된 후 다음 URL에서 확인할 수 있습니다:
http://localhost:3000/api-docs

## 기술 스택

- **Backend**: Nest.js
- **데이터 추출**: Cheerio, Axios
- **API 문서화**: Swagger
- **환경 설정**: dotenv
- **보안**: helmet
- **유효성 검사**: class-validator, class-transformer

## 프로젝트 구조

```
src/
├── main.ts                # 애플리케이션 진입점
├── app.module.ts          # 메인 모듈
├── app.controller.ts      # 메인 컨트롤러
├── app.service.ts         # 메인 서비스
├── common/                # 공통 유틸리티, 상수 등
├── config/                # 환경 설정 관련 파일
│   
└── modules/               # 도메인별 모듈
    ├── notice/            # 공지사항 관련 모듈
    │   ├── constants/     # 상수 정의
    │   ├── dto/           # 데이터 전송 객체
    │   ├── interfaces/    # 인터페이스 정의
    │   ├── notice.controller.ts
    │   ├── notice.service.ts
    │   └── notice.module.ts
    │
    ├── menu/              # 식단 관련 모듈
    │   ├── dto/           # 데이터 전송 객체
    │   ├── menu.controller.ts
    │   ├── menu.service.ts
    │   └── menu.module.ts
    │
    ├── blog/              # 기술 블로그 관련 모듈
    │   ├── dto/           # 데이터 전송 객체
    │   ├── interfaces/    # 인터페이스 정의
    │   ├── blog.controller.ts
    │   ├── blog.service.ts
    │   └── blog.module.ts
    │
    ├── health/            # 시스템 상태 모니터링 모듈
    │   ├── health.controller.ts
    │   └── health.module.ts
    │
    └── translation/       # 번역 관련 모듈
        ├── dto/           # 데이터 전송 객체
        ├── translation.controller.ts
        ├── translation.service.ts
        └── translation.module.ts
```

## 확장 계획

HanbatTechHub(테크누리)는 한밭대학교 모바일융합공학과와 와이소프트 학생들을 위한 프로젝트로 시작되었으며, 추후 다양한 IT 관련 소식을 통합 제공할 예정입니다.

## 라이센스

MIT
