# National University Institution Registry

## Purpose

This document defines the first nationwide `Institution Intelligence` rollout pool for the standalone snapshot terminal.

The goal is not to crawl every board of every university. The goal is to define:

- the active institution rollout pool
- the public service surfaces worth ingesting
- the site-family based adapter strategy
- the pilot schools for the first implementation wave

## Scope

This registry is the **phase-1 general national university pool** for Korea.

- Base pool: national universities listed by the National University Development Project Council
- Additional active institutions: Seoul National University, Incheon National University
- Excluded for now: special-law institutions and separate rollout pools such as KAIST, GIST, DGIST, UNIST, police or military academies

### Counting Rule

The council participation page currently exposes 38 rows, including `한국복지대학교`.  
For the current rollout pool, `한국복지대학교` is treated as a legacy campus because it was integrated into `한경국립대학교` on **March 1, 2023**.  
So the active phase-1 pool is:

- 37 active council schools
- plus 2 national university corporations
- equals **39 active institutions**

## Institution Intelligence Model

Institution data should be normalized into these service domains:

- `Institution Core`
  - official site, portal, campus metadata, site family
- `Institution Academic`
  - academic notices, academic calendar, registration, leave/return, graduation or licensure timelines
- `Institution Opportunity`
  - scholarships, career center programs, job fairs, field practice, internships, extracurricular programs, mentoring, startup programs, global programs
- `Institution Support`
  - counseling, disability support, welfare, crisis support, foreign student support
- `Institution Life`
  - dormitory, meal, transportation, library, health center, convenience facilities
- `Institution Signals`
  - new notice, 모집 시작, deadline approaching, changed notice, result announcement

## Public Service Types To Prioritize

Across national universities, the highest-value common surfaces are:

1. scholarships
2. career center and university job-plus center programs
3. field practice and internship programs
4. extracurricular and competency programs
5. academic notices and academic calendar
6. startup and contests
7. international exchange and language programs
8. counseling and welfare support
9. dormitory
10. cafeteria

This order should drive adapter implementation.

## Site Family Taxonomy

These are preliminary adapter families based on the official homepage entrypoints and observed public URL patterns.

| Family | Signals | Adapter Strategy |
| --- | --- | --- |
| `k2web-family` | `/sites/.../index.do`, `bbs/.../artclView.do`, `download.do` | Build a shared board/article parser with service-type configuration. |
| `do-portal` | `Main.do`, `main.do`, `index.do` without clear K2Web markers | Build menu and board adapters per site map, but reuse common `.do` navigation extraction. |
| `action-cms` | `.action`, `wbbs` | Legacy action-based crawler and board parser. |
| `jsp-portal` | `.jsp` | JSP-specific nav and section extraction. |
| `aspnet-portal` | `.aspx` | ASP.NET form and public board parser. |
| `mbz-portal` | `.mbz` | Special-case adapter. |
| `9is-portal` | `.9is` | Special-case adapter. |
| `html-portal` / `static-html-portal` | `.html`, `/html/` | Static public sitemap and menu scraper. |
| `custom-root` | root homepage without stable family markers | Manual spike required before adapter assignment. |

## Pilot Schools

The first implementation wave should maximize:

- user value
- site-family coverage
- institution-type coverage
- reuse potential for later adapters

### Recommended Wave-1 Pilot Institutions

| Institution | Why It Is In Wave 1 | Public Surfaces Seen on Official Site | Preliminary Family |
| --- | --- | --- | --- |
| 국립한밭대학교 | existing production context, direct migration target | notices, meal, academic, campus support | `custom-root` |
| 강원대학교 | flagship national university with strong student-facing main services | scholarship, career info, IPP, meal, dormitory, international exchange, academic calendar | `html-portal` |
| 서울과학기술대학교 | strong career and field-practice surfaces, high student utility | scholarship, career, field practice, extracurricular, counseling, startup, dormitory, library, academic calendar | `jsp-portal` |
| 국립한국해양대학교 | high-quality opportunity and competency surfaces | student growth support, recruitment info, recommendation recruitment, mentoring, competency services | `do-portal` |
| 경인교육대학교 | teacher-training specific model | scholarship, employment, mentoring, disability support, teacher pathway | `do-portal` |
| 서울대학교 | national university corporation and multi-domain model | academic support, extracurricular, global programs, scholarship, dormitory, research-linked programs | `custom-root` |
| 인천대학교 | national university corporation and K2Web-heavy ecosystem candidate | career center, field practice, extracurricular, uni-point, scholarship, public board network | `custom-root` |
| 국립한국방송통신대학교 | non-residential student model and distance-learning edge case | academic life guide, scholarship, counseling, mentoring, licensure or exam support | `do-portal` |

