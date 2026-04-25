-- KB MoneyFlow 입체적 시드 데이터 (v2)
-- 중요: 이 스크립트는 'Foreign Key' 제약 조건 때문에 auth.users에 해당 ID가 있어야 실행됩니다.

-- [방법 1] 앱에서 로그인을 먼저 한 후, Supabase Auth 대시보드에서 본인의 UUID를 복사하여 
-- 아래 '00000000-0000-0000-0000-000000000000' 부분을 모두 본인의 ID로 바꾸세요.

-- [방법 2] 아래 블록은 auth.users에 강제로 더미 유저를 시도합니다. (SQL Editor 권한에 따라 실패할 수 있음)
-- 실패하더라도 당황하지 마시고 [방법 1]을 사용하세요.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000') THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            'kb_test@example.com',
            '', -- 비워둠 (OAuth 테스트용)
            now(),
            '{"provider":"google","providers":["google"]}',
            '{"full_name":"김국민"}',
            'authenticated',
            'authenticated'
        );
    END IF;
END $$;

-- 1. 임시 프로필 생성
INSERT INTO profiles (id, full_name, avatar_url, risk_appetite, membership_tier)
VALUES ('00000000-0000-0000-0000-000000000000', '김국민', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', 'Balanced', 'Gold')
ON CONFLICT (id) DO NOTHING;

-- 2. 입체적인 자산 데이터
INSERT INTO assets (user_id, name, amount, change_percent, category)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'KB Star 미국 S&P500 ETF', 45000000, 12.5, 'Stock'),
  ('00000000-0000-0000-0000-000000000000', '삼성전자', 15000000, -2.4, 'Stock'),
  ('00000000-0000-0000-0000-000000000000', 'KB 국민은행 정기예금', 30000000, 0.0, 'Cash'),
  ('00000000-0000-0000-0000-000000000000', 'KB 온국민 TDF 2050', 25000000, 5.8, 'Fund'),
  ('00000000-0000-0000-0000-000000000000', '비트코인(BTC)', 8500000, 45.2, 'Crypto'),
  ('00000000-0000-0000-0000-000000000000', 'KRX 금 현물', 12000000, 8.1, 'Bond')
ON CONFLICT DO NOTHING;

-- 3. 과거 AI 브리핑 내역
INSERT INTO ai_briefings (user_id, content, market_sentiment)
VALUES 
  ('00000000-0000-0000-0000-000000000000', '최근 미 연준의 금리 동결 시그널로 인해 기술주 중심의 자산 가치가 4.2% 상승했습니다.', 'Greed'),
  ('00000000-0000-0000-0000-000000000000', '국내 반도체 업황의 일시적 둔화로 삼성전자 비중에서 소폭 하락세가 관찰됩니다.', 'Neutral')
ON CONFLICT DO NOTHING;

-- 4. 금융 처방전
INSERT INTO prescriptions (user_id, title, action_plan, status)
VALUES 
  (
    '00000000-0000-0000-0000-000000000000', 
    '수익 실현 및 채권 비중 확대', 
    '[{"action": "sell", "target": "S&P500 ETF", "percentage": 10}, {"action": "buy", "target": "KB 단기채권 펀드", "percentage": 10}]', 
    'pending'
  )
ON CONFLICT DO NOTHING;

