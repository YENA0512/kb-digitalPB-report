import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요.");
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
