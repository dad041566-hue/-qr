'use client';

import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, PenSquare, ChevronRight, Plus, Minus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MenuOptionChoice {
  name: string;
  price: number;
}

interface MenuOptionGroup {
  id: string;
  name: string;
  required: boolean;
  choices: MenuOptionChoice[];
}

interface UIMenu {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: boolean;
  image?: string;
  desc?: string;
  badge?: string;
  options: MenuOptionGroup[];
}

interface MenuEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingMenu: UIMenu | null;
  categories: string[];
  onSave: (e: React.FormEvent<HTMLFormElement>, menuOptions: MenuOptionGroup[]) => void;
  onImageUpload: (file: File) => Promise<string>;
}

export function MenuEditModal({
  isOpen,
  onClose,
  editingMenu,
  categories,
  onSave,
  onImageUpload,
}: MenuEditModalProps) {
  const [menuOptions, setMenuOptions] = useState<MenuOptionGroup[]>([]);
  const [localImage, setLocalImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      setMenuOptions(editingMenu?.options ?? []);
      setLocalImage(editingMenu?.image);
    }
  }, [isOpen, editingMenu]);

  const handleAddOptionGroup = () => {
    setMenuOptions(prev => [
      ...prev,
      { id: Date.now().toString(), name: '', required: false, choices: [{ name: '', price: 0 }] },
    ]);
  };

  const handleRemoveOptionGroup = (groupId: string) => {
    setMenuOptions(prev => prev.filter(opt => opt.id !== groupId));
  };

  const handleAddOptionChoice = (groupId: string) => {
    setMenuOptions(prev =>
      prev.map(opt =>
        opt.id === groupId
          ? { ...opt, choices: [...opt.choices, { name: '', price: 0 }] }
          : opt
      )
    );
  };

  const handleRemoveOptionChoice = (groupId: string, choiceIndex: number) => {
    setMenuOptions(prev =>
      prev.map(opt =>
        opt.id === groupId
          ? { ...opt, choices: opt.choices.filter((_, idx) => idx !== choiceIndex) }
          : opt
      )
    );
  };

  const handleOptionChange = (groupId: string, field: string, value: string | boolean) => {
    setMenuOptions(prev =>
      prev.map(opt => (opt.id === groupId ? { ...opt, [field]: value } : opt))
    );
  };

  const handleChoiceChange = (groupId: string, choiceIndex: number, field: string, value: string | number) => {
    setMenuOptions(prev =>
      prev.map(opt => {
        if (opt.id !== groupId) return opt;
        const newChoices = [...opt.choices];
        newChoices[choiceIndex] = { ...newChoices[choiceIndex], [field]: value };
        return { ...opt, choices: newChoices };
      })
    );
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await onImageUpload(file);
      setLocalImage(url);
    } catch {
      // handled by caller
    }
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    onSave(e, menuOptions);
  };

  const hasCategories = categories.length > 0;

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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-zinc-50 rounded-[32px] z-[70] shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"
          >
            <div className="flex items-center justify-between p-6 bg-white border-b border-zinc-100 shrink-0 sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-extrabold text-zinc-900">{editingMenu ? '메뉴 정보 수정' : '새 메뉴 등록'}</h2>
                <p className="text-sm font-medium text-zinc-500 mt-1">{editingMenu ? '기존 메뉴의 정보를 변경합니다.' : '새로운 메뉴를 추가합니다.'}</p>
              </div>
              <button onClick={onClose} className="p-2.5 text-zinc-400 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1 space-y-6">
              <form id="menu-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload Area */}
                <div className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                  <label className="flex items-center justify-between text-sm font-bold text-zinc-900 mb-3">
                    메뉴 이미지
                    <span className="text-xs font-medium text-zinc-400 font-normal">권장 사이즈 800x800px</span>
                  </label>
                  <input type="file" accept="image/*" className="hidden" id="menu-image-input" onChange={handleImageChange} />
                  <div
                    onClick={() => document.getElementById('menu-image-input')?.click()}
                    className="w-full h-48 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center text-zinc-400 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-500 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    {localImage ? (
                      <>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col items-center justify-center text-white">
                          <PenSquare className="w-8 h-8 mb-2" />
                          <span className="font-bold text-sm">이미지 변경</span>
                        </div>
                        <img src={localImage} alt={editingMenu?.name ?? ''} className="w-full h-full object-cover" />
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                          <ImageIcon className="w-6 h-6 text-zinc-400 group-hover:text-orange-500" />
                        </div>
                        <span className="text-sm font-bold text-zinc-700">이미지 업로드</span>
                        <span className="text-xs font-medium text-zinc-400 mt-1">클릭하여 파일 선택</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-zinc-900 mb-2">메뉴명 <span className="text-orange-500">*</span></label>
                    <input
                      name="name"
                      defaultValue={editingMenu?.name}
                      required
                      type="text"
                      placeholder="예: 트러플 머쉬룸 파스타"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:font-medium placeholder:text-zinc-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-zinc-900 mb-2">카테고리 <span className="text-orange-500">*</span></label>
                      {hasCategories ? (
                        <div className="relative">
                          <select
                            name="category"
                            defaultValue={editingMenu?.category ?? categories[0]}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all appearance-none"
                          >
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <ChevronRight className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                        </div>
                      ) : (
                        <p className="text-xs text-orange-500 font-medium bg-orange-50 px-3 py-2.5 rounded-xl">
                          카테고리를 먼저 추가하세요.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-zinc-900 mb-2">가격 (원) <span className="text-orange-500">*</span></label>
                      <input
                        name="price"
                        defaultValue={editingMenu?.price}
                        required
                        type="number"
                        placeholder="예: 18000"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-sm font-black text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:font-medium placeholder:text-zinc-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-900 mb-2">메뉴 설명 (선택)</label>
                    <textarea
                      name="desc"
                      rows={3}
                      defaultValue={editingMenu?.desc ?? ''}
                      placeholder="고객이 메뉴를 잘 이해할 수 있도록 설명을 작성해주세요."
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none placeholder:text-zinc-400"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="block text-sm font-bold text-zinc-900 mb-3">배지 설정 (선택)</label>
                    <div className="flex gap-2">
                      {['없음', 'BEST', 'NEW', 'HIT'].map(badge => (
                        <label key={badge} className="flex-1 cursor-pointer">
                          <input
                            type="radio"
                            name="badge"
                            value={badge}
                            defaultChecked={
                              editingMenu?.badge
                                ? badge.toLowerCase() === editingMenu.badge.toLowerCase() || (badge === '없음' && !editingMenu.badge)
                                : badge === '없음'
                            }
                            className="peer sr-only"
                          />
                          <div className="text-center py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-500 peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:text-orange-600 transition-all">
                            {badge}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Options Configuration */}
                <div className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-zinc-900">추가 옵션 설정</label>
                    <button
                      type="button"
                      onClick={handleAddOptionGroup}
                      className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-2 rounded-xl flex items-center gap-1.5 hover:bg-orange-100 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> 옵션 그룹 추가
                    </button>
                  </div>

                  {menuOptions.length === 0 ? (
                    <div className="text-center py-10 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                      <p className="text-sm text-zinc-500 font-medium">등록된 추가 옵션이 없습니다.<br /><span className="text-xs mt-1 block">(예: 사이즈업, 맵기 조절, 토핑 추가)</span></p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {menuOptions.map((optGroup) => (
                        <div key={optGroup.id} className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 relative">
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionGroup(optGroup.id)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          <div className="pr-8 space-y-4">
                            <div className="flex gap-3">
                              <input
                                type="text"
                                placeholder="옵션 그룹명 (예: 사이즈, 맵기)"
                                value={optGroup.name}
                                onChange={(e) => handleOptionChange(optGroup.id, 'name', e.target.value)}
                                className="flex-1 bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-bold text-zinc-900 focus:outline-none focus:border-orange-500 transition-colors"
                              />
                              <label className="flex items-center gap-2 cursor-pointer bg-white border border-zinc-200 px-3 py-2 rounded-xl">
                                <input
                                  type="checkbox"
                                  checked={optGroup.required}
                                  onChange={(e) => handleOptionChange(optGroup.id, 'required', e.target.checked)}
                                  className="accent-orange-500 w-4 h-4"
                                />
                                <span className="text-xs font-bold text-zinc-700">필수 선택</span>
                              </label>
                            </div>

                            <div className="space-y-2">
                              {optGroup.choices.map((choice, cIdx) => (
                                <div key={cIdx} className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    placeholder="항목명 (예: 라지)"
                                    value={choice.name}
                                    onChange={(e) => handleChoiceChange(optGroup.id, cIdx, 'name', e.target.value)}
                                    className="flex-[2] bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm font-medium text-zinc-900 focus:outline-none focus:border-orange-500 transition-colors"
                                  />
                                  <div className="flex-1 relative">
                                    <input
                                      type="number"
                                      placeholder="추가금"
                                      value={choice.price || ''}
                                      onChange={(e) => handleChoiceChange(optGroup.id, cIdx, 'price', Number(e.target.value))}
                                      className="w-full bg-white border border-zinc-200 rounded-lg pl-3 pr-6 py-2 text-sm font-medium text-zinc-900 focus:outline-none focus:border-orange-500 transition-colors text-right"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-bold">원</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOptionChoice(optGroup.id, cIdx)}
                                    className="p-2 text-zinc-400 hover:text-red-500 transition-colors shrink-0"
                                    disabled={optGroup.choices.length === 1}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => handleAddOptionChoice(optGroup.id)}
                                className="w-full py-2 bg-white border border-dashed border-zinc-300 text-zinc-500 text-xs font-bold rounded-lg hover:border-orange-500 hover:text-orange-500 transition-colors flex items-center justify-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" /> 상세 항목 추가
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="p-6 bg-white border-t border-zinc-100 shrink-0 flex gap-3 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-zinc-100 text-zinc-700 font-bold rounded-2xl hover:bg-zinc-200 transition-colors"
              >
                취소
              </button>
              <button
                form="menu-form"
                type="submit"
                className="flex-[2] py-4 bg-zinc-900 text-white font-bold text-lg rounded-2xl hover:bg-zinc-800 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" /> {editingMenu ? '수정 완료' : '메뉴 등록하기'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
