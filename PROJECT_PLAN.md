# KB 머니플로우 (KB MoneyFlow) 프로젝트 기획안

## 1. 개요
- **서비스 명칭:** KB 머니플로우 (Digital PB System)
- **컨셉:** 고객의 자산을 실시간으로 진단하고 AI가 '금융 처방전'을 내리는 디지털 PB 서비스
- **타겟:** 자산 관리에 어려움을 느끼는 MZ세대 및 은퇴 준비 고객층

## 2. 디자인 시스템 (Elegant Dark Theme)
- **Background:** Dark (#1a1a1a)
- **Primary Color:** KB Yellow (#FFBC00)
- **Point Colors:** Emerald (성공/수익), Rose (주의/방어)
- **Style:** Glassmorphism, Rounded Corners (3rem), Fluid Animations

## 3. 기능 상세 계획 (Functional Deep Dive)

### [A] Home View (통합 대시보드)
*   **자산 요약 카드:** 총 자산 금액과 전일 대비 변동 금액/수익률을 실시간으로 시각화.
*   **수익률 비교 그래프:** '시장 평균' vs '내 포트폴리오'의 성과를 Recharts 기반 막대 그래프로 직관적 비교.
*   **AI PB 브리핑 공간:** 
    *   Gemini API 연동을 통해 현재 자산 상황 및 **Google Search를 활용한 실시간 시장 상황** 기반 맞춤형 텍스트 생성.
    *   타임라인 UI를 사용하여 '과거 복기 - 현재 진단 - 향후 전망'의 서사적 흐름 제공.
*   **디지털 PB의 안목:** 주요 시장 이슈와 섹터 트렌드를 카드 형태로 제공하며, 클릭 시 상세 분석 내용 노출.
*   **금융 처방전 바텀 영역:** 현재 가장 시급한 리밸런싱 액션을 요약하여 노출.

### [B] Assets View (상세 자산 관리)
*   **포트폴리오 도넛 차트:** 주식, 펀드, 현금 비중을 직관적으로 확인. 중앙에 최대 비중 자산 표시.
*   **자산 리스트:** 개별 상품별 보유 금액과 수익률을 리스트업. '처방 즉시 실행' 시 데이터가 시뮬레이션 결과에 따라 변동됨.

### [C] Investment View (상품 추천 및 탐색)
*   **TOP PICK 추천:** KB 리서치 기반 유망 상품(S&P 500, TDF 등)을 큐레이션.
*   **섹터 투자 점수:** AI가 분석한 섹터별 투자 매력도를 게이지 바와 'Strong Buy' 등의 태그로 표시.

### [D] Global Interactions & Components
*   **시뮬레이션 모달:**
    *   '처방전 실행' 클릭 시 등장. 실행 후 예상 수익률(+12.4%) 및 변동성 완화 수치를 게이지 애니메이션으로 시각화.
    *   주의사항 알림(리스크 고지) 포함.
*   **토스트 유저 피드백:** 처방 반영, 리포트 저장 등 주요 액션 시 화면 하단에 세련된 골드 테마 토스트 메시지 출력.
*   **Report Export (PDF):** `window.print()`와 CSS `@media print` 쿼리를 최적화하여 깔끔한 진단 리포트 출력 기능 제공.
*   **탭 내비게이션:** Framer Motion의 `layoutId`를 활용하여 탭 전환 시 부드러운 인디케이터 이동 애니메이션 구현.

## 4. 기술 스택 및 아키텍처 (Technical Stack)
*   **Core:** React 18 (TypeScript) + Vite
*   **Styling:** Tailwind CSS v4 (@tailwindcss/vite) + Framer Motion
*   **Backend/DB:** Supabase (@supabase/supabase-js, tslib)
*   **AI:** Google Gemini API (@google/genai SDK - Gemini 3 Flash 모델 사용)
*   **AI Search:** Google Search Grounding 기능 연동 (실시간 금융 데이터 조회)
*   **Icons:** Lucide-react

## 5. 생성 파일 목록 (File Tree)
- `/src/App.tsx`: 메인 애플리케이션 및 라우팅 로직
- `/src/lib/supabase.ts`: Supabase 클라이언트 초기화 및 타입 정의
- `/src/lib/gemini.ts`: Gemini API 호출 및 프롬프트 엔지니어링 모듈
- `/src/components/Toast.tsx`: 글로벌 알림 컴포넌트
- `/src/types/database.ts`: Supabase 테이블 정의 (import type 사용)
- `/supabase_setup.sql`: 데이터베이스 스키마 및 RLS 설정 쿼리
- `/SUPABASE_SEED.sql`: 테스트를 위한 고품질 더미 데이터 셋
- `/.env.example`: 환경변수 템플릿
- `/README.md`: 프로젝트 실행 및 배포 가이드

## 6. 구현 순서 (Implementation Sequence)
1.  **환경 구축:** NPM 패키지 설치 (`@supabase/supabase-js`, `@google/genai`, `tslib` 등) 및 `.env` 설정
2.  **UI 레이아웃:** Tailwind v4 기반의 다크 테마 홈/자산/투자 탭 구현
3.  **Supabase 연동:** Auth 및 CRUD 로직 (자산 데이터 불러오기/저장) 구현
4.  **AI 로직:** Gemini 3 Flash API 호출 모듈 작성 및 **Google Search 연동**을 통한 실시간 자산 진단 기능 연결
5.  **기능 고도화:** 리밸런싱 시뮬레이션, PDF 출력, 인터랙션 디테일(Framer Motion) 강화
6.  **에러 핸들링:** API 키 누락, 네트워크 장애, JSON 파싱 오류 처리 UI 추가
7.  **최종 검증:** Lint/Build 테스트 및 `README.md` 작성

## 7. 주요 로직 설계
### Supabase 연동
- 사용자가 앱에 접속하면 `auth.getUser()`를 통해 세션을 확인합니다.
- `assets` 테이블에서 현재 자산 데이터를 실시간 구독(`onSnapshot` 형태의 로드)하여 UI에 반영합니다.

### Gemini 호출 (Client-side)
- `import.meta.env.VITE_GEMINI_API_KEY`를 사용하여 보안 브리핑을 생성하며, **Gemini 3 Flash** 모델을 사용합니다.
- 자산 현황과 **Google Search로 검색된 최신 시장 데이터**를 프롬프트에 조합하여 전송하며, 결과는 JSON 형식을 권장하여 UI 구조에 맞게 파싱합니다.

## 8. 에러 핸들링 가이드
- **API Key 누락:** 앱 상단 혹은 브리핑 영역에 "환경변수 설정 필요" 경고 배너 표시.
- **파싱 실패:** 에러 발생 시 Raw 데이터의 일부(200자)와 함께 "데이터 해석 오류" 메시지 및 재시도 버튼 제공.
- **네트워크 장애:** 오프라인 상태 혹은 타임아웃 시 "통신 원활하지 않음" 토스트 메시지 출력.

## 9. 리스크 및 대응 (Expected Risks)
- **보안:** 브라우저에서 직접 API를 호출하므로 `VITE_` 접두사를 통한 키 노출 방지에 유의 (데모용 한정).
- **데이터 제약:** `SUPABASE_SEED.sql` 실행 시 `auth.users` 제약 조건으로 인해 에러 발생 가능 → 로그인 후 본인 UUID를 사용하도록 가이드 제공(README 참조).
- **할당량:** Gemini Free Tier 사용 시 Rate Limit 발생 가능성 → 에러 핸들링 UI 강화.
