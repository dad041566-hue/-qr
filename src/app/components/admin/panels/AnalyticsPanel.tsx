'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie,
} from 'recharts';
import { motion } from 'motion/react';
import { WEEKLY_REVENUE, CATEGORY_SALES, TOP_MENUS } from '../types';

interface AnalyticsPanelProps {
  revenueData: { time: string; amount: number }[];
  totalToday: number;
}

export default function AnalyticsPanel({ revenueData, totalToday }: AnalyticsPanelProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-900">매출 및 통계 분석</h2>
          <p className="text-xs md:text-sm text-zinc-500 mt-0.5 md:mt-1">매장 운영에 필요한 핵심 데이터 인사이트를 제공합니다.</p>
        </div>
        <select className="bg-white border border-zinc-200 text-zinc-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none hover:border-orange-500 transition-colors focus:ring-2 focus:ring-orange-500/20 shadow-sm w-full md:w-auto">
          <option>이번 주</option>
          <option>이번 달</option>
          <option>지난 달</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: '총 누적 매출', value: '4,285,000', unit: '원', trend: '+12.5%', isUp: true },
          { label: '총 주문 건수', value: '184', unit: '건', trend: '+5.2%', isUp: true },
          { label: '평균 객단가', value: '23,280', unit: '원', trend: '-1.5%', isUp: false },
          { label: '신규 고객 유입', value: '42', unit: '명', trend: '+18.0%', isUp: true },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-3xl p-5 border border-zinc-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:border-orange-200 transition-colors">
            <p className="text-xs font-bold text-zinc-500 mb-2">{kpi.label}</p>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-xl md:text-2xl font-black text-zinc-900 tracking-tight">{kpi.value}</span>
              <span className="text-sm font-bold text-zinc-400">{kpi.unit}</span>
            </div>
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black ${kpi.isUp ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
              {kpi.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
              {kpi.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Weekly Revenue Trend */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 md:p-6 border border-zinc-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base md:text-lg font-extrabold text-zinc-900">요일별 매출 추이</h3>
            <span className="text-xs font-bold text-zinc-400 flex items-center gap-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span>이번 주</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-200"></span>지난 주</span>
            </span>
          </div>
          <div className="h-[280px] w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
              <AreaChart data={WEEKLY_REVENUE} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} tickFormatter={(val) => `${val}만`} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="prev" stroke="#e4e4e7" strokeWidth={2} fill="transparent" name="지난 주" />
                <Area type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorCurrent)" name="이번 주" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Sales Distribution */}
        <div className="bg-white rounded-3xl p-5 md:p-6 border border-zinc-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col">
          <h3 className="text-base md:text-lg font-extrabold text-zinc-900 mb-2">카테고리별 판매 비중</h3>
          <p className="text-xs text-zinc-500 mb-6 font-medium">이번 주 총 184건 주문 기준</p>

          <div className="flex-1 flex flex-col justify-center">
            <div className="h-[200px] w-full relative min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                <PieChart>
                  <Pie
                    data={CATEGORY_SALES}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    formatter={(value) => [`${value}%`, '비중']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                <span className="text-[10px] font-bold text-zinc-400">1위 카테고리</span>
                <span className="text-xl font-black text-orange-600">브런치</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {CATEGORY_SALES.map((cat, i) => (
                <div key={i} className="flex items-center gap-2 bg-zinc-50 rounded-xl p-2.5">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.fill }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-zinc-500 truncate">{cat.name}</p>
                    <p className="text-sm font-black text-zinc-900 leading-none mt-0.5">{cat.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Menus */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-5 md:p-6 border border-zinc-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <h3 className="text-base md:text-lg font-extrabold text-zinc-900 mb-6">이번 주 인기 메뉴 TOP 5</h3>
          <div className="h-[250px] w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
              <BarChart data={TOP_MENUS} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f4f4f5" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#3f3f46', fontWeight: 600 }} />
                <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)', fontSize: '12px' }} formatter={(value: number) => [`${value}개`, '판매']} />
                <Bar dataKey="sales" radius={[0, 8, 8, 0]} barSize={24}>
                  {TOP_MENUS.map((entry, index) => (
                    <Cell key={`sales-cell-${index}`} fill={index === 0 ? '#f97316' : index === 1 ? '#fb923c' : '#fdba74'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
