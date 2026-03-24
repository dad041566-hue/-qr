'use client';

import React from 'react';
import { Users, Volume2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { minutesAgo } from '../types';

interface WaitingEntry {
  id: string;
  queue_number: number;
  phone: string;
  party_size: number;
  created_at: string;
}

interface WaitingPanelProps {
  waitings: WaitingEntry[];
  callWaiting: (waitingId: string, queueNumber: number) => Promise<void>;
  completeWaiting: (waitingId: string, queueNumber: number) => Promise<void>;
  onOpenKioskMode: () => void;
}

export default function WaitingPanel({
  waitings,
  callWaiting,
  completeWaiting,
  onOpenKioskMode,
}: WaitingPanelProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-900">웨이팅 관리</h2>
          <p className="text-xs md:text-sm text-zinc-500 mt-0.5 md:mt-1">고객 대기 명단을 관리하고 입장/호출을 진행하세요.</p>
        </div>
        <button onClick={onOpenKioskMode} className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors shadow-sm self-start md:self-auto">
          웨이팅 기기 모드 띄우기
        </button>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="bg-zinc-50 border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
          <span className="font-extrabold text-zinc-800">현재 대기 <span className="text-orange-500">{waitings.length}</span>팀</span>
        </div>

        {waitings.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 font-medium">
            현재 대기중인 고객이 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            <AnimatePresence>
              {waitings.map((w) => (
                <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }} key={w.id} className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-zinc-50/50 transition-colors">
                  <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center font-black text-xl md:text-2xl shrink-0">
                      {w.queue_number}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-black text-lg md:text-xl text-zinc-900">{w.phone}</h4>
                        <span className="bg-zinc-100 text-zinc-600 text-xs font-bold px-2 py-1 rounded-md">{minutesAgo(w.created_at)}분 전 등록</span>
                      </div>
                      <p className="text-sm font-bold text-zinc-500 flex items-center gap-1"><Users className="w-4 h-4"/> 인원: {w.party_size}명</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <button data-testid="waiting-call" onClick={() => callWaiting(w.id, w.queue_number)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-blue-50 text-blue-600 px-4 py-3 md:py-2.5 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors">
                      <Volume2 className="w-4 h-4" /> 호출하기
                    </button>
                    <button data-testid="waiting-seat" onClick={() => completeWaiting(w.id, w.queue_number)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-zinc-900 text-white px-6 py-3 md:py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors shadow-md">
                      <Check className="w-4 h-4" /> 입장 완료
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