### Pilot Outcome

If these 8 institutions are covered well, the product will have:

- 4 major site-family signals
- 4 institution types
- enough coverage to define reusable institution adapters

## Active Phase-1 Institution Registry

| Region | Type | Institution | Official Entry | Preliminary Family |
| --- | --- | --- | --- | --- |
| 수도·강원권 | 국가거점대 | 강원대학교 | https://www.kangwon.ac.kr/intro/intro_10.html | html-portal |
| 영남권 | 국가거점대 | 경북대학교 | https://www.knu.ac.kr/wbbs/wbbs/main/main.action | action-cms |
| 영남권 | 국가중심대 | 경상국립대학교 | https://www.gnu.ac.kr/main/main.do | do-portal |
| 수도·강원권 | 교원양성대 | 경인교육대학교 | https://www.ginue.ac.kr/kor/Main.do | do-portal |
| 충청권 | 교원양성대 | 공주교육대학교 | https://www.gjue.ac.kr/html/kor/index.html | static-html-portal |
| 호남·제주권 | 교원양성대 | 광주교육대학교 | https://www.gnue.ac.kr/index.9is | 9is-portal |
| 수도·강원권 | 국가중심대 | 국립강릉원주대학교 | https://www.gwnu.ac.kr/sites/kr/index.do | k2web-family |
| 영남권 | 국가중심대 | 국립경국대학교 | https://www.gknu.ac.kr/ | custom-root |
| 충청권 | 국가중심대 | 국립공주대학교 | https://www.kongju.ac.kr/kongju/index.do | do-portal |
| 호남·제주권 | 국가중심대 | 국립군산대학교 | https://www.kunsan.ac.kr/index.kunsan?contentsSid=4714&sso=ok | custom-root |
| 영남권 | 국가중심대 | 국립금오공과대학교 | https://www.kumoh.ac.kr/ko/index.do | do-portal |
| 호남·제주권 | 국가중심대 | 국립목포대학교 | https://www.mokpo.ac.kr/index.9is | 9is-portal |
| 호남·제주권 | 국가중심대 | 국립목포해양대학교 | https://www.mmu.ac.kr/main | custom-root |
| 영남권 | 국가중심대 | 국립부경대학교 | https://www.pknu.ac.kr/main | custom-root |
| 호남·제주권 | 국가중심대 | 국립순천대학교 | https://www.scnu.ac.kr/SCNU/main.do | do-portal |
| 영남권 | 국가중심대 | 국립창원대학교 | https://www.changwon.ac.kr/kor/main.do | do-portal |
| 충청권 | 국가중심대 | 국립한국교통대학교 | https://www.ut.ac.kr/ | custom-root |
| 수도·강원권 | 국가중심대 | 국립한국방송통신대학교 | https://www.knou.ac.kr/knou/index.do?epTicket=LOG | do-portal |
| 영남권 | 국가중심대 | 국립한국해양대학교 | https://www.kmou.ac.kr/kmou/main.do | do-portal |
| 충청권 | 국가중심대 | 국립한밭대학교 | https://www.hanbat.ac.kr/ | custom-root |
| 영남권 | 교원양성대 | 대구교육대학교 | https://www.dnue.ac.kr/kor/Main.do | do-portal |
| 영남권 | 교원양성대 | 부산교육대학교 | https://www.bnue.ac.kr/Home/Main.mbz | mbz-portal |
| 영남권 | 국가거점대 | 부산대학교 | https://www.pusan.ac.kr/kor/Main.do | do-portal |
| 수도·강원권 | 국가중심대 | 서울과학기술대학교 | https://www.seoultech.ac.kr/index.jsp | jsp-portal |
| 수도·강원권 | 교원양성대 | 서울교육대학교 | https://www.snue.ac.kr/snue/main.do | do-portal |
| 호남·제주권 | 국가거점대 | 전남대학교 | https://www.jnu.ac.kr/jnumain.aspx | aspnet-portal |
| 호남·제주권 | 국가거점대 | 전북대학교 | https://www.jbnu.ac.kr/kor/ | custom-root |
| 호남·제주권 | 교원양성대 | 전주교육대학교 | https://www.jnue.kr/ | custom-root |
| 호남·제주권 | 국가거점대 | 제주대학교 | https://www.jejunu.ac.kr/ | custom-root |
| 영남권 | 교원양성대 | 진주교육대학교 | https://www.cue.ac.kr/kor/Main.do | do-portal |
| 충청권 | 교원양성대 | 청주교육대학교 | https://www.cje.ac.kr/ | custom-root |
| 수도·강원권 | 교원양성대 | 춘천교육대학교 | https://www.cnue.ac.kr/cnue/index.do | do-portal |
| 충청권 | 국가거점대 | 충남대학교 | https://plus.cnu.ac.kr/html/kr/ | custom-root |
| 충청권 | 국가거점대 | 충북대학교 | https://www.chungbuk.ac.kr/site/www/main.do | do-portal |
| 수도·강원권 | 국가중심대 | 한경국립대학교 | https://www.hknu.ac.kr/sites/kor/index.do | k2web-family |
| 충청권 | 교원양성대 | 한국교원대학교 | https://knue.ac.kr/smain.html | html-portal |
| 수도·강원권 | 국가중심대 | 한국체육대학교 | https://www.knsu.ac.kr/knsu/index.do | do-portal |
| 수도권 | 국립대학법인 | 서울대학교 | https://www.snu.ac.kr/ | custom-root |
| 수도권 | 국립대학법인 | 인천대학교 | https://www.inu.ac.kr/ | custom-root |

