'use client';

import React from 'react';
import { Bell, Lock, Plus, X } from 'lucide-react';
import { motion } from 'motion/react';

export interface StaffCallOption {
  id: number;
  name: string;
}

interface SettingsPanelProps {
  staffCallOptions: StaffCallOption[];
  setStaffCallOptions: React.Dispatch<React.SetStateAction<StaffCallOption[]>>;
  pwNew: string;
  setPwNew: (v: string) => void;
  pwConfirm: string;
  setPwConfirm: (v: string) => void;
  pwLoading: boolean;
  handleChangePassword: (e: React.FormEvent) => Promise<void>;
  handleAddCallOption: (e: React.FormEvent<HTMLFormElement>) => void;
  handleRemoveCallOption: (id: number) => void;
}

export default function SettingsPanel({
  staffCallOptions,
  pwNew,
  setPwNew,
  pwConfirm,
  setPwConfirm,
  pwLoading,
  handleChangePassword,
  handleAddCallOption,
  handleRemoveCallOption,
}: SettingsPanelProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-900">매장 설정</h2>
          <p className="text-xs md:text-sm text-zinc-500 mt-0.5 md:mt-1">고객 주문 화면의 직원 호출 옵션 등을 설정할 수 있습니다.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-6 md:p-8 shadow-sm max-w-2xl">
        <h3 className="font-extrabold text-lg text-zinc-900 mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 text-zinc-400" /> 직원 호출 옵션 관리
        </h3>

        <div className="space-y-3 mb-6">
          {staffCallOptions.map(opt => (
            <div key={opt.id} className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
              <span className="font-bold text-zinc-800">{opt.name}</span>
              <button
                onClick={() => handleRemoveCallOption(opt.id)}
                className="text-zinc-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddCallOption} className="flex gap-2">
          <input
            type="text"
            name="name"
            placeholder="예: 물티슈 주세요, 앞치마 주세요"
            required
            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
          />
          <button
            type="submit"
            className="bg-zinc-900 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> 추가
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-6 md:p-8 shadow-sm max-w-2xl">
        <h3 className="font-extrabold text-lg text-zinc-900 mb-6 flex items-center gap-2">
          <Lock className="w-5 h-5 text-zinc-400" /> 비밀번호 변경
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">새 비밀번호</label>
            <input
              type="password"
              value={pwNew}
              onChange={e => setPwNew(e.target.value)}
              placeholder="8자 이상, 특수문자 포함"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">비밀번호 확인</label>
            <input
              type="password"
              value={pwConfirm}
              onChange={e => setPwConfirm(e.target.value)}
              placeholder="비밀번호 재입력"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={pwLoading}
            className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pwLoading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
