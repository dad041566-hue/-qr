'use client';

import React from 'react';
import { X, Receipt, UtensilsCrossed, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UIMenu {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: boolean;
  image?: string;
  desc?: string;
  badge?: string;
  options: unknown[];
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: number | null;
  menus: UIMenu[];
  categories: string[];
  cart: CartItem[];
  posCategory: string;
  setPosCategory: (cat: string) => void;
  onAddToCart: (menu: UIMenu) => void;
  onUpdateCartQty: (id: string, delta: number) => void;
  onPlaceOrder: () => void;
  isPlacingOrder: boolean;
}

export function AddOrderModal({
  isOpen,
  onClose,
  tableId,
  menus,
  categories,
  cart,
  posCategory,
  setPosCategory,
  onAddToCart,
  onUpdateCartQty,
  onPlaceOrder,
  isPlacingOrder,
}: AddOrderModalProps) {
  const posCategories = ['전체', ...categories];

  return (
    <AnimatePresence>
      {isOpen && tableId && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 h-[85dvh] max-h-[800px] md:h-[80dvh] bg-zinc-50 rounded-t-3xl z-[70] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-200 shrink-0">
              <div>
                <h2 className="text-xl font-black text-zinc-900">{tableId}번 테이블 주문 추가</h2>
                <p className="text-xs font-medium text-zinc-500">원하는 메뉴를 터치하여 장바구니에 담아주세요.</p>
              </div>
              <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className="flex-1 flex overflow-hidden">
                {/* POS Categories Filter */}
                <div className="w-[84px] bg-white border-r border-zinc-200 overflow-y-auto no-scrollbar shrink-0 flex flex-col z-10">
                  {posCategories.map(cat => {
                    const isActive = posCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setPosCategory(cat)}
                        className={`py-5 px-2 text-center text-sm font-bold border-b border-zinc-100 transition-colors flex items-center justify-center ${isActive ? 'bg-orange-50/50 text-orange-600 relative' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}
                      >
                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500" />}
                        {cat}
                      </button>
                    );
                  })}
                </div>

                {/* Menu List */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32 md:pb-6 grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 content-start bg-zinc-50">
                  {menus
                    .filter(m => posCategory === '전체' || m.category === posCategory)
                    .map(menu => (
                      <div
                        key={menu.id}
                        onClick={() => onAddToCart(menu)}
                        className={`bg-white rounded-2xl p-4 flex flex-col justify-between cursor-pointer border-2 transition-all ${
                          menu.stock
                            ? 'border-zinc-100 hover:border-orange-500 hover:shadow-md'
                            : 'border-zinc-100 opacity-50 grayscale'
                        }`}
                      >
                        <div className="mb-4">
                          <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md mb-2 inline-block">{menu.category}</span>
                          <h3 className="font-bold text-zinc-900 text-sm md:text-base leading-snug break-keep">{menu.name}</h3>
                        </div>
                        <div className="flex justify-between items-end">
                          <span className="font-black text-orange-600 text-sm md:text-lg">{menu.price.toLocaleString()}원</span>
                          {!menu.stock && <span className="text-xs font-bold text-red-500">품절</span>}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Cart & Order Button */}
              <div className="absolute md:relative bottom-0 left-0 right-0 md:w-80 lg:w-96 bg-white border-t md:border-t-0 md:border-l border-zinc-200 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] md:shadow-none flex flex-col h-auto max-h-[50dvh] md:max-h-none z-10">
                <div className="hidden md:flex p-4 border-b border-zinc-100 bg-zinc-50 shrink-0">
                  <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4" /> 주문 내역
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.length === 0 ? (
                    <div className="h-full min-h-[100px] flex flex-col items-center justify-center text-zinc-400 gap-2">
                      <UtensilsCrossed className="w-8 h-8 opacity-50" />
                      <p className="text-sm font-medium">선택된 메뉴가 없습니다.</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="bg-zinc-50 rounded-xl p-3 flex justify-between items-center">
                        <div className="flex-1 pr-2">
                          <p className="font-bold text-zinc-900 text-sm truncate">{item.name}</p>
                          <p className="text-xs font-bold text-orange-600">{(item.price * item.qty).toLocaleString()}원</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white rounded-lg border border-zinc-200 p-1 shrink-0">
                          <button
                            onClick={() => onUpdateCartQty(item.id, -1)}
                            className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-900 rounded-md hover:bg-zinc-100"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-sm text-zinc-900 w-3 text-center">{item.qty}</span>
                          <button
                            onClick={() => onUpdateCartQty(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-900 rounded-md hover:bg-zinc-100"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-zinc-100 bg-white shrink-0">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-zinc-500">총 주문금액</span>
                    <span className="text-xl md:text-2xl font-black text-orange-600">
                      {cart.reduce((sum, item) => sum + item.price * item.qty, 0).toLocaleString()}원
                    </span>
                  </div>
                  <button
                    onClick={onPlaceOrder}
                    disabled={cart.length === 0 || isPlacingOrder}
                    className={`w-full py-4 rounded-xl font-bold text-base md:text-lg transition-all ${
                      cart.length > 0 && !isPlacingOrder
                        ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-md shadow-orange-500/20'
                        : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                    }`}
                  >
                    {isPlacingOrder
                      ? '주문 전송 중...'
                      : cart.length > 0
                        ? `${cart.reduce((sum, item) => sum + item.qty, 0)}개 주문 넣기`
                        : '메뉴를 선택해주세요'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