## Legacy Institution Note

`한국복지대학교` is not treated as a separate active institution in this rollout registry.

- Reason: integrated into `한경국립대학교`
- Effective date: **2023-03-01**
- Product handling: legacy campus metadata only, not a separate institution adapter

## Rollout Plan

### Wave 1

- 국립한밭대학교
- 강원대학교
- 서울과학기술대학교
- 국립한국해양대학교
- 경인교육대학교
- 서울대학교
- 인천대학교
- 국립한국방송통신대학교

### Wave 2

- 국립강릉원주대학교
- 한경국립대학교
- 경북대학교
- 부산대학교
- 충남대학교
- 충북대학교
- 전남대학교
- 전북대학교

### Wave 3

- remaining 국가중심대 and 교원양성대
- custom-root and edge-family schools after reusable adapters are proven

## Immediate Next Implementation Step

1. Add `national-university-registry.data.ts` under the institution context.
2. Add `institution-service-type.enum.ts` and encode:
   - `academic_notice`
   - `academic_calendar`
   - `scholarship`
   - `career_program`
   - `job_fair`
   - `field_practice`
   - `internship`
   - `extracurricular`
   - `mentoring`
   - `startup`
   - `global_program`
   - `support`
   - `dormitory`
   - `meal`
3. Add a source-catalog layer that maps each institution to:
   - public source URL
   - family
   - service type
   - collection frequency
   - parser strategy
4. Implement Wave-1 institution adapters by family, not by school one-by-one.

## Sources

- National University Development Project Council introduction: https://knu39.org/sub/introduce.php?js_check=1
- National University Development Project Council participating universities: https://knu39.org/sub/university.php?js_check=1
- Seoul National University official history: https://www.snu.ac.kr/about/history/timeline
- HKNU official notice mentioning integration with Korea National University of Welfare: https://www.hknu.ac.kr/bbs/kor/81/78521/artclView.do
- Representative official sites used for public-surface checks:
  - https://www.kangwon.ac.kr/www/main.do
  - https://www.seoultech.ac.kr/index.jsp
  - https://www.kmou.ac.kr/kmou/main.do
  - https://www.snue.ac.kr/snue/main.do?mi=Y
  - https://gradu.ginue.ac.kr/kor/Main.do
  - https://www.knou.ac.kr/knou/index.do?epTicket=LOG
  - https://www.inu.ac.kr/
