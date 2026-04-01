'use client';

import React from 'react';
import { Gift, ChevronRight, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export interface EventSettings {
  enabled: boolean;
  title: string;
  desc: string;
  reward: string;
}

export interface PointEvent {
  id: string;
  name: string;
  points: number;
  isActive: boolean;
}

export interface CustomerOption {
  id: string;
  name: string;
  phone?: string | null;
}

interface EventPanelProps {
  eventSettings: EventSettings;
  setEventSettings: React.Dispatch<React.SetStateAction<EventSettings>>;
  storeId: string;
  pointEvents?: PointEvent[];
  customers?: CustomerOption[];
  onGrantEventPoint?: (customerId: string, event: PointEvent) => Promise<void>;
}

export default function EventPanel({ eventSettings, setEventSettings, pointEvents = [], customers = [], onGrantEventPoint }: EventPanelProps) {
  const [grantingEventId, setGrantingEventId] = React.useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<Record<string, string>>({});
  const [isGranting, setIsGranting] = React.useState<string | null>(null);

  const activeEvents = React.useMemo(() => pointEvents.filter((e) => e.isActive), [pointEvents]);

  const handleGrant = async (event: PointEvent) => {
    const customerId = selectedCustomerId[event.id];
    if (!customerId || !onGrantEventPoint) return;
    setIsGranting(event.id);
    try {
      await onGrantEventPoint(customerId, event);
      setGrantingEventId(null);
      setSelectedCustomerId((prev) => ({ ...prev, [event.id]: '' }));
    } finally {
      setIsGranting(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-900">이벤트 관리</h2>
          <p className="text-xs md:text-sm text-zinc-500 mt-0.5 md:mt-1">고객의 QR 주문 화면에 노출될 이벤트를 설정합니다.</p>
        </div>
        <button
          onClick={() => toast.success('이벤트 설정이 저장되었습니다.')}
          className="bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors shadow-sm self-start md:self-auto"
        >
          설정 저장하기
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-extrabold text-lg text-zinc-900">이벤트 활성화</h3>
            <button
              onClick={() => setEventSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                eventSettings.enabled ? 'bg-orange-500' : 'bg-zinc-200'
              }`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm ${
                eventSettings.enabled ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className={`space-y-5 transition-opacity ${!eventSettings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">이벤트 제목</label>
              <input
                type="text"
                value={eventSettings.title}
                onChange={e => setEventSettings(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">이벤트 설명</label>
              <input
                type="text"
                value={eventSettings.desc}
                onChange={e => setEventSettings(prev => ({ ...prev, desc: e.target.value }))}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">제공 혜택 (리워드)</label>
              <input
                type="text"
                value={eventSettings.reward}
                onChange={e => setEventSettings(prev => ({ ...prev, reward: e.target.value }))}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-zinc-100 rounded-2xl md:rounded-3xl border border-zinc-200 p-6 md:p-8 flex flex-col items-center justify-center">
          <p className="text-sm font-bold text-zinc-500 mb-4">고객 QR 화면 미리보기</p>
          <div className="w-full max-w-[320px] bg-white rounded-[2rem] shadow-xl overflow-hidden border-4 border-zinc-900 h-[400px] flex flex-col relative">
            <div className="h-40 bg-zinc-800 relative shrink-0">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <p className="text-white/80 text-[10px] font-medium mb-1">환영합니다! 지금 계신 곳은</p>
                <h1 className="text-xl font-extrabold text-white flex items-end gap-1">5번 테이블 <span className="text-xs font-normal text-white/70 mb-0.5">입니다</span></h1>
              </div>
            </div>
            <div className="flex-1 bg-zinc-50 p-3">
              {eventSettings.enabled ? (
                <div className="w-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl p-3 flex items-center justify-between shadow-md text-white">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0"><Gift className="w-4 h-4 text-white" /></div>
                    <div className="text-left overflow-hidden pr-2">
                      <h4 className="font-bold text-xs truncate">{eventSettings.title}</h4>
                      <p className="text-[10px] text-white/90 mt-0.5 truncate">{eventSettings.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/80 shrink-0" />
                </div>
              ) : (
                <div className="w-full bg-zinc-200 border-2 border-dashed border-zinc-300 rounded-xl p-4 flex items-center justify-center text-zinc-400">
                  <span className="text-xs font-bold">이벤트 배너 숨김 상태</span>
                </div>
              )}
              <div className="flex gap-2 mt-4 overflow-hidden">
                <div className="w-14 h-16 rounded-xl bg-orange-50 border border-orange-200 shrink-0" />
                <div className="w-14 h-16 rounded-xl bg-white border border-zinc-200 shrink-0" />
                <div className="w-14 h-16 rounded-xl bg-white border border-zinc-200 shrink-0" />
                <div className="w-14 h-16 rounded-xl bg-white border border-zinc-200 shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 포인트 이벤트 지급 */}
      {activeEvents.length > 0 && (
        <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5 text-orange-500" />
            <h3 className="font-extrabold text-lg text-zinc-900">포인트 이벤트 지급</h3>
          </div>
          <div className="space-y-4">
            {activeEvents.map((event) => (
              <div key={event.id} className="border border-zinc-100 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-extrabold text-zinc-900">{event.name}</p>
                    <p className="text-sm font-bold text-orange-500">{event.points.toLocaleString()}P 지급</p>
                  </div>
                  <button
                    onClick={() => setGrantingEventId(grantingEventId === event.id ? null : event.id)}
                    className="text-sm font-bold text-zinc-600 hover:text-orange-600 bg-zinc-50 hover:bg-orange-50 px-4 py-2 rounded-xl transition-colors"
                  >
                    {grantingEventId === event.id ? '닫기' : '고객에게 지급'}
                  </button>
                </div>

                {grantingEventId === event.id && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-100">
                    <select
                      value={selectedCustomerId[event.id] ?? ''}
                      onChange={(e) => setSelectedCustomerId((prev) => ({ ...prev, [event.id]: e.target.value }))}
                      className="flex-1 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm font-bold text-zinc-900 focus:outline-none focus:border-orange-500 bg-zinc-50"
                    >
                      <option value="">고객 선택...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}{c.phone ? ` (${c.phone})` : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleGrant(event)}
                      disabled={!selectedCustomerId[event.id] || isGranting === event.id}
                      className="px-4 py-2.5 bg-orange-500 text-white font-bold rounded-xl text-sm hover:bg-orange-600 transition-colors disabled:opacity-40 shrink-0"
                    >
                      {isGranting === event.id ? '지급 중...' : '지급'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
