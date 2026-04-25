/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PieChart as PieChartIcon, 
  X,
  Zap,
  Activity,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2, 
  AlertCircle, 
  Search,
  Sparkles,
  Info,
  LogOut,
  LogIn
} from 'lucide-react';
import { 
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Tooltip
} from 'recharts';

// --- Types & Modules ---
import { supabase } from './lib/supabase';
import { generateFinancialBriefing, generateInvestmentRecommendations, getMarketTrends } from './lib/gemini';
import type { Asset, Profile } from './types/database';

const KB_COLORS = {
  yellow: '#FFBC00',
  dark: '#1a1a1a',
  card: '#262626',
  emerald: '#10b981',
  rose: '#f43f5e',
};

const KB_COLORS_RGB = {
  yellow: 'rgb(255, 188, 0)',
  emerald: 'rgb(16, 185, 129)',
  rose: 'rgb(244, 63, 94)',
  gray: 'rgb(75, 75, 75)'
};

const TEST_USERS = [
  { id: '11111111-1111-1111-1111-111111111111', name: '비비', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=yellow&backgroundColor=ffbc00', tier: 'VVIP' },
  { id: '22222222-2222-2222-2222-222222222222', name: '키키', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=brown&backgroundColor=4b4b4b', tier: 'Gold' },
  { id: '33333333-3333-3333-3333-333333333333', name: '라무', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=white&backgroundColor=ffffff', tier: 'Silver' },
];

// --- Components ---

const Card = ({ children, className = "", noPadding = false, activeLine = false, onClick }: { children: React.ReactNode; className?: string; noPadding?: boolean; activeLine?: boolean; key?: any; onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={`bg-[#262626] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden relative ${noPadding ? '' : 'p-6'} ${className}`}
  >
    {activeLine && <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: KB_COLORS_RGB.yellow }}></div>}
    {children}
  </div>
);

const Badge = ({ children, type = 'default' }: { children: React.ReactNode; type?: 'default' | 'success' | 'warning' }) => {
  const styles = {
    default: { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'rgb(156, 163, 175)', borderColor: 'rgba(255, 255, 255, 0.05)' },
    success: { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: KB_COLORS_RGB.emerald, borderColor: 'rgba(16, 185, 129, 0.2)' },
    warning: { backgroundColor: 'rgba(244, 63, 94, 0.1)', color: KB_COLORS_RGB.rose, borderColor: 'rgba(244, 63, 94, 0.2)' },
  };
  return (
    <span 
      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border`}
      style={styles[type]}
    >
      {children}
    </span>
  );
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'assets' | 'invest' | 'noti'>('home');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [briefing, setBriefing] = useState<{past: string, present: string, future: string, sentiment: string, insights?: {title: string, content: string, type: 'tip'|'warning'}[]} | null>(null);
  const [recommendations, setRecommendations] = useState<{name: string, chip: string, reason: string, score: number}[]>([]);
  const [selectedRec, setSelectedRec] = useState<{name: string, chip: string, reason: string, score: number} | null>(null);
  const [isRecLoading, setIsRecLoading] = useState(false);
  const [selectedMarketIndex, setSelectedMarketIndex] = useState(0);
  const [marketTrends, setMarketTrends] = useState<{
    sectors: { name: string; change: number; sentiment: string }[];
    indices: { name: string; values: number[] }[];
  } | null>(null);
  const [isMarketLoading, setIsMarketLoading] = useState(false);
  
  const [notifications, setNotifications] = useState<{
    id: string;
    title: string;
    content: string;
    time: string;
    type: 'market' | 'asset' | 'news';
    isRead: boolean;
  }[]>([]);
  
  const [alerts, setAlerts] = useState<{
    id: string;
    type: 'index' | 'stock';
    target: string;
    threshold: number;
    condition: 'above' | 'below';
  }[]>([]);
  
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [newAlert, setNewAlert] = useState<{
    type: 'index' | 'stock';
    target: string;
    threshold: string;
    condition: 'above' | 'below';
  }>({ type: 'index', target: 'KOSPI', threshold: '', condition: 'above' });
  
  const [showPrescription, setShowPrescription] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const categoryMap: { [key: string]: string } = {
    'Stock': '주식',
    'Fund': '펀드',
    'Cash': '현금/예금',
    'Bond': '채권',
    'Crypto': '가상자산',
    'Commodity': '원자재/금'
  };

  const characterImages: { [key: string]: string } = {
    '비비': 'https://api.dicebear.com/7.x/bottts/svg?seed=yellow&backgroundColor=ffbc00',
    '키키': 'https://api.dicebear.com/7.x/bottts/svg?seed=brown&backgroundColor=4b4b4b',
    '라무': 'https://api.dicebear.com/7.x/bottts/svg?seed=white&backgroundColor=ffffff'
  };

  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- Data Fetching ---

  const fetchData = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch/Sync Profile
      const { data: prof, error: pErr } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      if (pErr && pErr.code !== 'PGRST116') throw pErr;
      
      if (prof) {
        setProfile(prof);
      }

      // 2. Fetch Assets
      const { data: assts, error: aErr } = await supabase.from('assets').select('*').eq('user_id', userId);
      if (aErr) throw aErr;
      
      // 3. Auto-Seed if no assets exist
      if (!assts || assts.length === 0) {
        // Multiplier based on character for diversity
        const multiplier = userId.includes('vivi') ? 2.5 : userId.includes('kiki') ? 1.0 : 0.4;

        const defaultAssets = [
          { user_id: userId, name: 'KB Star 미국 S&P500 ETF', amount: 45000000 * multiplier, change_percent: 12.5, category: 'Stock' },
          { user_id: userId, name: '삼성전자', amount: 15000000 * multiplier, change_percent: -2.4, category: 'Stock' },
          { user_id: userId, name: 'KB 국민은행 정기예금', amount: 30000000 * multiplier, change_percent: 0.0, category: 'Cash' },
          { user_id: userId, name: 'KB 온국민 TDF 2050', amount: 25000000 * multiplier, change_percent: 5.8, category: 'Fund' },
          { user_id: userId, name: '비트코인(BTC)', amount: 8500000 * multiplier, change_percent: 45.2, category: 'Crypto' },
          { user_id: userId, name: 'KRX 금 현물', amount: 12000000 * multiplier, change_percent: 8.1, category: 'Bond' },
        ];
        
        const { error: seedErr } = await supabase.from('assets').insert(defaultAssets);
        if (seedErr) throw seedErr;
        
        // Refetch after seeding
        const { data: seededAssts } = await supabase.from('assets').select('*').eq('user_id', userId);
        setAssets(seededAssts || []);
      } else {
        setAssets(assts);
      }
      
    } catch (err: any) {
      console.error("Fetch Error:", err);
      showToast("데이터 업데이트 중 오류: " + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getBriefing = async () => {
    if (assets.length === 0) return;
    setIsBriefingLoading(true);
    try {
      const result = await generateFinancialBriefing(assets);
      setBriefing(result);
    } catch (err: any) {
      console.error("Briefing Error:", err);
      showToast(err.message, 'error');
    } finally {
      setIsBriefingLoading(false);
    }
  };

  const getRecommendations = async () => {
    if (!profile || assets.length === 0) return;
    setIsRecLoading(true);
    try {
      const result = await generateInvestmentRecommendations(profile, assets);
      setRecommendations(result);
    } catch (err: any) {
      console.error("Recommendations Error:", err);
      // Fallback if AI fails partially
    } finally {
      setIsRecLoading(false);
    }
  };

  const fetchMarketTrends = async () => {
    setIsMarketLoading(true);
    try {
      const data = await getMarketTrends();
      setMarketTrends(data);
    } catch (err) {
      console.error("Market Trends Error:", err);
    } finally {
      setIsMarketLoading(false);
    }
  };

  useEffect(() => {
    // Character-based setup without Firebase Auth redirects
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user && assets.length > 0) {
      if (!briefing) getBriefing();
      if (activeTab === 'invest') {
        if (recommendations.length === 0) getRecommendations();
        if (!marketTrends) fetchMarketTrends();
      }
    }
  }, [user, assets.length, activeTab]);

  // --- Handlers ---

  const addNotification = useCallback((noti: Omit<typeof notifications[0], 'id' | 'time' | 'isRead'>) => {
    const newNoti = {
      ...noti,
      id: Math.random().toString(36).substr(2, 9),
      time: '방금 전',
      isRead: false
    };
    setNotifications(prev => [newNoti, ...prev]);
    showToast(`새 알림: ${noti.title}`);
  }, []);

  const handleAddAlert = () => {
    if (!newAlert.threshold) return;
    const alert = {
      ...newAlert,
      id: Math.random().toString(36).substr(2, 9),
      threshold: Number(newAlert.threshold)
    };
    setAlerts(prev => [...prev, alert]);
    setShowAddAlert(false);
    showToast("알림 설정이 완료되었습니다.");
    setNewAlert({ type: 'index', target: 'KOSPI', threshold: '', condition: 'above' });
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    showToast("알림 설정이 해제되었습니다.");
  };

  const markNotiAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  // Simulate market alerts
  useEffect(() => {
    if (marketTrends && alerts.length > 0) {
      alerts.forEach(alert => {
        if (alert.type === 'index') {
          const indexData = marketTrends.indices.find(idx => idx.name === alert.target);
          if (indexData) {
            const currentVal = indexData.values[0]; // Assuming first is current
            const triggered = alert.condition === 'above' ? currentVal > alert.threshold : currentVal < alert.threshold;
            if (triggered) {
              addNotification({
                title: `${alert.target} 지수 변동 알림`,
                content: `${alert.target} 지수가 설정하신 ${alert.threshold}pt를 ${alert.condition === 'above' ? '상회' : '하회'}하였습니다. (현재: ${currentVal}pt)`,
                type: 'market'
              });
              // Remove alert after trigger to avoid spam in this demo
              setAlerts(prev => prev.filter(a => a.id !== alert.id));
            }
          }
        }
      });
    }
  }, [marketTrends, alerts, addNotification]);

  // Initial mock notifications
  useEffect(() => {
    if (user && notifications.length === 0) {
      setNotifications([
        { id: '1', title: '포트폴리오 리밸런싱 권고', content: '코스피 6,500선 터치 후 보합권 진입에 따라 수익 실현 및 자산 비중 조정이 필요합니다.', time: '2시간 전', type: 'asset', isRead: false },
        { id: '2', title: 'KB Star 미국 S&P500 신고가', content: '보유하신 상품이 글로벌 강세장에 힘입어 52주 신고가를 경신하였습니다.', time: '5시간 전', type: 'news', isRead: true },
        { id: '3', title: '코스피 6,400선 강력 지지', content: '사상 최고치 경신 이후 6,470선에서 견조한 피봇 포인트를 형성하고 있습니다.', time: '어제', type: 'market', isRead: true }
      ]);
    }
  }, [user]);

  const handleCharacterLogin = async (char: typeof TEST_USERS[0]) => {
    setIsLoading(true);
    try {
      // Local Session Mock (Skip database write to avoid RLS errors on mock IDs)
      const mockUser = { id: char.id, email: `${char.id}@kb-star.com` };
      setUser(mockUser as any);
      setBriefing(null);
      
      await fetchData(char.id);
      showToast(`${char.name}님으로 입장하셨습니다.`);
    } catch (err: any) {
      showToast("입장 중 오류: " + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setProfile(null);
    setAssets([]);
    setBriefing(null);
    showToast("로그아웃 되었습니다.");
  };

  const handleBuyRec = async (rec: typeof selectedRec) => {
    if (!rec || !user) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('assets')
        .insert({
          user_id: user.id,
          name: rec.name,
          category: rec.chip.includes('Bond') ? 'Bond' : rec.chip.includes('Index') ? 'Fund' : 'Stock',
          amount: 1000000, // Default 1M KRW purchase for simulation
          balance: 1000000 / 75000, // Fake quantity
          change_percent: 0,
          ticker: 'REC'
        });
      
      if (error) throw error;
      
      await fetchData(user.id);
      showToast(`${rec.name} 구매 시뮬레이션이 완료되었습니다.`);
      setSelectedRec(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunSimulation = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      // 리밸런싱 시뮬레이션 결과를 가상 자산에 반영 (예: 현금 흐름 조정)
      const cashAsset = assets.find(a => a.category === 'Cash');
      if (cashAsset) {
        const { error } = await supabase
          .from('assets')
          .update({ amount: cashAsset.amount + 5000000 }) // 시뮬레이션 보너스/조정 예시
          .eq('id', cashAsset.id);
        if (error) throw error;
      }
      
      await fetchData(user.id);
      showToast("시뮬레이션 결과가 자산 리포트에 반영되었습니다.");
      setShowSimulation(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Calculation ---
  const totalAmount = assets.reduce((acc, cur) => acc + Number(cur.amount), 0);
  
  const weightedChange = React.useMemo(() => {
    if (totalAmount === 0) return 0;
    const totalWeightedChange = assets.reduce((acc, cur) => {
      const weight = Number(cur.amount) / totalAmount;
      return acc + (Number(cur.change_percent) * weight);
    }, 0);
    return Number(totalWeightedChange.toFixed(2));
  }, [assets, totalAmount]);

  const categoryStats = React.useMemo(() => {
    const stats: { [key: string]: number } = {};
    assets.forEach(asset => {
      stats[asset.category] = (stats[asset.category] || 0) + Number(asset.amount);
    });

    const categoryColors: { [key: string]: string } = {
      'Stock': KB_COLORS_RGB.yellow,
      'Fund': 'rgb(99, 102, 241)',
      'Cash': KB_COLORS_RGB.gray,
      'Bond': KB_COLORS_RGB.emerald,
      'Crypto': 'rgb(139, 92, 246)',
      'Commodity': KB_COLORS_RGB.rose
    };

    return Object.entries(stats).map(([name, value]) => ({ 
      name, 
      value,
      color: categoryColors[name] || '#666666'
    })).sort((a, b) => b.value - a.value);
  }, [assets]);

  // --- Views ---

  const LoginView = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12 px-6">
      <div className="space-y-4">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          className="w-20 h-20 bg-[#FFBC00] rounded-3xl rotate-12 flex items-center justify-center shadow-2xl shadow-[#FFBC00]/20 mx-auto"
        >
          <Sparkles size={40} className="text-[#1a1a1a]" />
        </motion.div>
        <h1 className="text-5xl font-black italic tracking-tighter">MoneyFlow</h1>
        <p className="text-gray-400 text-sm">KB 캐릭터와 함께하는 실감나는 AI 자산 관리</p>
      </div>

      <div className="grid grid-cols-3 gap-6 w-full max-w-sm">
        {TEST_USERS.map((char) => (
          <button 
            key={char.id}
            onClick={() => handleCharacterLogin(char)}
            className="group flex flex-col items-center gap-4 focus:outline-none"
          >
            <div className="relative">
              <div className="absolute -inset-2 bg-white/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500"></div>
              <img 
                src={char.avatar} 
                className="w-16 h-16 rounded-full border-2 border-white/10 group-hover:border-[#FFBC00] transition-colors relative z-10" 
                alt={char.name} 
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">{char.name}</p>
              <span className="text-[9px] font-black bg-white/5 px-2 py-0.5 rounded-full text-gray-500 uppercase tracking-tighter group-hover:bg-[#FFBC00] group-hover:text-[#1a1a1a] transition-all">
                {char.tier}
              </span>
            </div>
          </button>
        ))}
      </div>

      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Select your character to start</p>
    </div>
  );

  const HomeView = () => (
    <motion.div 
      ref={reportRef}
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }} 
      className="space-y-10"
    >
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card activeLine className="h-[200px] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">총 자산 요약</p>
              <Badge type={profile?.membership_tier === 'VVIP' ? 'success' : 'default'}>
                {profile?.full_name}님 맞춤 관리
              </Badge>
            </div>
            <h2 className="text-3xl font-bold tracking-tight italic">₩{totalAmount.toLocaleString()}</h2>
            <p className="text-[11px] text-gray-500 mt-1 font-medium italic">실시간 시장 변동성이 반영된 KB 머니플로우 자산입니다.</p>
          </div>
          <div className="flex items-center text-sm font-bold gap-1 mt-auto bg-white/5 p-2 rounded-xl border border-white/10">
            {weightedChange >= 0 ? (
              <div className="flex items-center gap-1 font-black italic" style={{ color: KB_COLORS_RGB.emerald }}>
                <TrendingUp size={16} />
                <span>내 포트폴리오 최근 일주일 +{weightedChange}% 상승 중</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 font-black italic" style={{ color: KB_COLORS_RGB.rose }}>
                <TrendingDown size={16} />
                <span>내 포트폴리오 최근 일주일 {weightedChange}% 하락 중</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="h-[200px] bg-gradient-to-br from-[#262626] to-[#1f1f1f]">
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-4">나의 자산 구성 비중 (%)</p>
          <div className="space-y-3 mt-2">
            {categoryStats.slice(0, 3).map((stat) => (
              <div key={stat.name} className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-gray-400">{categoryMap[stat.name] || stat.name}</span>
                  <span className="text-white">{Math.round((stat.value / totalAmount) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(stat.value / totalAmount) * 100}%` }}
                    className="h-full"
                    style={{ backgroundColor: stat.color }}
                  />
                </div>
              </div>
            ))}
            <p className="text-[9px] text-center text-gray-600 font-bold tracking-widest pt-2 italic">상위 3개 카테고리 집중 분석됨</p>
          </div>
        </Card>

        <Card className="h-[200px] flex flex-col justify-between border-[#FFBC00]/20 relative group">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">AI 시장 감성</p>
            <div className="group-hover:opacity-100 opacity-0 transition-opacity absolute right-4 top-10 z-10 w-48 bg-[#262626] p-3 rounded-xl border border-white/10 text-[9px] text-gray-400 leading-relaxed pointer-events-none shadow-2xl">
              AI가 실시간 검색 정보(지수, 뉴스, 환율)를 분석하여 투자자들의 심리 상태를 '공포'에서 '탐욕' 사이의 단계로 진단한 지표입니다.
            </div>
            <Info size={12} className="text-gray-600 cursor-help" />
          </div>
          <div className="flex flex-col items-center justify-center flex-1 space-y-3">
              <div className={`text-4xl font-black italic tracking-tighter`} style={{
                color: briefing?.sentiment === 'Greed' ? KB_COLORS_RGB.emerald : 
                       briefing?.sentiment === 'Fear' ? KB_COLORS_RGB.rose : KB_COLORS_RGB.yellow
              }}>
              {briefing?.sentiment || 'Neutral'}
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full relative overflow-hidden">
               <motion.div 
                 initial={{ left: '50%' }}
                 animate={{ left: briefing?.sentiment === 'Greed' ? '80%' : briefing?.sentiment === 'Fear' ? '20%' : '50%' }}
                 className="absolute top-0 w-2 h-full bg-white shadow-[0_0_10px_white] -translate-x-1/2"
               />
            </div>
            <div className="flex justify-between w-full text-[8px] font-bold text-gray-500 uppercase tracking-widest px-1">
              <span>Fear</span>
              <span>Neutral</span>
              <span>Greed</span>
            </div>
          </div>
        </Card>
      </section>

      {/* 오늘의 금융 처방전 실행 영역은 이제 하단 푸터 바텀시트에서 관리하도록 HomeView에서 제거 */}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2 px-2 tracking-tight">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: KB_COLORS_RGB.yellow, boxShadow: '0 0 10px rgb(255, 188, 0)' }}></div>
            AI 에이전트 브리핑
            <Badge type="default">Search Grounding On</Badge>
          </h2>
          <div className="relative pl-10 space-y-12">
            <div className="absolute left-[13px] top-4 bottom-4 w-px bg-white/10"></div>
            <div className="relative">
              <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full border-2 border-[#1a1a1a] bg-gray-600"></div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">과거 복기</p>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">{briefing?.past || '분석 중...'}</p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full border-2 border-[#1a1a1a]" style={{ backgroundColor: KB_COLORS_RGB.yellow, boxShadow: '0 0 10px rgb(255, 188, 0)' }}></div>
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: KB_COLORS_RGB.yellow }}>현재 자산 진단</p>
                <Card className="bg-[#262626]/40 backdrop-blur-sm border-white/10 mt-2 p-5 italic">
                  {isBriefingLoading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-white/5 rounded w-full"></div>
                      <div className="h-4 bg-white/5 rounded w-[80%]"></div>
                    </div>
                  ) : (
                    <p className="text-sm text-white leading-relaxed font-semibold">"{briefing?.present || '실시간 자산 데이터를 분석하여 진단을 생성합니다.'}"</p>
                  )}
                </Card>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full border-2 border-[#1a1a1a]" style={{ backgroundColor: KB_COLORS_RGB.emerald, boxShadow: '0 0 10px rgb(16, 185, 129)' }}></div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: KB_COLORS_RGB.emerald }}>향후 전략</p>
                <p className="text-sm text-gray-400 leading-relaxed font-medium">{briefing?.future || '전략 수립 중...'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2 px-2 tracking-tight text-gray-300">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: KB_COLORS_RGB.yellow, boxShadow: '0 0 10px rgb(255, 188, 0)' }}></div>
            디지털 PB의 안목
            <Badge type="success">AI Based Tracking</Badge>
          </h2>
          <div className="space-y-4">
            {briefing?.insights && briefing.insights.length > 0 ? (
              briefing.insights.map((insight, idx) => (
                <Card key={idx} className="border border-white/10 hover:border-[#FFBC00]/30 transition-all cursor-pointer group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg`} style={{
                        backgroundColor: insight.type === 'warning' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(255, 188, 0, 0.1)',
                        color: insight.type === 'warning' ? KB_COLORS_RGB.rose : KB_COLORS_RGB.yellow
                      }}>
                        {insight.type === 'warning' ? <ShieldAlert size={14} /> : <Zap size={14} />}
                      </div>
                      <p className={`text-[9px] font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform`} style={{
                        color: insight.type === 'warning' ? KB_COLORS_RGB.rose : KB_COLORS_RGB.yellow
                      }}>
                        {insight.type === 'warning' ? 'Risk Alert' : 'Market Tip'}
                      </p>
                    </div>
                    <Search size={12} className="text-gray-600" />
                  </div>
                  <h5 className="text-sm font-bold leading-snug mb-2 group-hover:text-white transition-colors">{insight.title}</h5>
                  <p className="text-[11px] text-gray-400 font-medium leading-relaxed italic mb-4">"{insight.content}"</p>
                  
                  {/* Confidence Meter Added */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <div key={s} className={`w-1.5 h-1 h-[2px] rounded-full`} style={{
                            backgroundColor: s <= 4 ? (insight.type === 'warning' ? KB_COLORS_RGB.rose : KB_COLORS_RGB.yellow) : 'rgb(55, 65, 81)'
                          }}></div>
                        ))}
                      </div>
                      <span className="text-[8px] font-black text-gray-500 uppercase tracking-tighter">AI Precision 92%</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-gray-600 group-hover:text-[#FFBC00] transition-colors">
                      <span>상세보기</span>
                      <ArrowRight size={10} />
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <>
                <Card className="border border-white/10 opacity-50">
                  <div className="animate-pulse space-y-3">
                    <div className="h-2 bg-white/5 w-1/4 rounded"></div>
                    <div className="h-4 bg-white/5 w-full rounded"></div>
                    <div className="h-2 bg-white/5 w-3/4 rounded"></div>
                  </div>
                </Card>
                <p className="text-[10px] text-center text-gray-600 font-bold tracking-widest pt-4">최신 시장 트렌드 분석 중...</p>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-gradient-to-r from-[#262626] to-[#2d2d2d] rounded-[2.5rem] border border-white/10 p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-3xl">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-[#FFBC00] rounded-full flex items-center justify-center shadow-2xl shadow-[#FFBC00]/30 transform hover:scale-110 transition-transform">
            <CheckCircle2 size={32} className="text-[#262626]" />
          </div>
          <div>
            <h3 className="text-xl font-black italic tracking-tight mb-1">오늘의 금융 처방전</h3>
            <p className="text-sm text-gray-400 font-medium">{profile?.full_name}님을 위한 맞춤형 처방</p>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button onClick={() => setShowPrescription(true)} className="flex-1 md:flex-none px-8 py-4 bg-white/5 border border-white/10 rounded-full font-bold hover:bg-white/10 transition-all">처방전 보기</button>
        </div>
      </footer>
    </motion.div>
  );

  const AssetsView = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      <div className="flex justify-between items-end">
        <h2 className="text-2xl font-bold tracking-tight italic">보유 자산 상세</h2>
        <p className="text-xs text-gray-500 font-bold tracking-widest mb-1 italic">TOTAL: ₩{totalAmount.toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <Card className="h-[300px] flex flex-col items-center justify-center relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[10px] text-gray-500 font-black tracking-widest uppercase">Composition</p>
            <p className="text-xl font-black italic">{categoryStats.length} Categories</p>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryStats}
                innerRadius={65}
                outerRadius={95}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
                {categoryStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any, name: string) => [`₩${Number(value).toLocaleString()}`, categoryMap[name] || name]}
                contentStyle={{ backgroundColor: '#262626', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <div className="space-y-3">
          {categoryStats.map((stat) => (
            <div key={stat.name} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                <span className="text-xs font-bold text-gray-300">{categoryMap[stat.name] || stat.name}</span>
              </div>
              <div className="text-right">
                <p className="text-xs font-black">₩{stat.value.toLocaleString()}</p>
                <p className="text-[9px] text-gray-500 font-bold">{Math.round((stat.value / totalAmount) * 100)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500 px-2">개별 자산 리스트</h3>
        <div className="grid grid-cols-1 gap-4">
          {assets.map((asset) => (
            <Card key={asset.id} className="py-5 px-6 flex justify-between items-center border border-white/5 hover:bg-white/5 hover:border-[#FFBC00]/20 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 text-[#FFBC00] group-hover:scale-110 transition-transform"><Wallet size={24} /></div>
                <div>
                  <h4 className="font-bold text-sm tracking-tight">{asset.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest">{categoryMap[asset.category] || asset.category}</span>
                    <div className="w-1 h-1 bg-gray-700 rounded-full"></div>
                    <span className="text-[9px] text-gray-500 font-bold italic">최근 거래 기준가 반영됨</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-base tracking-tight">₩{Number(asset.amount).toLocaleString()}</p>
                <div className={`text-[10px] font-black flex items-center justify-end gap-0.5 ${asset.change_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {asset.change_percent >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {asset.change_percent >= 0 ? '+' : ''}{asset.change_percent}%
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const InvestView = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      <div className="flex justify-between items-end">
        <h2 className="text-2xl font-bold tracking-tight italic">투자 인사이트</h2>
        <Badge type="success">AI Optimized</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#FFBC00]">수익률 비교</h3>
            <span className="text-[10px] text-gray-500 font-bold">최근 3개월 기준</span>
          </div>
          <div className="h-48 w-full bg-white/5 rounded-2xl flex flex-col p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: '내 포트폴리오', value: 70, fill: '#FFBC00', shadow: 'rgba(255,188,0,0.3)' },
                { name: 'KOSPI', value: 45, fill: '#4b5563', shadow: 'transparent' }
              ]}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#6b7280' }} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-gray-400 font-medium leading-relaxed italic text-center">
            시장지수 대비 <span className="text-emerald-400 font-bold">+5.2%</span> 초과 수익을 달성 중입니다.
          </p>
        </Card>

        <Card className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#FFBC00]">AI 추천 종목 (실시간 트렌드 반영)</h3>
            {isRecLoading && <div className="w-4 h-4 border-2 border-[#FFBC00] border-t-transparent rounded-full animate-spin"></div>}
          </div>
          <div className="space-y-3">
            {recommendations.length > 0 ? (
              recommendations.slice(0, 3).map((stock, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  onClick={() => setSelectedRec(stock)}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-[#FFBC00]/30 transition-all cursor-pointer active:scale-95"
                >
                  <div className="flex-1 mr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{stock.name}</span>
                      <span className="text-[8px] bg-[#FFBC00] text-[#1a1a1a] px-1.5 rounded font-black">{stock.chip}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{stock.reason}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-black text-[#FFBC00]">{stock.score}점</p>
                    <p className="text-[8px] text-gray-600 uppercase">AI Score</p>
                  </div>
                </motion.div>
              ))
            ) : isRecLoading ? (
               [1, 2, 3].map((i) => (
                 <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                   <div className="space-y-2 flex-1 mr-4">
                     <div className="h-4 bg-white/10 w-1/3 rounded"></div>
                     <div className="h-3 bg-white/10 w-full rounded"></div>
                   </div>
                   <div className="w-10 h-8 bg-white/10 rounded"></div>
                 </div>
               ))
            ) : (
              <div className="text-center py-10">
                <button 
                  onClick={getRecommendations}
                  className="px-4 py-2 bg-[#FFBC00]/20 text-[#FFBC00] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#FFBC00]/30 transition-all"
                >
                  AI 분석 시작하기
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-[#FFBC00]">주요 지수 트렌드</h3>
              <p className="text-[10px] text-gray-500 mt-1">최근 7거래일간의 지수(pt) 흐름입니다.</p>
            </div>
            {isMarketLoading && <div className="w-3 h-3 border border-[#FFBC00] border-t-transparent rounded-full animate-spin"></div>}
          </div>
          
          {marketTrends ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={marketTrends.indices[selectedMarketIndex].values.map((v, i) => ({ day: `${i+1}일 전`, value: v }))}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFBC00" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FFBC00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} pt`, '현재 지수']}
                    contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                    itemStyle={{ color: '#FFBC00' }}
                    labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#FFBC00" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} dot={{ r: 3, fill: '#FFBC00' }} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4 bg-white/5 p-2 rounded-xl">
                {marketTrends.indices.map((idx, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedMarketIndex(i)}
                    className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${i === selectedMarketIndex ? 'bg-[#FFBC00] text-[#1a1a1a]' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {idx.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center bg-white/5 rounded-2xl animate-pulse">
              <p className="text-[10px] text-gray-500">마켓 데이터를 분석 중입니다...</p>
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#FFBC00]">섹터별 현황</h3>
          <div className="space-y-2">
            {marketTrends ? marketTrends.sectors.slice(0, 5).map((s, i) => (
              <div key={i} className="flex justify-between items-center p-2 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <p className="text-[10px] font-bold">{s.name}</p>
                  <p className="text-[8px] text-gray-500 line-clamp-1">{s.sentiment}</p>
                </div>
                <span className={`text-[10px] font-black italic ${s.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {s.change > 0 ? '+' : ''}{s.change}%
                </span>
              </div>
            )) : (
              [1,2,3,4,5].map(i => (
                <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[#262626]/40">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#FFBC00] mb-4">AI 리브리핑 포인트</h3>
          <div className="space-y-3">
             {briefing?.insights?.map((insight, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${insight.type === 'warning' ? 'bg-rose-400 shadow-[0_0_5px_#f43f5e]' : 'bg-emerald-400 shadow-[0_0_5px_#10b981]'}`} />
                  <p className="text-[11px] text-gray-300 leading-relaxed font-medium">{insight.content}</p>
                </div>
             ))}
          </div>
        </Card>

        <Card className="bg-emerald-500/10 border-emerald-500/20 flex flex-col items-center justify-center p-6 text-center space-y-3">
          <Sparkles className="text-emerald-400 mb-2" size={32} />
          <h4 className="font-black text-sm text-emerald-400 tracking-tight italic">리밸런싱 시뮬레이터</h4>
          <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
            현재 시장 상황을 반영한<br/>최적의 포트폴리오 비율을<br/>미리 확인해보세요.
          </p>
          <button 
            onClick={() => setShowSimulation(true)}
            className="w-full mt-2 py-3 bg-emerald-400 text-[#1a1a1a] rounded-xl font-bold text-xs hover:bg-emerald-300 transition-all shadow-lg shadow-emerald-500/20"
          >
            시뮬레이션 시작
          </button>
        </Card>
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFBC00]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans pb-24 overflow-x-hidden">
      <header className="sticky top-0 z-40 bg-[#1a1a1a]/80 backdrop-blur-xl px-6 py-5 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#FFBC00] rounded-full flex items-center justify-center shadow-lg shadow-[#FFBC00]/20">
            <span className="text-[#262626] font-black text-sm">KB</span>
          </div>
          <h1 className="font-bold text-xl tracking-tighter">머니플로우 <span className="text-[#FFBC00] font-light">MoneyFlow</span></h1>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black">{profile?.full_name}</p>
                <p className="text-[9px] text-[#FFBC00] uppercase tracking-widest">{profile?.membership_tier} Tier</p>
              </div>
              <img className="w-9 h-9 rounded-full border border-white/20" src={profile?.avatar_url || ""} alt="User" />
              <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-rose-400 transition-colors"><LogOut size={20} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Guest Mode</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {!user ? <LoginView /> : (
          <AnimatePresence mode="wait">
            {activeTab === 'home' && <HomeView key="home" />}
            {activeTab === 'assets' && <AssetsView key="assets" />}
            {activeTab === 'invest' && <InvestView key="invest" />}
            {activeTab === 'noti' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex justify-between items-center mb-2 px-2">
                  <h2 className="text-2xl font-bold tracking-tight italic">알림 & 맞춤 설정</h2>
                  <button 
                    onClick={() => setShowAddAlert(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#FFBC00] text-[#1a1a1a] rounded-full text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#FFBC00]/20"
                  >
                    <Activity size={14} />
                    알림 설정하기
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 px-2">최근 알림</h3>
                    {notifications.length > 0 ? (
                      notifications.map((noti) => (
                        <Card 
                          key={noti.id} 
                          className={`group cursor-pointer transition-all ${!noti.isRead ? 'border-[#FFBC00]/30' : ''}`}
                          onClick={() => markNotiAsRead(noti.id)}
                        >
                          <div className="flex gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                              noti.type === 'market' ? 'bg-blue-500/10 text-blue-400' : 
                              noti.type === 'asset' ? 'bg-[#FFBC00]/10 text-[#FFBC00]' : 
                              'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {noti.type === 'market' ? <Activity size={18} /> : noti.type === 'asset' ? <Wallet size={18} /> : <Zap size={18} />}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between items-start">
                                <h4 className={`text-sm font-bold tracking-tight ${!noti.isRead ? 'text-white' : 'text-gray-400'}`}>{noti.title}</h4>
                                <span className="text-[9px] text-gray-600 font-bold">{noti.time}</span>
                              </div>
                              <p className="text-[11px] text-gray-500 leading-relaxed font-medium">{noti.content}</p>
                            </div>
                            {!noti.isRead && <div className="w-1.5 h-1.5 bg-[#FFBC00] rounded-full mt-2 animate-pulse" />}
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                        <p className="text-gray-500 text-sm font-bold italic">새로운 알림이 없습니다.</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 px-2">설정된 알림</h3>
                    {alerts.length > 0 ? (
                      alerts.map((alert) => (
                        <Card key={alert.id} className="relative group">
                          <button 
                            onClick={() => removeAlert(alert.id)}
                            className="absolute top-4 right-4 text-gray-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X size={14} />
                          </button>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Badge type="default">{alert.type === 'index' ? 'MARKET INDEX' : 'STOCK PRICE'}</Badge>
                            </div>
                            <div>
                              <p className="text-sm font-black italic">{alert.target}</p>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {alert.threshold.toLocaleString()}
                                {alert.type === 'index' ? ' pt ' : ' KRW '} 
                                {alert.condition === 'above' ? '상회 시' : '하회 시'} 알림
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <Card className="border-dashed border-white/10 opacity-50 flex flex-col items-center justify-center py-10 gap-3">
                        <AlertCircle size={20} className="text-gray-600" />
                        <p className="text-[10px] text-gray-600 font-black tracking-tighter">설정된 알림이 없습니다.</p>
                      </Card>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {user && (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#1a1a1a]/90 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around px-8 z-50">
          {[
            { icon: Wallet, label: '홈', id: 'home' },
            { icon: PieChartIcon, label: '자산', id: 'assets' },
            { icon: TrendingUp, label: '투자', id: 'invest' },
            { icon: Info, label: '알림', id: 'noti' }
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === item.id ? 'text-[#FFBC00]' : 'text-gray-500'}`}
            >
              <item.icon size={22} className={activeTab === item.id ? 'drop-shadow-[0_0_8px_rgba(255,188,0,0.5)]' : ''} />
              <span className="text-[10px] font-bold tracking-tighter uppercase">{item.label}</span>
              {activeTab === item.id && <motion.div layoutId="nav-pill" className="w-1 h-1 bg-[#FFBC00] rounded-full mt-0.5 shadow-[0_0_5px_#FFBC00]" />}
            </button>
          ))}
        </nav>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full font-bold shadow-2xl backdrop-blur-xl border ${toast.type === 'error' ? 'bg-rose-500/90 border-rose-400' : 'bg-[#FFBC00]/90 border-white/20 text-[#262626]'}`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddAlert && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddAlert(false)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#262626] rounded-[2.5rem] p-8 z-[101] border border-white/10 shadow-3xl"
            >
              <h3 className="text-2xl font-black italic tracking-tighter mb-6">스마트 알림 설정</h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 ml-1">알림 대상</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setNewAlert({...newAlert, type: 'index', target: 'KOSPI'})}
                      className={`py-3 rounded-2xl text-xs font-bold transition-all ${newAlert.type === 'index' ? 'bg-[#FFBC00] text-[#1a1a1a]' : 'bg-white/5 text-gray-400'}`}
                    >
                      시장 지수
                    </button>
                    <button 
                      onClick={() => setNewAlert({...newAlert, type: 'stock', target: assets[0]?.name || ''})}
                      className={`py-3 rounded-2xl text-xs font-bold transition-all ${newAlert.type === 'stock' ? 'bg-[#FFBC00] text-[#1a1a1a]' : 'bg-white/5 text-gray-400'}`}
                    >
                      개별 종목
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 ml-1">대상 선택</label>
                  <select 
                    value={newAlert.target}
                    onChange={(e) => setNewAlert({...newAlert, target: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-[#FFBC00]/50"
                  >
                    {newAlert.type === 'index' ? (
                      marketTrends?.indices.map(idx => <option key={idx.name} value={idx.name}>{idx.name}</option>)
                    ) : (
                      assets.map(asset => <option key={asset.id} value={asset.name}>{asset.name}</option>)
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 ml-1">조건 설정</label>
                  <div className="flex gap-4">
                    <input 
                      type="number" 
                      placeholder="기준값 입력"
                      value={newAlert.threshold}
                      onChange={(e) => setNewAlert({...newAlert, threshold: e.target.value})}
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-[#FFBC00]/50"
                    />
                    <select 
                      value={newAlert.condition}
                      onChange={(e) => setNewAlert({...newAlert, condition: e.target.value as any})}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-[#FFBC00]/50"
                    >
                      <option value="above">이상 시</option>
                      <option value="below">이하 시</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowAddAlert(false)} className="flex-1 py-4 rounded-full border border-white/10 font-bold hover:bg-white/5 transition-all text-white">취소</button>
                  <button 
                    onClick={handleAddAlert}
                    className="flex-1 py-4 rounded-full bg-[#FFBC00] text-[#1a1a1a] font-bold shadow-xl shadow-[#FFBC00]/20 hover:-translate-y-1 transition-all"
                  >
                    알림 추가하기
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedRec && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRec(null)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#262626] rounded-[2.5rem] p-8 z-[101] border border-white/10 shadow-3xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setSelectedRec(null)} className="text-gray-500 hover:text-white"><X size={24} /></button>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  <Badge type="success">AI RECOMMENDATION</Badge>
                  <h3 className="text-4xl font-black italic tracking-tighter text-[#FFBC00]">{selectedRec.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-white/10 rounded-md text-[10px] font-black uppercase tracking-widest text-white/60">{selectedRec.chip}</div>
                    <div className="flex items-center gap-1 text-[#FFBC00]">
                      <Sparkles size={14} />
                      <span className="text-sm font-black italic">{selectedRec.score} AI Score</span>
                    </div>
                  </div>
                </div>

                <Card className="bg-white/5 border-white/10 p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Activity size={18} className="text-[#FFBC00]" />
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#FFBC00]">AI 추천 사유</h4>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed font-medium italic">
                    "{selectedRec.reason}"
                  </p>
                </Card>

                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase text-gray-500 px-2 tracking-widest">
                    <span>예상 수익률 (12M)</span>
                    <span className="text-emerald-400">+18.5% ~ +24.2%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-emerald-500" />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setSelectedRec(null)} className="flex-1 py-4 rounded-full border border-white/10 font-bold text-white hover:bg-white/5 transition-all">관심종목 추가</button>
                  <button 
                    onClick={() => handleBuyRec(selectedRec)}
                    disabled={isProcessing}
                    className="flex-1 py-4 rounded-full bg-[#FFBC00] text-[#1a1a1a] font-black italic shadow-xl shadow-[#FFBC00]/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? "처리 중..." : (
                      <>
                        <TrendingUp size={18} />
                        즉시 구매
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSimulation && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSimulation(false)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-[#262626] rounded-t-[3rem] p-8 pb-12 z-[101] border-t border-white/10"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-8" />
              <div className="max-w-xl mx-auto space-y-8 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-3xl font-bold tracking-tight italic">처방 시뮬레이션</h3>
                    <p className="text-sm text-gray-400 font-medium mt-1">리밸런싱 적용 후 기대 성과</p>
                  </div>
                  <div className="bg-emerald-500/10 text-emerald-400 px-5 py-3 rounded-2xl font-black text-xl border border-emerald-500/20">
                    +12.4%
                  </div>
                </div>
                <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex gap-4">
                  <AlertCircle size={20} className="text-rose-400 shrink-0 mt-1" />
                  <p className="text-xs text-gray-400 italic leading-relaxed">
                    본 처방은 AI 분석 결과에 따라 자산의 {Math.round((categoryStats[0]?.value / totalAmount) * 10 || 10)}%를 안전 자산으로 전환하는 시뮬레이션을 포함합니다.
                  </p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowSimulation(false)} className="flex-1 py-5 rounded-full border border-white/10 font-bold hover:bg-white/5 transition-all text-white">닫기</button>
                  <button 
                    onClick={handleRunSimulation} 
                    disabled={isProcessing}
                    className="flex-1 py-5 rounded-full bg-[#FFBC00] text-[#262626] font-bold shadow-xl shadow-[#FFBC00]/20 hover:-translate-y-1 transition-all disabled:opacity-50"
                  >
                    {isProcessing ? "분석 중..." : "결과 리포트에 반영"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPrescription && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPrescription(false)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-[#f8f8f8] rounded-t-[3rem] p-0 z-[101] border-t border-white/10 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="bg-[#1a1a1a] text-[#FFBC00] px-8 py-6 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#FFBC00] flex items-center justify-center text-[#1a1a1a]">
                    <Activity size={24} strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Digital Prescription</p>
                    <h3 className="text-lg font-black italic tracking-tighter">처방번호: KB-AF-{new Date().toISOString().slice(0,10).replace(/-/g,'')}</h3>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPrescription(false)} 
                  className="p-3 hover:bg-white/10 rounded-full transition-colors text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 pb-12 overflow-y-auto space-y-8 text-[#1a1a1a]">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-4 bg-[#FFBC00]"></div>
                    <span className="text-sm font-black text-gray-400 uppercase tracking-widest">진단명</span>
                    <Badge type="success">{profile?.risk_appetite === 'Aggressive' ? '수익 극대화형' : profile?.risk_appetite === 'Balanced' ? '시장 중립형' : '원금 보전형'}</Badge>
                  </div>
                  <h4 className="text-2xl font-black leading-tight tracking-tight mb-4 italic px-2">
                    "{briefing?.future?.replace('하세요.', '') || '시장 변동성에 따른 최적화'} 권고"
                  </h4>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed px-2">
                    현재 {profile?.full_name}님의 자산 구성 중 {categoryStats[0]?.name === 'Crypto' ? '가상자산' : categoryStats[0]?.name === 'Stock' ? '주식' : '일용'} 비중이 시장 과열 국면에 노출되어 있어, 안정적인 포트폴리오를 위한 즉각적인 리밸런싱을 추천합니다.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 px-2">
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-[11px] text-gray-400 font-black uppercase mb-3">현재 비중</p>
                    <div className="flex justify-between items-end">
                      <span className="text-xl font-black italic">{categoryStats[0]?.name === 'Crypto' ? '가상자산' : '고위험'}</span>
                      <span className="text-2xl text-rose-500 font-black">{Math.round((categoryStats[0]?.value / totalAmount) * 100) || 45}%</span>
                    </div>
                  </div>
                  <div className="bg-[#FFBC00]/5 p-6 rounded-3xl border border-[#FFBC00]/20 shadow-sm">
                    <p className="text-[11px] text-[#FFBC00] font-black uppercase mb-3">처방 비중</p>
                    <div className="flex justify-between items-end">
                      <span className="text-xl font-black italic">안전자산</span>
                      <span className="text-2xl text-emerald-500 font-black">{Math.round((categoryStats[0]?.value / totalAmount) * 100) - 15 || 30}%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-dashed border-gray-200 px-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <CheckCircle2 size={20} className="text-emerald-500" />
                       <span className="text-sm font-bold text-gray-600">예상 기대 효과: 포트폴리오 변동성 <span className="text-emerald-500">-12.4%</span> 감소</span>
                    </div>
                    <img src={characterImages[profile?.full_name || '비비']} className="w-14 h-14 opacity-20 grayscale" alt="KB" />
                  </div>
                </div>

                <div className="space-y-4 pt-4 px-2 text-center text-[#1a1a1a]">
                   <p className="text-[10px] text-gray-400 font-bold italic leading-relaxed px-4">
                     * 본 시뮬레이션은 AI 분석 데이터에 기반하며, 실제 투자 실행 시에는 시장 상황을 충분히 고려하시기 바랍니다.
                   </p>
                   <button 
                     onClick={() => { setShowPrescription(false); setShowSimulation(true); }}
                     className="w-full py-5 bg-[#1a1a1a] text-[#FFBC00] rounded-3xl font-black italic text-lg shadow-2xl hover:scale-[1.02] transition-all"
                   >
                     성과 시뮬레이션 상세 보기
                   </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

