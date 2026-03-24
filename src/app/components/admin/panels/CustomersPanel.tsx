'use client';

import React from 'react';
import { Search, Settings, PenSquare } from 'lucide-react';
import { motion } from 'motion/react';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  points: number;
  visits: number;
  lastVisit: string;
}

interface CustomersPanelProps {
  customers: Customer[];
  onEditCustomer: (customer: Customer) => void;
  pointRate: number;
  onEditPointPolicy: () => void;
}

export default function CustomersPanel({
  customers,
  onEditCustomer,
  onEditPointPolicy,
}: CustomersPanelProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-900">고객/포인트 관리</h2>
          <p className="text-xs md:text-sm text-zinc-500 mt-0.5 md:mt-1">가입된 고객의 방문 내역과 적립 포인트를 관리합니다.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="flex-1 md:w-64 bg-white border border-zinc-200 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2">
            <Search className="w-4 h-4 text-zinc-400" />
            <input type="text" placeholder="고객명/연락처 검색" className="bg-transparent border-none outline-none text-zinc-800 placeholder:text-zinc-400 w-full" />
          </div>
          <button
            onClick={onEditPointPolicy}
            className="bg-zinc-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0"
          >
            <Settings className="w-4 h-4" /> 정책 설정
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {customers.map(customer => (
          <div key={customer.id} className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col hover:border-orange-300 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/5 to-transparent rounded-bl-full pointer-events-none" />
            <div className="flex justify-between items-start mb-5 relative z-10">
              <div>
                <h3 className="font-extrabold text-zinc-900 text-lg flex items-center gap-2 mb-0.5">
                  {customer.name}
                  {customer.visits >= 10 && <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-md shadow-sm">VIP</span>}
                </h3>
                <p className="text-xs font-bold text-zinc-400">{customer.phone}</p>
              </div>
              <button
                onClick={() => onEditCustomer(customer)}
                className="text-zinc-400 hover:text-orange-600 bg-zinc-50 hover:bg-orange-50 p-2 rounded-xl transition-colors"
              >
                <PenSquare className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-4 flex justify-between items-center relative z-10">
              <span className="text-orange-800 text-xs font-bold">보유 포인트</span>
              <div className="text-orange-600 font-black text-xl tracking-tight">
                {customer.points.toLocaleString()} <span className="text-sm font-bold ml-0.5">P</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-auto relative z-10">
              <div className="bg-zinc-50 rounded-2xl p-3.5 border border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 mb-1">총 방문 횟수</p>
                <p className="font-black text-zinc-800 text-sm">{customer.visits}회</p>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-3.5 border border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 mb-1">최근 방문일</p>
                <p className="font-black text-zinc-800 text-sm">{customer.lastVisit}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
