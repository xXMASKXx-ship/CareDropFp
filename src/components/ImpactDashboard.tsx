import { useEffect, useState } from 'react';
import { BarChart3, Leaf, Heart } from 'lucide-react';
import { supabase, type Stats } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Theme } from '@/lib/themes';

export function ImpactDashboard({ theme }: { theme: Theme }) {
  const { session } = useAuth();
  const [stats, setStats] = useState<{ wasteStopped: number; peopleHelped: number }>({
    wasteStopped: 3450,
    peopleHelped: 890,
  });

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('stats-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stats' },
        () => fetchStats()
      )
      .subscribe();

    const fetchStats = async () => {
      const { data, error } = await supabase.from('stats').select('*').eq('id', 1).maybeSingle();
      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }
      const s = data as Stats | null;
      setStats({
        wasteStopped: 3450 + (s?.waste_stopped || 0),
        peopleHelped: 890 + (s?.people_helped || 0),
      });
    };

    fetchStats();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-4">
        <div
          className={`inline-flex items-center space-x-2 ${theme.bgSoft} border ${theme.borderSoft} ${theme.textPrimary} px-4 py-2 rounded-full text-sm font-bold transition-colors`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Real-time Global Impact</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Making a Measurable Difference
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Every routed item represents a meal saved, an illness treated, and a person warmed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div
          className={`relative bg-gradient-to-br ${theme.gradient} rounded-3xl p-10 shadow-2xl ${theme.shadowLg} overflow-hidden transform hover:scale-[1.02] transition-all duration-500`}
        >
          <Leaf className="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-10 rotate-12" />
          <div className="relative z-10 text-white">
            <h3 className="text-white/80 font-bold text-xl mb-2 uppercase tracking-wider">
              Total Waste Prevented
            </h3>
            <div className="flex items-baseline space-x-2 mb-4">
              <span className="text-7xl font-extrabold tracking-tighter">
                {stats.wasteStopped.toLocaleString()}
              </span>
              <span className="text-2xl font-bold text-white/80">kg</span>
            </div>

            <div className="mt-8">
              <div className="flex justify-between text-sm font-bold text-white/80 mb-2">
                <span>Monthly Goal Progress</span>
                <span>86%</span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden border border-white/10">
                <div className="bg-white h-3 rounded-full w-[86%] shadow-lg"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-10 shadow-2xl shadow-slate-900/30 overflow-hidden transform hover:scale-[1.02] transition-all duration-500">
          <Heart
            className="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-5 -rotate-12"
            fill="currentColor"
          />
          <div className="relative z-10 text-white">
            <h3 className="text-slate-400 font-bold text-xl mb-2 uppercase tracking-wider">
              Individuals Assisted
            </h3>
            <div className="flex items-baseline space-x-2 mb-4">
              <span className="text-7xl font-extrabold tracking-tighter">
                {stats.peopleHelped.toLocaleString()}
              </span>
              <span className="text-2xl font-bold text-slate-400">people</span>
            </div>

            <div className="mt-8">
              <div className="flex justify-between text-sm font-bold text-slate-400 mb-2">
                <span>Community Reach Expansion</span>
                <span className={theme.textPrimary}>+12% this week</span>
              </div>
              <div className="flex space-x-1 h-3">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm ${i < 7 ? theme.bgPrimary : 'bg-white/10'}`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
