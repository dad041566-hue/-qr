import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ShoppingBag, ChevronLeft, Plus, Minus, Search, X, BellRing, Receipt, Utensils, Coffee, LayoutGrid, Droplets, Star, User, Gift, ChevronRight, MessageCircle, CreditCard, Banknote } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useMenu, type MenuItem } from '@/hooks/useMenu';
import { createOrder } from '@/lib/api/order';

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  '브런치': Utensils,
  '커피': Coffee,
  '음료': Droplets,
  '디저트': Star,
};

export function CustomerMenu() {
  const { storeSlug, tableId } = useParams();
  const navigate = useNavigate();
  const { store, table, categories, items, loading, error } = useMenu(storeSlug, tableId);
  const [activeCategory, setActiveCategory] = useState('전체');
  const [cart, setCart] = useState<{ id: string, cartId: string, name: string, price: number, qty: number, options: string[], image: string }[]>([]);
  
  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCallStaffOpen, setIsCallStaffOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isEventOpen, setIsEventOpen] = useState(false);
  
  // Complex flows state
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  const [itemQuantity, setItemQuantity] = useState(1);
  
  // User & Splash
  const [user, setUser] = useState<{name: string, points: number} | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const [orderHistory, setOrderHistory] = useState<Array<{
    id: string;
    items: Array<{name: string, qty: number, price: number, options: string[]}>;
    total: number;
    time: Date;
    status: string;
  }>>([]);

  const categoryTabs = [
    { id: '전체', icon: LayoutGrid },
    ...categories.map(cat => ({
      id: cat.name,
      icon: CATEGORY_ICON_MAP[cat.name] ?? LayoutGrid,
    })),
  ];

  const filteredItems = items.filter(item =>
    activeCategory === '전체' ? true : item.category === activeCategory
  );

  const totalItems = cart.reduce((a, b) => a + b.qty, 0);
  const totalPrice = cart.reduce((total, item) => total + (item.price * item.qty), 0);

  const openItemDetail = (item: MenuItem) => {
    setSelectedItem(item);
    setItemQuantity(1);
    
    // Auto-select first choice for required options
    const defaultOptions: {[key: string]: string} = {};
    if (item.options) {
      item.options.forEach(opt => {
        if (opt.required) {
          defaultOptions[opt.name] = opt.choices[0].name;
        }
      });
    }
    setSelectedOptions(defaultOptions);
  };

  const handleOptionSelect = (optionName: string, choiceName: string, isRequired: boolean) => {
    if (isRequired) {
      setSelectedOptions(prev => ({ ...prev, [optionName]: choiceName }));
    } else {
      setSelectedOptions(prev => {
        const newOpts = { ...prev };
        if (newOpts[optionName] === choiceName) {
          delete newOpts[optionName]; // Toggle off if already selected
        } else {
          newOpts[optionName] = choiceName;
        }
        return newOpts;
      });
    }
  };

  const addToCart = () => {
    if (!selectedItem) return;
    
    // Calculate extra price from options
    let extraPrice = 0;
    const optionStrings: string[] = [];
    
    if (selectedItem.options) {
      selectedItem.options.forEach(opt => {
        const choice = selectedOptions[opt.name];
        if (choice) {
          const choiceObj = opt.choices.find(c => c.name === choice);
          if (choiceObj) {
            extraPrice += choiceObj.price;
            optionStrings.push(`${opt.name}: ${choice}`);
          }
        }
      });
    }

    const cartItem = {
      id: selectedItem.id,
      cartId: Math.random().toString(36).substring(7),
      name: selectedItem.name,
      price: selectedItem.price + extraPrice,
      qty: itemQuantity,
      options: optionStrings,
      image: selectedItem.image
    };

    setCart(prev => [...prev, cartItem]);
    setSelectedItem(null);
    toast.success('장바구니에 담겼습니다.');
  };

  const updateCartItemQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        return { ...item, qty: Math.max(0, item.qty + delta) };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const handleOrder = async () => {
    if (totalItems === 0 || !store || !table) return;

    try {
      const result = await createOrder({
        storeId: store.id,
        tableId: table.id,
        items: cart.map(item => ({
          menuItemId: item.id,
          menuItemName: item.name,
          unitPrice: item.price,
          quantity: item.qty,
          totalPrice: item.price * item.qty,
          selectedOptions: item.options.map(opt => {
            const [group, choice] = opt.split(': ');
            return { group, choice, extra_price: 0 };
          }),
        })),
      });

      const newOrder = {
        id: result.orderId,
        items: cart.map(item => ({
          name: item.name,
          qty: item.qty,
          price: item.price,
          options: item.options
        })),
        total: totalPrice,
        time: new Date(),
        status: '조리 대기중'
      };

      setOrderHistory(prev => [newOrder, ...prev]);

      toast.success(`주문이 성공적으로 접수되었습니다! (${table.table_number}번 테이블)`, {
        description: '주방으로 주문이 전달되었습니다.',
        duration: 4000,
      });

      if (user) {
        const earnedPoints = Math.floor(totalPrice * 0.05);
        setUser(prev => prev ? { ...prev, points: prev.points + earnedPoints } : null);
        toast(`포인트 ${earnedPoints.toLocaleString()}P가 적립되었습니다.`, { icon: '✨' });
      }

      setCart([]);
      setIsCartOpen(false);
    } catch (err) {
      toast.error('주문에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleCallStaff = (reason: string) => {
    toast.info(`직원을 호출했습니다. 잠시만 기다려주세요.`, {
      description: `요청사항: ${reason}`,
      icon: <BellRing className="w-5 h-5 text-blue-500" />
    });
    setIsCallStaffOpen(false);
  };

  const handleLogin = () => {
    setUser({ name: '단골손님', points: 1500 });
    setIsLoginOpen(false);
    toast.success('로그인이 완료되었습니다!');
  };

  if (loading) return <div className="flex items-center justify-center h-screen">로딩 중...</div>;
  if (error) return <div className="flex items-center justify-center h-screen text-red-500">오류가 발생했습니다</div>;

  return (
    <div className="min-h-screen bg-zinc-900 sm:bg-zinc-100 flex justify-center pb-0 sm:pb-28 font-sans">
      <div className="w-full max-w-md bg-zinc-50 min-h-[100dvh] sm:min-h-screen sm:shadow-[0_0_40px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col sm:rounded-[40px] sm:mt-10 sm:border-8 sm:border-zinc-800">
        
        {/* Splash/QR Simulation Screen */}
        <AnimatePresence>
          {showSplash && (
            <motion.div
              key="splash"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 z-[100] bg-zinc-900 flex flex-col items-center justify-center text-white"
            >
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ duration: 0.5, type: "spring" }}
                className="w-48 h-48 sm:w-56 sm:h-56 relative mb-12"
              >
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-orange-500 rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-orange-500 rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-orange-500 rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-orange-500 rounded-br-2xl" />
                <motion.div 
                  initial={{ top: 0 }} animate={{ top: '100%' }} transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                  className="absolute left-0 right-0 h-1 bg-orange-500 shadow-[0_0_20px_5px_rgba(249,115,22,0.6)] z-10 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <div className="w-2/3 h-2/3 border-[8px] border-dashed border-white rounded-3xl" />
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-center">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1, type: "spring" }} className="bg-orange-500/20 text-orange-400 font-bold px-6 py-2.5 rounded-full text-sm inline-flex items-center gap-2 mb-6 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" /> 테이블 {table?.table_number}번 인식 완료
                </motion.div>
                <h2 className="text-3xl font-black mb-3 tracking-tight">메뉴판을 준비하고 있어요</h2>
                <p className="text-zinc-400 text-sm font-medium">잠시만 기다려주세요...</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cover Image & Header */}
        <div className="relative h-[240px] bg-zinc-900 overflow-hidden shrink-0">
          <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" alt="Cafe Cover" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/50" />
          
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start text-white z-10">
            <div className="flex gap-2">
              <button onClick={() => navigate('/')} className="px-3 py-2 bg-black/30 backdrop-blur-md rounded-full hover:bg-black/50 transition-colors border border-white/20 flex items-center gap-1 shadow-sm">
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-bold pr-1">뒤로</span>
              </button>
              {!user ? (
                <button onClick={() => setIsLoginOpen(true)} className="px-3 py-2 bg-black/30 backdrop-blur-md rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 hover:bg-black/50 transition-colors border border-white/20 shadow-sm">
                  <User className="w-4 h-4" /> 로그인
                </button>
              ) : (
                <button onClick={() => setIsLoginOpen(true)} className="px-3 py-2 bg-orange-500/80 backdrop-blur-md rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 border border-orange-400 shadow-sm text-white">
                  <User className="w-4 h-4" /> {user.name}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsCallStaffOpen(true)} className="px-3 py-2 bg-black/30 backdrop-blur-md rounded-full hover:bg-black/50 transition-colors border border-white/20 flex items-center gap-1.5 shadow-sm">
                <BellRing className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-bold">호출</span>
              </button>
              <button onClick={() => setIsOrderHistoryOpen(true)} className="relative px-3 py-2 bg-black/30 backdrop-blur-md rounded-full hover:bg-black/50 transition-colors border border-white/20 flex items-center gap-1.5 shadow-sm text-white">
                <Receipt className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-bold">
                  {orderHistory.length > 0 
                    ? `₩${orderHistory.reduce((sum, o) => sum + o.total, 0).toLocaleString()}` 
                    : '내역'}
                </span>
                {orderHistory.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-zinc-900 animate-pulse"></span>}
              </button>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 z-10">
            <p className="text-white/80 text-sm font-bold mb-1.5 drop-shadow-md">{user ? `${user.name}님, 환영합니다! 지금 계신 곳은` : '환영합니다! 지금 계신 곳은'}</p>
            <h1 className="text-4xl font-black text-white flex items-end gap-2 drop-shadow-lg tracking-tight">테이블 {table?.table_number} <span className="text-lg font-bold text-white/80 mb-1.5 tracking-normal">입니다</span></h1>
          </div>
        </div>

        {/* Event Banner */}
        <div className="px-4 py-3 bg-zinc-50 z-10 relative">
          <button onClick={() => setIsEventOpen(true)} className="w-full bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-white transform transition active:scale-[0.98]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shrink-0 shadow-inner"><Gift className="w-5 h-5 text-white" /></div>
              <div className="text-left">
                <h4 className="font-extrabold text-sm leading-tight text-orange-400 mb-0.5">네이버 영수증 리뷰 이벤트 🎉</h4>
                <p className="text-[11px] text-zinc-300 font-medium">참여하고 아메리카노 1잔 무료로 받기!</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-500 shrink-0" />
          </button>
        </div>
        
        {/* Categories & Menu List Container */}
        <div className="flex-1 flex overflow-hidden bg-zinc-50">
          {/* Left Vertical Categories */}
          <div className="w-[84px] sm:w-[96px] bg-white border-r border-zinc-200 overflow-y-auto no-scrollbar shrink-0 flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            {categoryTabs.map(cat => {
              const isActive = activeCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button 
                  key={cat.id} 
                  onClick={() => setActiveCategory(cat.id)} 
                  className={`flex flex-col items-center justify-center py-6 px-2 gap-2 border-b border-zinc-50 transition-all ${isActive ? 'bg-zinc-50 relative' : 'bg-white hover:bg-zinc-50/50'}`}
                >
                  {isActive && <motion.div layoutId="activeCat" className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500 rounded-r-full" />}
                  <Icon className={`w-6 h-6 transition-colors ${isActive ? 'text-orange-500' : 'text-zinc-400'}`} />
                  <span className={`text-xs sm:text-sm transition-all ${isActive ? 'text-zinc-900 font-extrabold' : 'text-zinc-500 font-medium'}`}>{cat.id}</span>
                </button>
              )
            })}
          </div>

          {/* Menu List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 relative scroll-smooth">
            <AnimatePresence mode="popLayout">
              {filteredItems.map(item => (
                <motion.div key={item.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} onClick={() => openItemDetail(item)} className="bg-white rounded-[24px] p-3 sm:p-4 shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-zinc-100 flex gap-4 relative cursor-pointer hover:border-orange-200 transition-all active:scale-[0.98]">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[18px] overflow-hidden shrink-0 relative bg-zinc-100 shadow-sm">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                    {item.badge && <div className={`absolute top-2 left-2 px-2.5 py-1 text-[10px] font-black rounded-lg text-white shadow-sm ${item.badge === 'BEST' ? 'bg-red-500' : item.badge === 'NEW' ? 'bg-blue-500' : 'bg-orange-500'}`}>{item.badge}</div>}
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-0.5 pr-1">
                    <div>
                      <h3 className="font-extrabold text-zinc-900 text-sm sm:text-base leading-snug break-keep">{item.name}</h3>
                      <p className="text-[11px] sm:text-xs text-zinc-500 mt-1.5 leading-relaxed line-clamp-2">{item.desc}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-black text-zinc-900 text-base tracking-tight">₩{item.price.toLocaleString()}</span>
                      <button className="w-8 h-8 flex items-center justify-center bg-zinc-100 text-zinc-600 rounded-full hover:bg-orange-50 hover:text-orange-500 transition-colors"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Floating Cart Button */}
        <AnimatePresence>
          {totalItems > 0 && !isCartOpen && (
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="absolute bottom-6 left-4 right-4 z-20">
              <button onClick={() => setIsCartOpen(true)} className="w-full bg-zinc-900 text-white p-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center justify-between hover:bg-zinc-800 transition-all border border-zinc-800 active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <div className="relative bg-zinc-800 w-12 h-12 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-orange-400" />
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-extrabold w-6 h-6 flex items-center justify-center rounded-full border-2 border-zinc-900 shadow-sm animate-bounce">{totalItems}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-zinc-400 text-xs font-bold">총 주문예상금액</p>
                    <p className="font-black text-lg tracking-tight">₩{totalPrice.toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-white text-zinc-900 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center gap-1.5">
                  주문 확인 <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Item Detail Modal */}
        <AnimatePresence>
          {selectedItem && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedItem(null)} className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm" />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-50 flex flex-col shadow-2xl max-h-[90vh] overflow-hidden">
                <div className="relative h-72 shrink-0 bg-zinc-100">
                  <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 p-2.5 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition border border-white/10"><X className="w-5 h-5" /></button>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    {selectedItem.badge && <span className="inline-block bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-md mb-2">{selectedItem.badge}</span>}
                    <h2 className="text-2xl sm:text-3xl font-black mb-2 leading-tight">{selectedItem.name}</h2>
                    <p className="text-white/80 text-sm leading-relaxed font-medium">{selectedItem.desc}</p>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50 pb-32">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-100">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-zinc-500">기본 금액</span>
                      <span className="text-2xl font-black text-zinc-900 tracking-tight">₩{selectedItem.price.toLocaleString()}</span>
                    </div>
                  </div>

                  {selectedItem.options && selectedItem.options.map((opt, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-100">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-black text-zinc-900 text-lg">{opt.name}</h4>
                        {opt.required ? (
                          <span className="bg-orange-50 text-orange-600 text-xs font-bold px-2.5 py-1 rounded-lg">필수 선택</span>
                        ) : (
                          <span className="bg-zinc-100 text-zinc-500 text-xs font-bold px-2.5 py-1 rounded-lg">선택 (추가)</span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {opt.choices.map((choice, cIdx) => {
                          const isSelected = selectedOptions[opt.name] === choice.name;
                          return (
                            <button 
                              key={cIdx} 
                              onClick={() => handleOptionSelect(opt.name, choice.name, opt.required)}
                              className={`w-full flex justify-between items-center p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-orange-500 bg-orange-50/50' : 'border-zinc-100 hover:border-zinc-200'}`}
                            >
                              <span className={`font-bold ${isSelected ? 'text-orange-700' : 'text-zinc-700'}`}>{choice.name}</span>
                              <span className={`text-sm ${isSelected ? 'text-orange-600 font-bold' : 'text-zinc-400 font-medium'}`}>
                                {choice.price > 0 ? `+₩${choice.price.toLocaleString()}` : '추가금 없음'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-between">
                    <span className="font-bold text-zinc-900">수량 선택</span>
                    <div className="flex items-center gap-4 bg-zinc-50 rounded-full p-1 border border-zinc-200">
                      <button onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-zinc-600 shadow-sm hover:bg-zinc-100"><Minus className="w-4 h-4" /></button>
                      <span className="text-lg font-black w-6 text-center text-zinc-900">{itemQuantity}</span>
                      <button onClick={() => setItemQuantity(itemQuantity + 1)} className="w-10 h-10 bg-zinc-900 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-zinc-800"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-zinc-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] z-10 pb-safe">
                  <button onClick={addToCart} className="w-full bg-orange-500 text-white py-4 sm:py-5 rounded-2xl font-black text-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 flex justify-center items-center gap-2 active:scale-[0.98]">
                    <ShoppingBag className="w-5 h-5" /> {(selectedItem.price * itemQuantity).toLocaleString()}원 담기
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Cart Overlay Drawer */}
        <AnimatePresence>
          {isCartOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="absolute inset-0 bg-black/60 z-30 backdrop-blur-sm" />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-40 max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-6 flex justify-between items-center bg-white sticky top-0 z-10 border-b border-zinc-100">
                  <div>
                    <h2 className="font-extrabold text-2xl text-zinc-900">장바구니</h2>
                    <p className="text-sm text-zinc-500 mt-1 font-medium">선택하신 메뉴를 확인해주세요.</p>
                  </div>
                  <button onClick={() => setIsCartOpen(false)} className="bg-zinc-100 hover:bg-zinc-200 p-3 rounded-full transition-colors"><X className="w-5 h-5 text-zinc-600" /></button>
                </div>
                
                <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4 bg-zinc-50/50">
                  {cart.map((item) => (
                    <div key={item.cartId} className="flex justify-between items-start bg-white p-4 rounded-2xl border border-zinc-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                      <div className="flex gap-4">
                        <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover bg-zinc-100" />
                        <div className="py-1">
                          <h4 className="font-bold text-zinc-900 text-base mb-1">{item.name}</h4>
                          {item.options.length > 0 && (
                            <ul className="text-[11px] text-zinc-500 mb-2 space-y-0.5">
                              {item.options.map((opt, i) => <li key={i}>• {opt}</li>)}
                            </ul>
                          )}
                          <p className="text-orange-600 font-black text-sm">₩{(item.price * item.qty).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between h-20">
                        <button onClick={() => updateCartItemQuantity(item.cartId, -item.qty)} className="text-zinc-300 hover:text-red-500 p-1 transition-colors"><X className="w-4 h-4" /></button>
                        <div className="flex items-center gap-3 bg-zinc-50 rounded-full p-1 border border-zinc-200">
                          <button onClick={() => updateCartItemQuantity(item.cartId, -1)} className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-zinc-600 shadow-sm"><Minus className="w-3 h-3" /></button>
                          <span className="text-sm font-bold w-4 text-center text-zinc-900">{item.qty}</span>
                          <button onClick={() => updateCartItemQuantity(item.cartId, 1)} className="w-7 h-7 bg-zinc-900 text-white rounded-full flex items-center justify-center shadow-sm"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-white border-t border-zinc-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] pb-safe">
                  {user && (
                    <div className="flex justify-between items-center mb-5 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                      <span className="text-orange-800 text-sm font-bold flex items-center gap-2"><Star className="w-4 h-4 text-orange-500 fill-orange-500" /> 주문 시 적립 예정 포인트</span>
                      <span className="text-orange-600 font-black">{Math.floor(totalPrice * 0.05).toLocaleString()} P</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-zinc-500 font-bold text-lg">총 주문금액</span>
                    <span className="text-3xl font-black text-zinc-900 tracking-tight">₩{totalPrice.toLocaleString()}</span>
                  </div>
                  <button onClick={handleOrder} className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 flex justify-center items-center gap-2 active:scale-[0.98]">
                    <ShoppingBag className="w-6 h-6" /> 주문하기
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Existing Modals (Login, Event, History, CallStaff) - Keeping structure identical but minified for space */}
        <AnimatePresence>
          {isLoginOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLoginOpen(false)} className="absolute inset-0 bg-black/60 z-50 backdrop-blur-sm" />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-50 p-6 pb-safe flex flex-col shadow-2xl">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="font-extrabold text-2xl text-zinc-900">{user ? '내 정보' : '로그인 / 회원가입'}</h2>
                    <p className="text-sm text-zinc-500 mt-1 font-medium">포인트를 적립하고 다양한 혜택을 누리세요.</p>
                  </div>
                  <button onClick={() => setIsLoginOpen(false)} className="bg-zinc-100 hover:bg-zinc-200 p-2.5 rounded-full transition-colors"><X className="w-5 h-5 text-zinc-600" /></button>
                </div>
                {!user ? (
                  <div className="space-y-3">
                    <button onClick={handleLogin} className="w-full bg-[#FEE500] text-[#000000] py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition hover:bg-[#F4DC00] active:scale-[0.98] shadow-sm"><MessageCircle className="w-5 h-5 fill-current" /> 카카오로 3초만에 시작하기</button>
                    <button onClick={handleLogin} className="w-full bg-zinc-100 text-zinc-700 py-4 rounded-2xl font-bold text-[15px] transition hover:bg-zinc-200 active:scale-[0.98]">휴대폰 번호로 계속하기</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-orange-800 text-sm font-bold mb-1">사용 가능한 포인트</p>
                        <h3 className="text-3xl font-black text-orange-600 tracking-tight">{user.points.toLocaleString()}<span className="text-lg ml-1">P</span></h3>
                      </div>
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm"><Star className="w-6 h-6 text-orange-500 fill-orange-500" /></div>
                    </div>
                    <button onClick={() => { setUser(null); setIsLoginOpen(false); }} className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-2xl font-bold text-[15px] hover:bg-zinc-200 transition active:scale-[0.98]">로그아웃</button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isEventOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEventOpen(false)} className="absolute inset-0 bg-black/60 z-50 backdrop-blur-sm" />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-50 flex flex-col shadow-2xl overflow-hidden">
                <div className="p-8 bg-gradient-to-br from-orange-500 to-pink-500 text-white relative">
                   <button onClick={() => setIsEventOpen(false)} className="absolute top-6 right-6 text-white/80 hover:text-white bg-black/10 p-2.5 rounded-full backdrop-blur-sm transition-colors"><X className="w-5 h-5"/></button>
                   <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md mb-5 shadow-inner"><Gift className="w-7 h-7 text-white" /></div>
                   <h2 className="font-extrabold text-2xl tracking-tight mb-2">영수증 리뷰 작성하고<br/>시원한 커피 한 잔!</h2>
                   <p className="text-white/90 text-sm leading-relaxed">사진과 함께 예쁜 리뷰를 남겨주시면<br/>현장에서 즉시 <b>아메리카노 1잔</b>을 드립니다.</p>
                </div>
                <div className="p-6 bg-white space-y-3 pb-safe">
                  <div className="flex gap-4 p-5 bg-zinc-50 rounded-2xl border border-zinc-100 shadow-sm">
                    <div className="w-7 h-7 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">1</div>
                    <p className="text-sm text-zinc-700 font-bold pt-1">하단 버튼을 눌러 직원에게 영수증을 먼저 요청해주세요.</p>
                  </div>
                  <div className="flex gap-4 p-5 bg-zinc-50 rounded-2xl border border-zinc-100 shadow-sm">
                    <div className="w-7 h-7 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">2</div>
                    <p className="text-sm text-zinc-700 font-bold pt-1">네이버 마이플레이스에 영수증을 인증하고 리뷰를 작성합니다.</p>
                  </div>
                  <button onClick={() => { setIsEventOpen(false); handleCallStaff('영수증 요청 (리뷰 이벤트 참여)'); }} className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-bold mt-4 hover:bg-zinc-800 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center gap-2 active:scale-[0.98]">
                    <Receipt className="w-5 h-5" /> 영수증 요청하기 (직원 호출)
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isOrderHistoryOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOrderHistoryOpen(false)} className="absolute inset-0 bg-black/60 z-50 backdrop-blur-sm" />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="absolute bottom-0 left-0 right-0 bg-zinc-50 rounded-t-[32px] z-50 max-h-[90vh] flex flex-col shadow-2xl pb-safe">
                <div className="p-6 flex justify-between items-center bg-white sticky top-0 rounded-t-[32px] z-10 border-b border-zinc-100">
                  <div>
                    <h2 className="font-extrabold text-2xl text-zinc-900 mb-1">주문 내역</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-500 font-medium">총 주문금액</span>
                      <span className="text-lg font-black text-orange-600">₩{orderHistory.reduce((sum, o) => sum + o.total, 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <button onClick={() => setIsOrderHistoryOpen(false)} className="bg-zinc-100 hover:bg-zinc-200 p-2.5 rounded-full transition-colors"><X className="w-5 h-5 text-zinc-600" /></button>
                </div>
                <div className="p-5 overflow-y-auto flex-1 space-y-4">
                  {orderHistory.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-5"><Receipt className="w-10 h-10 text-zinc-300" /></div>
                      <h3 className="font-bold text-zinc-900 text-lg mb-1">주문 내역이 없습니다</h3>
                      <p className="text-zinc-500 text-sm font-medium">맛있는 메뉴를 먼저 주문해주세요.</p>
                    </div>
                  ) : (
                    orderHistory.map(order => (
                      <div key={order.id} className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500" />
                        <div className="flex justify-between items-center mb-4 border-b border-zinc-100 pb-4">
                          <div>
                            <span className="text-xs font-bold text-zinc-400 mb-0.5 block">{order.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <h4 className="font-black text-zinc-900 text-lg">{order.id}</h4>
                          </div>
                          <span className="bg-orange-50 text-orange-600 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-orange-100"><span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>{order.status}</span>
                        </div>
                        <ul className="space-y-3 mb-5">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="text-sm">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-zinc-900 font-bold">{item.name} <span className="text-orange-500 ml-1.5 font-black">{item.qty}개</span></span>
                                <span className="text-zinc-900 font-bold tracking-tight">₩{(item.price * item.qty).toLocaleString()}</span>
                              </div>
                              {item.options && item.options.length > 0 && (
                                <p className="text-xs text-zinc-400 font-medium leading-relaxed">• {item.options.join(', ')}</p>
                              )}
                            </li>
                          ))}
                        </ul>
                        <div className="flex justify-between items-center pt-4 border-t border-dashed border-zinc-200">
                          <span className="font-bold text-zinc-500">총 주문금액</span>
                          <span className="font-black text-xl text-orange-600 tracking-tight">₩{order.total.toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isCallStaffOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCallStaffOpen(false)} className="absolute inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl">
                  <div className="bg-zinc-900 p-8 text-center relative">
                    <button onClick={() => setIsCallStaffOpen(false)} className="absolute top-5 right-5 text-zinc-400 hover:text-white transition-colors bg-white/10 p-2 rounded-full"><X className="w-5 h-5" /></button>
                    <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20"><BellRing className="w-8 h-8 text-white" /></div>
                    <h3 className="text-2xl font-extrabold text-white mb-2">직원 호출</h3>
                    <p className="text-zinc-400 text-sm font-medium">필요하신 서비스를 선택해주세요.</p>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-3 bg-zinc-50">
                    {['직원만 호출', '물/얼음물 주세요', '물티슈 주세요', '앞치마 주세요', '주문 수정할게요', '기타 문의'].map(reason => (
                      <button key={reason} onClick={() => handleCallStaff(reason)} className="bg-white border border-zinc-200 p-4 rounded-2xl font-bold text-zinc-700 hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600 transition-all text-sm shadow-[0_2px_10px_rgb(0,0,0,0.02)] active:scale-[0.98]">{reason}</button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}