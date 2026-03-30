'use client';

import React from 'react';
import { Plus, Printer, Download, Link2, QrCode } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import type { UITable } from '../types';

interface QRPanelProps {
  tables: UITable[];
  storeSlug: string;
  onAddTable: () => Promise<void>;
}

export default function QRPanel({ tables, storeSlug, onAddTable }: QRPanelProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-900">고정 QR 코드 관리</h2>
          <p className="text-xs md:text-sm text-zinc-500 mt-0.5 md:mt-1">테이블별 고유 QR 코드를 생성하고 출력하여 부착하세요.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => toast.success('전체 QR 코드가 인쇄 대기열에 추가되었습니다.')} className="flex-1 md:flex-none bg-white border border-zinc-200 text-zinc-700 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-50 transition-colors shadow-sm flex items-center justify-center gap-2">
            <Printer className="w-4 h-4" /> 전체 인쇄
          </button>
          <button onClick={onAddTable} className="flex-1 md:flex-none bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors shadow-sm flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> 테이블 추가
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
        {tables.map(table => (
          <div key={table.id} className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-4 md:p-6 shadow-sm flex flex-col items-center text-center hover:border-orange-500 transition-colors group">
            <h3 className="font-black text-lg md:text-xl text-zinc-900 mb-1">테이블 {table.id}</h3>
            <p className="text-[10px] md:text-xs font-medium text-zinc-400 mb-4 md:mb-6 flex items-center gap-1">
              <Link2 className="w-3 h-3" /> .../m/{storeSlug}/{table.qrToken?.slice(0, 8)}...
            </p>

            <div className="w-24 h-24 md:w-32 md:h-32 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-orange-50 group-hover:border-orange-200 transition-colors">
              <QrCode className="w-10 h-10 md:w-16 md:h-16 text-zinc-300 group-hover:text-orange-500 transition-colors" />
            </div>

            <div className="w-full grid grid-cols-2 gap-2">
              <button onClick={() => toast.success(`${table.id}번 테이블 QR 다운로드 완료`)} className="flex items-center justify-center gap-1.5 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs md:text-sm font-bold hover:bg-zinc-200 transition-colors">
                <Download className="w-3.5 h-3.5" /> <span className="hidden md:inline">저장</span>
              </button>
              <button onClick={() => toast.success(`${table.id}번 테이블 QR 인쇄 시작`)} className="flex items-center justify-center gap-1.5 py-2 bg-orange-50 text-orange-600 rounded-xl text-xs md:text-sm font-bold hover:bg-orange-100 transition-colors">
                <Printer className="w-3.5 h-3.5" /> <span className="hidden md:inline">인쇄</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
