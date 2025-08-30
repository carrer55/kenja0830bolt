import React, { useMemo } from 'react';
import { Info, TrendingUp, TrendingDown } from 'lucide-react';
import { useUserData } from '../hooks/useUserData';

function StatsCards() {
  const { userData, loading } = useUserData();

  const statsData = useMemo(() => [
    {
      title: '今月の出張日当',
      value: `¥${userData.stats.monthlyBusinessTrips.toLocaleString()}`,
      trend: userData.stats.monthlyBusinessTrips > 0 ? `+${userData.stats.monthlyBusinessTrips > 50000 ? '高' : '中'}` : 'なし',
      trendUp: userData.stats.monthlyBusinessTrips > 0,
      chartColor: 'from-gray-500 to-gray-700',
      data: userData.stats.monthlyBusinessTrips
    },
    {
      title: '今月の交通費・宿泊費',
      value: `¥${userData.stats.monthlyExpenses.toLocaleString()}`,
      trend: userData.stats.monthlyExpenses > 0 ? `+${userData.stats.monthlyExpenses > 50000 ? '高' : '中'}` : 'なし',
      trendUp: userData.stats.monthlyExpenses > 0,
      chartColor: 'from-gray-400 to-gray-600',
      data: userData.stats.monthlyExpenses
    },
    {
      title: '今月の精算合計',
      value: `¥${(userData.stats.monthlyExpenses + userData.stats.monthlyBusinessTrips).toLocaleString()}`,
      trend: `承認済み¥${userData.stats.approvedAmount > 0 ? userData.stats.approvedAmount.toLocaleString() : '0'}`,
      trendUp: userData.stats.approvedAmount > 0,
      chartColor: 'from-gray-600 to-gray-800',
      data: userData.stats.monthlyExpenses + userData.stats.monthlyBusinessTrips
    }
  ], [userData.stats]);

  // データが読み込み中の場合はスケルトン表示
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            className="backdrop-blur-xl bg-white/20 rounded-xl p-4 lg:p-6 border border-white/30 shadow-xl relative overflow-hidden"
          >
            <div className="animate-pulse">
              <div className="h-4 bg-slate-300 rounded mb-4"></div>
              <div className="h-8 bg-slate-300 rounded mb-4"></div>
              <div className="h-4 bg-slate-300 rounded mb-4"></div>
              <div className="h-12 bg-slate-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
      {statsData.map((stat, index) => (
        <div
          key={index}
          className="backdrop-blur-xl bg-white/20 rounded-xl p-4 lg:p-6 border border-white/30 shadow-xl hover:shadow-2xl hover:bg-white/30 transition-all duration-300 group relative overflow-hidden"
        >
          {/* Glass effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-white/20 backdrop-blur-xl"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-indigo-50/10"></div>
          
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-700 text-sm font-medium relative z-10">{stat.title}</h3>
            <Info className="w-4 h-4 text-slate-500 relative z-10" />
          </div>
          
          <div className="mb-4 relative z-10">
            <p className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">{stat.value}</p>
            <div className="flex items-center space-x-2">
              {stat.trendUp ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ${stat.trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                {stat.trend}
              </span>
            </div>
          </div>

          {/* Mini Chart */}
          <div className="h-12 relative z-10">
            {index === 0 && (
              <svg className="w-full h-full" viewBox="0 0 200 48">
                <path
                  d="M0 40 Q50 20 100 25 T200 15"
                  fill="none"
                  stroke="url(#gradient1)"
                  strokeWidth="2"
                  className="group-hover:stroke-[3] transition-all"
                />
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1e3a8a" />
                    <stop offset="100%" stopColor="#1e40af" />
                  </linearGradient>
                </defs>
              </svg>
            )}
            {index === 1 && (
              <div className="flex items-end justify-between h-full space-x-1">
                {[40, 35, 45, 50, 42, 48, 38].map((height, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-t from-navy-600 to-navy-800 rounded-sm transition-all duration-300 group-hover:scale-105"
                    style={{ height: `${height}%`, width: '12%' }}
                  />
                ))}
              </div>
            )}
            {index === 2 && (
              <svg className="w-full h-full" viewBox="0 0 200 48">
                <path
                  d="M0 30 Q50 35 100 20 T200 25"
                  fill="none"
                  stroke="url(#gradient3)"
                  strokeWidth="2"
                  className="group-hover:stroke-[3] transition-all"
                />
                <defs>
                  <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1e3a8a" />
                    <stop offset="100%" stopColor="#1e40af" />
                  </linearGradient>
                </defs>
              </svg>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatsCards;