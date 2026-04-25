-- KB MoneyFlow Supabase Database Schema

-- 1. Profiles Table (Extends Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  risk_appetite TEXT CHECK (risk_appetite IN ('Conservative', 'Balanced', 'Aggressive')) DEFAULT 'Balanced',
  membership_tier TEXT DEFAULT 'Gold',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Assets Table
CREATE TABLE assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  change_percent NUMERIC DEFAULT 0,
  category TEXT NOT NULL CHECK (category IN ('Stock', 'Fund', 'Cash', 'Bond', 'Crypto', 'Commodity')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. AI Briefings History (To cache Gemini responses)
CREATE TABLE ai_briefings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  market_sentiment TEXT, -- e.g., 'Greed', 'Fear'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Prescriptions (Action Logs)
CREATE TABLE prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  action_plan JSONB NOT NULL, -- Detailed steps like [{"sell": "NASDAQ", "amount": 1000}]
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'ignored')),
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS (Row Level Security) Settings
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own assets" ON assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own assets" ON assets FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own briefings" ON ai_briefings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own prescriptions" ON prescriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own prescriptions" ON prescriptions FOR UPDATE USING (auth.uid() = user_id);
