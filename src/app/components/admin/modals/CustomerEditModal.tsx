'use client';

import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id: string;
    name: string;
    phone?: string | null;
    kakaoFriend?: boolean;
    points: number;
  } | null;
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
  onKakaoFriendConfirm?: () => Promise<void>;
}

export function CustomerEditModal({ isOpen, onClose, customer, onSave, onKakaoFriendConfirm }: CustomerEditModalProps) {
  const [isConfirming, setIsConfirming] = React.useState(false);

  const handleKakaoConfirm = async () => {
    if (!onKakaoFriendConfirm) return;
    setIsConfirming(true);
    try {
      await onKakaoFriendConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && customer && (
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
                <h2 className="text-xl font-extrabold text-zinc-900">고객 정보 수정</h2>
                <p className="text-sm font-medium text-zinc-500 mt-0.5">{customer.name} 고객님의 정보를 수정합니다.</p>
              </div>
              <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="customer-edit-form" onSubmit={onSave} className="space-y-5">
              <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">고객명</label>
                  <p className="font-bold text-zinc-900">{customer.name}</p>
                </div>
                {customer.phone && (
                  <div className="pt-2 border-t border-zinc-200/50">
                    <label className="block text-xs font-bold text-zinc-500 mb-1">전화번호</label>
                    <p className="font-bold text-zinc-900">{customer.phone}</p>
                  </div>
                )}
                <div className="pt-2 border-t border-zinc-200/50">
                  <label className="block text-sm font-bold text-zinc-900 mb-2">보유 포인트</label>
                  <div className="flex items-center gap-3">
                    <input
                      name="points"
                      defaultValue={customer.points}
                      required
                      type="number"
                      min="0"
                      className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-3 text-lg font-black text-orange-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-right"
                    />
                    <span className="text-lg font-black text-zinc-400">P</span>
                  </div>
                </div>
              </div>

              {onKakaoFriendConfirm && !customer.kakaoFriend && (
                <button
                  type="button"
                  onClick={handleKakaoConfirm}
                  disabled={isConfirming}
                  className="w-full py-3.5 bg-yellow-400 text-yellow-900 font-bold rounded-2xl hover:bg-yellow-500 transition-colors text-sm disabled:opacity-50"
                >
                  {isConfirming ? '처리 중...' : '카카오 채널 친구 추가 확인 → 포인트 지급'}
                </button>
              )}
              {customer.kakaoFriend && (
                <div className="w-full py-3 bg-yellow-50 border border-yellow-200 text-yellow-700 font-bold rounded-2xl text-sm text-center">
                  ✓ 카카오 채널 친구
                </div>
              )}

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
                  변경사항 저장
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
