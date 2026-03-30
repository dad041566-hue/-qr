'use client';

import React from 'react';
import { Clock, Users } from 'lucide-react';
import { motion } from 'motion/react';
import type { UITable } from '../types';

interface TablesPanelProps {
  tables: UITable[];
  onTableClick: (table: UITable) => void;
  markTableAvailable: (id: number) => void;
  occupiedTablesCount: number;
  onAddTable?: () => void;
}

export default function TablesPanel({
  tables,
  onTableClick,
  markTableAvailable,
  occupiedTablesCount,
  onAddTable,
}: TablesPanelProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0 mb-2">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-900">홀 테이블 현황</h2>
          <p className="text-xs md:text-sm text-zinc-500 mt-0.5 md:mt-1">터치하여 테이블 상세 상태를 변경하세요.</p>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          {onAddTable && (
            <button
              onClick={onAddTable}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
            >
              + 테이블 추가
            </button>
          )}
          <div className="flex gap-3 md:gap-4 bg-white p-2 md:p-0 rounded-xl md:bg-transparent shadow-sm md:shadow-none border border-zinc-100 md:border-none">
            <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm font-bold text-zinc-600"><div className="w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-orange-500"></div> 이용중 ({occupiedTablesCount})</div>
            <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm font-bold text-zinc-600"><div className="w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-zinc-200"></div> 빈자리 ({tables.filter(t=>t.status==='available').length})</div>
            <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm font-bold text-zinc-600"><div className="w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-yellow-400"></div> 정리중 ({tables.filter(t=>t.status==='cleaning').length})</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-8 border border-zinc-100 md:border-zinc-200 shadow-sm md:min-h-[600px]">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {tables.map(table => (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={table.id}
              onClick={() => onTableClick(table)}
              className={`relative h-28 md:h-40 rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-col justify-between transition-all cursor-pointer border-2 shadow-sm ${
                table.status === 'occupied'
                  ? 'border-orange-500 bg-orange-50'
                  : table.status === 'cleaning'
                  ? 'border-yellow-400 bg-yellow-50'
                  : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-xl md:text-3xl font-black ${table.status === 'occupied' ? 'text-orange-600' : table.status === 'cleaning' ? 'text-yellow-600' : 'text-zinc-400'}`}>
                  {table.id}
                </span>
                {table.status === 'occupied' && (
                  <span className="text-[10px] md:text-xs font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    <Users className="w-3 h-3" /> {table.pax}명
                  </span>
                )}
              </div>

              {table.status === 'occupied' && (
                <div className="mt-auto">
                  <div className="flex justify-between items-end">
                    <div className="text-[10px] md:text-sm font-bold flex items-center gap-1 text-orange-600">
                      <Clock className="w-3 h-3 md:w-4 md:h-4" /> {table.time}
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] md:text-[10px] text-orange-800/60 font-bold mb-0.5">주문금액</p>
                      <p className="text-sm md:text-lg font-black text-orange-700 leading-none truncate">
                        ₩{(table.amount/10000).toFixed(1)}만
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {table.status === 'cleaning' && (
                <div className="mt-auto flex flex-col items-center">
                  <span className="text-[10px] md:text-sm font-bold text-yellow-800 mb-1.5 md:mb-2">정리중</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); markTableAvailable(table.id); }}
                    className="bg-yellow-400 text-yellow-900 text-[10px] md:text-xs font-black py-1 md:py-1.5 px-3 md:px-4 rounded-full hover:bg-yellow-500 transition-colors w-full"
                  >
                    정리 완료
                  </button>
                </div>
              )}

              {table.status === 'available' && (
                <div className="mt-auto flex justify-center pb-1 md:pb-2">
                  <span className="text-zinc-400 font-bold text-xs md:text-sm">빈자리</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
