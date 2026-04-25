# KB MoneyFlow - AI Digital PB Dashboard

KB국민은행의 전문가 수준의 자산 진단 및 금융 처방을 제공하는 AI 디지털 PB 대시보드입니다.

## 🚀 시작하기

### 1. 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 아래 내용을 입력하세요:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### 2. 의존성 설치 및 실행
```bash
npm install
npm run dev
```

## 🗄️ 데이터베이스 설정 (Supabase)

Supabase SQL Editor에서 아래 파일들의 내용을 순서대로 실행하세요:
1. `SUPABASE_SCHEMA.sql`: 테이블 및 보안 정책(RLS) 설정
2. `SUPABASE_SEED.sql`: 초기 테스트 데이터 삽입

> **주의:** `SUPABASE_SEED.sql` 실행 시 `auth.users` 제약 오류가 발생할 수 있습니다. 먼저 앱에서 로그인을 진행한 후 생성된 UUID를 확인하여 SQL의 ID를 수정하거나, README에 설명된 가이드라인을 따르세요.

## 🌐 배포 (Vercel)

1. 이 레포지토리를 GitHub에 푸시합니다.
2. Vercel에서 프로젝트를 사이트에 연결합니다 (Import).
3. **Environment Variables** 설정 섹션에서 위의 3개 환경변수를 동일하게 입력합니다.
4. **Deploy** 버튼을 클릭합니다.

## 🛠️ 기술 스택
- **React 18** & **Vite**
- **Tailwind CSS v4**
- **Framer Motion** (애니메이션)
- **Smart Alerts & Notifications** (지수/종목별 맞춤 조건 알림 설정)
- **AI Pick Detail View** (추천 상품 상세 분석 및 실시간 모의 투자 연동)
- **Supabase** (Backend as a Service)
- **Google Gemini 3 Flash** (AI 자산 진단 & Google Search 연동)
- **Real-time Market Analysis** (Google Search 기반 실시간 금융 지표 반영)
- **Lucide-react** (아이콘)

## 🤖 AI 진단 로직 및 데이터 활용
KB MoneyFlow의 AI 브리핑은 다음과 같은 과정을 통해 생성됩니다:

1. **사용자 자산 데이터:** Supabase의 `assets` 테이블에서 현재 고객이 보유한 자산(주식, 펀드, 예금, 가상자산 등) 정보를 읽어옵니다.
2. **실시간 시장 연동 (Google Search Grounding):** 
   - Gemini 3 Flash 모델이 Google Search 기능을 사용하여 현재 시점의 주요 경제 지표(S&P 500, 나스닥, 환율, 금리 뉴스 등)를 실시간으로 탐색합니다.
   - 검색된 시장 상황과 고객의 포트폴리오를 결합하여 분석합니다.
3. **3단계 처방전 생성:**
   - **과거 복기:** 과거 시장 상황이 현재 포트폴리오에 미친 영향 분석.
   - **현재 진단:** 실시간 데이터를 바탕으로 한 현재의 기회와 리스크 식별.
   - **향후 전망:** AI가 제안하는 구체적인 행동 지침(Action Plan) 제공.

