-- KB MoneyFlow 캐릭터별 맞춤형 시드 데이터 (최종 버전)
-- 이 쿼리를 Supabase SQL Editor에서 실행하세요.

-- 1. 외래키 제약 조건 완화 (실제 가입 없이 캐릭터 ID를 사용하기 위함)
-- auth.users에 없는 ID를 profiles 테이블에 넣을 수 있도록 제약을 제거하거나 수정합니다.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. RLS(Row Level Security) 정책 수정
-- 데모 캐릭터 데이터는 누구나 조회할 수 있도록 정책을 추가합니다.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_briefings ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (충돌 방지)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Assets are viewable by everyone" ON assets;
DROP POLICY IF EXISTS "AI briefings are viewable by everyone" ON ai_briefings;

-- 모든 사용자(로그인 여부 무관)가 데이터를 조회할 수 있도록 허용
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Assets are viewable by everyone" ON assets FOR SELECT USING (true);
CREATE POLICY "AI briefings are viewable by everyone" ON ai_briefings FOR SELECT USING (true);

-- 3. 기존 캐릭터 데이터 및 관련 데이터 정리
DELETE FROM assets WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');
DELETE FROM ai_briefings WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');
DELETE FROM profiles WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');

-- 4. 프로필 생성
INSERT INTO profiles (id, full_name, avatar_url, risk_appetite, membership_tier)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '비비', 'https://api.dicebear.com/7.x/bottts/svg?seed=yellow&backgroundColor=ffbc00', 'Aggressive', 'VVIP'),
  ('22222222-2222-2222-2222-222222222222', '키키', 'https://api.dicebear.com/7.x/bottts/svg?seed=brown&backgroundColor=4b4b4b', 'Balanced', 'Gold'),
  ('33333333-3333-3333-3333-333333333333', '라무', 'https://api.dicebear.com/7.x/bottts/svg?seed=white&backgroundColor=ffffff', 'Conservative', 'Silver');

-- 5. 비비 (VVIP, 공격형) 자산 데이터 - 약 12억
INSERT INTO assets (user_id, name, amount, change_percent, category)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'KB Star 미국 S&P500 ETF', 450000000, 15.2, 'Stock'),
  ('11111111-1111-1111-1111-111111111111', '엔비디아 (NVDA)', 320000000, 124.5, 'Stock'),
  ('11111111-1111-1111-1111-111111111111', '비트코인 (BTC)', 150000000, 45.2, 'Crypto'),
  ('11111111-1111-1111-1111-111111111111', '이더리움 (ETH)', 85000000, 32.1, 'Crypto'),
  ('11111111-1111-1111-1111-111111111111', 'KB 온국민 TDF 2050', 120000000, 5.8, 'Fund'),
  ('11111111-1111-1111-1111-111111111111', 'KB 국민은행 정기예금', 100000000, 0.0, 'Cash'),
  ('11111111-1111-1111-1111-111111111111', 'KRX 금현물', 50000000, 12.4, 'Stock'),
  ('11111111-1111-1111-1111-111111111111', 'KB Star 미국채 30년', 30000000, -2.1, 'Bond');

-- 6. 키키 (Gold, 중립형) 자산 데이터 - 약 1.5억
INSERT INTO assets (user_id, name, amount, change_percent, category)
VALUES 
  ('22222222-2222-2222-2222-222222222222', '삼성전자', 45000000, -2.4, 'Stock'),
  ('22222222-2222-2222-2222-222222222222', 'KB Star 200 ETF', 30000000, 4.2, 'Stock'),
  ('22222222-2222-2222-2222-222222222222', 'KB 국민은행 정기예금', 50000000, 0.0, 'Cash'),
  ('22222222-2222-2222-2222-222222222222', 'KB 단기채권 펀드', 20000000, 1.5, 'Bond'),
  ('22222222-2222-2222-2222-222222222222', '네이버 (NAVER)', 5000000, -12.8, 'Stock'),
  ('22222222-2222-2222-2222-222222222222', 'KB 스타 코스닥150', 3000000, -5.2, 'Stock');

-- 7. 라무 (Silver, 안정형) 자산 데이터 - 약 4천만원
INSERT INTO assets (user_id, name, amount, change_percent, category)
VALUES 
  ('33333333-3333-3333-3333-333333333333', 'KB 국민은행 정기예금', 30000000, 0.0, 'Cash'),
  ('33333333-3333-3333-3333-333333333333', 'KB Star 국고채 3년 ETF', 10000000, 0.5, 'Bond'),
  ('33333333-3333-3333-3333-333333333333', 'KB 수시입출금 통장', 5000000, 0.0, 'Cash'),
  ('33333333-3333-3333-3333-333333333333', 'KB 단기 배당금 펀드', 2000000, 1.2, 'Fund');

-- 8. 과거 브리핑 내역
INSERT INTO ai_briefings (user_id, content, market_sentiment)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '비비님, 공격적인 포트폴리오가 엔비디아 급등 덕분에 18% 수익을 달성했습니다.', 'Greed'),
  ('22222222-2222-2222-2222-222222222222', '키키님, 삼성전자의 하락에도 불구하고 ETF 분산 투자로 자산이 방어되었습니다.', 'Neutral'),
  ('33333333-3333-3333-3333-333333333333', '라무님, 시장 변동성에도 안정적인 예금 비중 덕분에 손실이 전혀 없습니다.', 'Neutral');
