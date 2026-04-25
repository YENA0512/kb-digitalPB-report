export type Category = 'Stock' | 'Fund' | 'Cash' | 'Bond' | 'Crypto';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  risk_appetite: 'Conservative' | 'Balanced' | 'Aggressive';
  membership_tier: string;
  created_at: string;
}

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  change_percent: number;
  category: Category;
  created_at: string;
}

export interface AIBriefing {
  id: string;
  user_id: string;
  content: string;
  market_sentiment: string;
  created_at: string;
}
