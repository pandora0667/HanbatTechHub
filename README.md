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

## API 엔드포인트

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
├── modules/              # 도메인별 모듈
│   ├── notice/           # 공지사항 관련 모듈
│   │   ├── constants/    # 상수 정의
│   │   ├── dto/          # 데이터 전송 객체
│   │   ├── interfaces/   # 인터페이스 정의
│   │   ├── notice.controller.ts
│   │   ├── notice.service.ts
│   │   └── notice.module.ts
│   │
│   ├── menu/             # 식단 관련 모듈
│       ├── dto/          # 데이터 전송 객체
│       ├── menu.controller.ts
│       ├── menu.service.ts
│       └── menu.module.ts
│
├── app.module.ts         # 메인 모듈
└── main.ts               # 애플리케이션 진입점
```

## 확장 계획

HanbatTechHub(테크누리)는 한밭대학교 모바일융합공학과와 와이소프트 학생들을 위한 프로젝트로 시작되었으며, 추후 다양한 IT 관련 소식을 통합 제공할 예정입니다.

## 라이센스

MIT
