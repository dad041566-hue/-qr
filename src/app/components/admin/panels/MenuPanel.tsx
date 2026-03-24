'use client';

import React from 'react';
import { Plus, PenSquare, ToggleLeft, ToggleRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { UIMenu } from '../types';

interface MenuPanelProps {
  menus: UIMenu[];
  categories: string[];
  onEditMenu: (menu?: UIMenu) => void;
  toggleAvailability: (id: string) => void;
  removeMenuItem: (id: string) => void;
  onAddMenu: () => void;
}

export default function MenuPanel({
  menus,
  onEditMenu,
  toggleAvailability,
  onAddMenu,
}: MenuPanelProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-900">메뉴 관리</h2>
          <p className="text-xs md:text-sm text-zinc-500 mt-0.5 md:mt-1">품절 처리 및 메뉴 정보를 관리하세요.</p>
        </div>
        <button
          onClick={onAddMenu}
          className="bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all shadow-[0_4px_14px_rgba(0,0,0,0.1)] active:scale-95 w-full md:w-auto flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> 새 메뉴 등록
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-5">
        {menus.map(menu => (
          <div key={menu.id} className="bg-white rounded-3xl p-5 border border-zinc-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col hover:border-orange-300 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-zinc-100/50 to-transparent rounded-bl-full pointer-events-none" />

            <div className="flex gap-4 mb-4 relative z-10">
              <div className="w-20 h-20 bg-zinc-100 rounded-[18px] overflow-hidden shrink-0 border border-zinc-200/50 relative">
                <img src={menu.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"} alt={menu.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                {menu.badge && <div className={`absolute top-1.5 left-1.5 px-2 py-0.5 text-[9px] font-black rounded-md text-white shadow-sm ${menu.badge === 'BEST' ? 'bg-red-500' : menu.badge === 'NEW' ? 'bg-blue-500' : 'bg-orange-500'}`}>{menu.badge}</div>}
              </div>
              <div className="flex-1 flex flex-col pt-1">
                <div className="flex justify-between items-start mb-1">
                  <span className="bg-zinc-100 text-zinc-600 text-[10px] md:text-xs font-bold px-2 py-1 rounded-md">{menu.category}</span>
                  <button
                    onClick={() => onEditMenu(menu)}
                    className="text-zinc-400 hover:text-orange-600 bg-zinc-50 hover:bg-orange-50 p-2 rounded-xl transition-colors -mt-1 -mr-1"
                  >
                    <PenSquare className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-extrabold text-zinc-900 text-base leading-tight mb-1">{menu.name}</h3>
                <p className="font-black text-zinc-800 text-lg tracking-tight">₩{menu.price.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-dashed border-zinc-200 flex items-center justify-between relative z-10">
              <span className="text-xs font-bold text-zinc-500">판매 상태 설정</span>
              <button
                onClick={() => toggleAvailability(menu.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
                  menu.stock ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                }`}
              >
                {menu.stock ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {menu.stock ? '판매중 (ON)' : '품절 (OFF)'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
