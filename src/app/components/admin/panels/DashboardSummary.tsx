'use client';

import React from 'react';
import { TrendingUp, Receipt, Clock, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import type { RecentActivity } from '../types';

interface DashboardSummaryProps {
  orders?: { id: string; total: number; status: string }[];
  tables: { id: number; status: string }[];
  revenueData: { time: string; amount: number }[];
  recentActivities: RecentActivity[];
  pendingOrdersCount: number;
  occupiedTablesCount: number;
  totalToday: number;
  orderCount?: number;
}

export default function DashboardSummary({
  tables,
  revenueData,
  recentActivities,
  pendingOrdersCount,
  occupiedTablesCount,
  totalToday,
}: DashboardSummaryProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      {/* Premium KPI Widgets with Micro-charts */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-5">
        {[
          { title: '오늘 매출', value: `₩${(totalToday/10000).toLocaleString()}만`, trend: '+18.2%', isUp: true, icon: TrendingUp, color: 'blue', data: [{v:10},{v:20},{v:15},{v:30},{v:25},{v:45}] },
          { title: '주문 건수', value: '128', unit: '건', trend: '+5.4%', isUp: true, icon: Receipt, color: 'orange', data: [{v:20},{v:15},{v:25},{v:20},{v:35},{v:40}] },
          { title: '평균 조리 시간', value: '8', unit: '분', trend: '-2.1%', isUp: true, icon: Clock, color: 'purple', data: [{v:12},{v:10},{v:11},{v:9},{v:8},{v:8}] },
          { title: '테이블 점유', value: `${Math.round((occupiedTablesCount/(tables.length || 1))*100)}%`, trend: '여유', isUp: true, icon: Users, color: 'green', data: [{v:30},{v:40},{v:35},{v:60},{v:50},{v:70}] }
        ].map((kpi, idx) => {
          const colorMap: Record<string, { bg: string, text: string, chart: string, grad: string }> = {
            blue: { bg: 'bg-blue-50', text: 'text-blue-600', chart: '#3b82f6', grad: 'from-blue-500/20' },
            orange: { bg: 'bg-orange-50', text: 'text-orange-600', chart: '#f97316', grad: 'from-orange-500/20' },
            purple: { bg: 'bg-purple-50', text: 'text-purple-600', chart: '#a855f7', grad: 'from-purple-500/20' },
            green: { bg: 'bg-green-50', text: 'text-green-600', chart: '#22c55e', grad: 'from-green-500/20' },
          };
          const colors = colorMap[kpi.color];

          return (
            <div key={idx} className="bg-white rounded-3xl p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`${colors.bg} p-3 md:p-3.5 rounded-2xl`}>
                  <kpi.icon className={`w-5 h-5 md:w-6 md:h-6 ${colors.text}`} />
                </div>
                <span className={`text-[10px] md:text-xs font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 ${kpi.isUp ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                  {kpi.trend}
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-zinc-400 text-xs md:text-sm font-bold mb-1">{kpi.title}</p>
                <h3 className="text-xl md:text-3xl font-black text-zinc-900 tracking-tight">
                  {kpi.value}{kpi.unit && <span className="text-sm md:text-lg font-bold text-zinc-400 ml-1">{kpi.unit}</span>}
                </h3>
              </div>
              {/* Mini Background Chart */}
              <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 group-hover:opacity-60 transition-opacity pointer-events-none min-h-[64px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                  <AreaChart data={kpi.data}>
                    <defs>
                      <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.chart} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={colors.chart} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={colors.chart} strokeWidth={2} fill={`url(#grad-${idx})`} isAnimationActive={true} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-5">
        {/* Main Chart */}
        <div className="xl:col-span-2 bg-white rounded-3xl p-5 md:p-6 border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg md:text-xl font-black text-zinc-900">시간대별 매출 추이</h2>
              <p className="text-xs text-zinc-400 font-bold mt-1">오늘 시간당 발생한 누적 매출</p>
            </div>
            <select className="bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs md:text-sm font-bold rounded-xl px-3 py-2 outline-none hover:border-orange-500 transition-colors focus:ring-2 focus:ring-orange-500/20">
              <option>오늘</option>
              <option>이번 주</option>
            </select>
          </div>
          <div className="h-[250px] md:h-[320px] w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
              <AreaChart id="revenue-chart" key="areachart" data={revenueData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <defs key="defs">
                  <linearGradient id="colorRevenueChart1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis key="xaxis" dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa', fontWeight: 'bold' }} dy={10} />
                <YAxis key="yaxis" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa', fontWeight: 'bold' }} tickFormatter={(value) => `${value}만`} />
                <Tooltip key="tooltip" contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontWeight: 'bold', color: '#18181b' }} formatter={(value: number) => [`${value}만원`, '매출']} />
                <Area key="area" type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenueChart1)" isAnimationActive={true} activeDot={{ r: 6, fill: '#f97316', stroke: '#fff', strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Feed */}
        <div className="bg-white rounded-3xl p-5 md:p-6 border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[350px] md:h-auto relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-center mb-6 shrink-0 relative z-10">
            <div>
              <h2 className="text-lg md:text-xl font-black text-zinc-900">실시간 활동</h2>
              <p className="text-xs text-zinc-400 font-bold mt-1">매장 내 주요 알림</p>
            </div>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-5 scrollbar-hide relative z-10">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-zinc-400 font-bold text-center py-8">최근 활동이 없습니다.</p>
            ) : recentActivities.map((feed, i) => (
              <div key={i} className="flex gap-4 items-center group cursor-pointer">
                <div className={`p-3 rounded-2xl shrink-0 ${feed.bg} transition-transform group-hover:scale-110`}>
                  <feed.icon className={`w-4 h-4 md:w-5 md:h-5 ${feed.color}`} />
                </div>
                <div className="flex-1 border-b border-zinc-50 pb-3 group-hover:border-transparent transition-colors">
                  <p className="text-sm font-bold text-zinc-800 leading-tight mb-1">{feed.text}</p>
                  <p className="text-[11px] font-bold text-zinc-400">{feed.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
