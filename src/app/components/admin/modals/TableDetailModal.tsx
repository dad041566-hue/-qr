'use client';

import React from 'react';
import { X, Minus, Plus, Users, CheckCircle2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UIOrderItem {
  name: string;
  qty: number;
  price: number;
  option?: string;
}

interface UIOrder {
  id: string;
  table: number;
  items: UIOrderItem[];
  total: number;
  status: string;
  time: number;
  type: string;
  pax: number;
}

interface UITable {
  id: number;
  _realId: string;
  status: string;
  time: string;
  amount: number;
  pax: number;
}

interface TableDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: UITable | null;
  orders: UIOrder[];
  onUpdatePax: (tableId: number, pax: number) => void;
  onCancelMenuItem: (tableId: number, orderId: string, itemIdx: number) => void;
  onCancelOrder: (tableId: number) => void;
  onMarkOccupied: (tableId: number) => void;
  onMarkAvailable: (tableId: number) => void;
  onCheckout: (tableId: number) => void;
  onAddOrder: (tableId: number) => void;
}

export function TableDetailModal({
  isOpen,
  onClose,
  table,
  orders,
  onUpdatePax,
  onCancelMenuItem,
  onCancelOrder,
  onMarkOccupied,
  onMarkAvailable,
  onCheckout,
  onAddOrder,
}: TableDetailModalProps) {
  return (
    <AnimatePresence>
      {isOpen && table && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-3xl z-[70] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-zinc-900">{table.id}번 테이블</h2>
                {table.status === 'occupied' && (
                  <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2.5 py-1 rounded-lg">이용중</span>
                )}
                {table.status === 'available' && (
                  <span className="bg-zinc-100 text-zinc-600 text-xs font-bold px-2.5 py-1 rounded-lg">빈자리</span>
                )}
                {table.status === 'cleaning' && (
                  <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-lg">정리중</span>
                )}
              </div>
              <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 bg-zinc-50/50">
              {table.status === 'occupied' ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                    <div className="text-center flex-1 border-r border-zinc-100">
                      <p className="text-xs font-bold text-zinc-500 mb-1">입장 시간</p>
                      <p className="text-sm font-black text-zinc-900">{table.time}</p>
                    </div>
                    <div className="text-center flex-1 flex flex-col items-center">
                      <p className="text-xs font-bold text-zinc-500 mb-1">인원수</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdatePax(table.id, Math.max(0, (table.pax || 0) - 1))}
                          className="w-5 h-5 rounded bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-black text-zinc-900 w-4">{table.pax || 0}</span>
                        <button
                          onClick={() => onUpdatePax(table.id, (table.pax || 0) + 1)}
                          className="w-5 h-5 rounded bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
                    <h4 className="font-bold text-zinc-900 mb-3 text-sm">주문 내역</h4>
                    {(() => {
                      const tableOrders = orders.filter(o => o.table === table.id);
                      return tableOrders.length > 0 ? (
                        <>
                          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-2">
                            {tableOrders.map(order => (
                              <div key={order.id} className="space-y-2">
                                {order.items.map((item, itemIdx) => (
                                  <div key={itemIdx} className="flex justify-between items-start gap-2 p-2 rounded-lg hover:bg-zinc-50 transition-colors group">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-zinc-700 text-sm">
                                          {item.name} {item.qty > 1 ? `x ${item.qty}` : ''}
                                        </span>
                                      </div>
                                      {item.option && (
                                        <p className="text-xs text-zinc-400 mt-0.5">옵션: {item.option}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-zinc-900 text-sm whitespace-nowrap">
                                        {((item.price || 0) * item.qty).toLocaleString()}원
                                      </span>
                                      {/* TODO: API 연동 후 활성화 */}
                                      {/*
                                      <button
                                        onClick={() => onCancelMenuItem(table.id, order.id, itemIdx)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                                        title="메뉴 취소"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                      */}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                          <div className="pt-3 border-t border-zinc-100 flex justify-between items-center">
                            <span className="font-bold text-zinc-500 text-sm">총 주문 금액</span>
                            <span className="font-black text-orange-600 text-lg">{table.amount.toLocaleString()}원</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-center text-zinc-400 text-sm py-8">주문 내역이 없습니다.</p>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => onCancelOrder(table.id)}
                      className="py-3.5 bg-zinc-100 text-zinc-600 font-bold rounded-xl hover:bg-zinc-200 transition-colors col-span-2 flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> 주문 취소 및 빈자리 전환
                    </button>
                    <button
                      onClick={() => onAddOrder(table.id)}
                      className="py-3.5 bg-white border-2 border-orange-500 text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-colors"
                    >
                      주문 추가
                    </button>
                    <button
                      onClick={() => onCheckout(table.id)}
                      className="py-3.5 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors shadow-md"
                    >
                      정산 완료
                    </button>
                  </div>
                </div>
              ) : table.status === 'available' ? (
                <div className="py-8 text-center space-y-6">
                  <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Users className="w-10 h-10 text-zinc-400" />
                  </div>
                  <p className="text-zinc-500 font-medium">현재 빈 자리입니다.</p>
                  <button
                    onClick={() => onMarkOccupied(table.id)}
                    className="w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-md"
                  >
                    손님 착석 처리 (이용중 전환)
                  </button>
                </div>
              ) : (
                <div className="py-8 text-center space-y-6">
                  <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-10 h-10 text-yellow-500" />
                  </div>
                  <p className="text-zinc-500 font-medium">테이블을 정리하고 있습니다.</p>
                  <button
                    onClick={() => { onMarkAvailable(table.id); onClose(); }}
                    className="w-full py-3.5 bg-yellow-400 text-yellow-900 font-black rounded-xl hover:bg-yellow-500 transition-colors shadow-md"
                  >
                    정리 완료 (빈자리 전환)
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
