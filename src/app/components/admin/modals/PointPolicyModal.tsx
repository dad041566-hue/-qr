'use client';

import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PointPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  pointRate: number;
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function PointPolicyModal({ isOpen, onClose, pointRate, onSave }: PointPolicyModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-[32px] z-[70] shadow-2xl overflow-hidden flex flex-col p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-zinc-900">포인트 정책 설정</h2>
                <p className="text-sm font-medium text-zinc-500 mt-0.5">주문 금액에 대한 적립률을 설정합니다.</p>
              </div>
              <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="point-policy-form" onSubmit={onSave} className="space-y-6">
              <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100">
                <label className="block text-sm font-bold text-zinc-900 mb-2">기본 적립률 (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    name="rate"
                    defaultValue={pointRate}
                    required
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-3 text-lg font-black text-orange-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-center"
                  />
                  <span className="text-lg font-black text-zinc-400">%</span>
                </div>
                <p className="text-xs text-zinc-500 font-medium mt-3 text-center">예: 5% 설정 시 10,000원 주문하면 500P 적립</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 bg-zinc-100 text-zinc-700 font-bold rounded-2xl hover:bg-zinc-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-[0.98]"
                >
                  저장하기
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
