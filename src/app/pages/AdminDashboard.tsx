import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Bell, Clock, CheckCircle2, RefreshCcw, LayoutDashboard, LayoutGrid, UtensilsCrossed, Settings, BarChart4, TrendingUp, Users, Receipt, Search, Home, ChefHat, Check, AlertCircle, Menu, Volume2, UserX, ToggleLeft, ToggleRight, PenSquare, Plus, QrCode, Printer, Download, Link2, X, Image as ImageIcon, Minus, Gift, ChevronRight, Trash2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { isStoreSubscriptionActive } from '@/lib/utils/subscription';
import { StaffManagement } from '@/app/components/admin/StaffManagement';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { NotificationDeniedBanner } from '@/app/components/admin/NotificationDeniedBanner';
import { useOrders, type OrderWithItems } from '@/hooks/useOrders';
import { useRealtimeTables } from '@/hooks/useRealtimeTables';
import { useMenuAdmin } from '@/hooks/useMenuAdmin';
import { getDailyRevenue, addTable, type DailyRevenueRow } from '@/lib/api/admin';
import { createOrder } from '@/lib/api/order';
import { callWaiting as apiCallWaiting, completeWaiting as apiCompleteWaiting } from '@/lib/api/waiting';
import { supabase } from '@/lib/supabase';
import { useWaitingQueue } from '@/hooks/useWaitingQueue';
import type { OrderStatus } from '@/types/database';

// ============================================================
// Adapter helpers — map Supabase row shapes to the UI-local shapes
// so that the existing JSX template can remain unchanged.
// ============================================================

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

function minutesAgo(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

function adaptOrder(o: OrderWithItems, tableNumberMap: Map<string, number>): UIOrder {
  return {
    id: o.id,
    table: tableNumberMap.get(o.table_id ?? '') ?? 0,
    items: (o.order_items ?? []).map((it) => ({
      name: it.menu_item_name,
      qty: it.quantity,
      price: it.unit_price,
      option: it.selected_options?.map((so) => so.choice).join(', ') || undefined,
    })),
    total: o.total_price,
    status: o.status === 'created' || o.status === 'confirmed' ? 'pending'
      : o.status === 'ready' ? 'completed'
      : o.status,
    time: minutesAgo(o.created_at),
    type: 'Dine-in',
    pax: 0,
  };
}

interface UITable {
  id: number;
  _realId: string;
  status: string;
  time: string;
  amount: number;
  pax: number;
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
  options: any[];
}

// Revenue chart data is loaded dynamically via getDailyRevenue in useEffect

const WEEKLY_REVENUE = [
  { day: '월', amount: 120, prev: 110 },
  { day: '화', amount: 145, prev: 130 },
  { day: '수', amount: 135, prev: 125 },
  { day: '목', amount: 160, prev: 150 },
  { day: '금', amount: 210, prev: 180 },
  { day: '토', amount: 280, prev: 250 },
  { day: '일', amount: 260, prev: 240 },
];

const CATEGORY_SALES = [
  { name: '브런치', value: 45, fill: '#f97316' },
  { name: '커피', value: 30, fill: '#fb923c' },
  { name: '디저트', value: 15, fill: '#fdba74' },
  { name: '음료', value: 10, fill: '#fed7aa' },
];

const TOP_MENUS = [
  { name: '트러플 파스타', sales: 42 },
  { name: '아보카도 샌드', sales: 38 },
  { name: '아메리카노', sales: 85 },
  { name: '자몽 에이드', sales: 24 },
  { name: '크로플', sales: 31 },
];

const STAFF_ALLOWED_TABS = new Set(['orders', 'tables', 'waiting']);

const ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  pending: 'confirmed',
  preparing: 'preparing',
  completed: 'ready',
  served: 'served',
  cancelled: 'cancelled',
};


export function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const storeId = user?.storeId ?? '';

  // 브라우저 알림 권한 요청 + 거부 시 배너 표시
  const { showBanner, dismissBanner, requestPermission } = useNotificationPermission()

  useEffect(() => {
    const requestOnce = () => {
      window.removeEventListener('pointerdown', requestOnce)
      window.removeEventListener('keydown', requestOnce)
      requestPermission()
    }
    window.addEventListener('pointerdown', requestOnce, { once: true })
    window.addEventListener('keydown', requestOnce, { once: true })
    return () => {
      window.removeEventListener('pointerdown', requestOnce)
      window.removeEventListener('keydown', requestOnce)
    }
  }, [requestPermission])

  // --- Supabase hooks ---
  const { orders: rawOrders, loading: ordersLoading, updateOrderStatus: apiUpdateOrderStatus, deleteOrder: apiDeleteOrder } = useOrders(storeId || null);
  const { tables: rawTables, loading: tablesLoading, updateTableStatus: apiUpdateTableStatus } = useRealtimeTables(storeId || null);
  const { menuItems: rawMenuItems, categories: rawCategories, loading: menuLoading, addMenuItem, editMenuItem, removeMenuItem, toggleAvailability, uploadImage } = useMenuAdmin(storeId || null);

  // Build table_id → table_number lookup
  const tableNumberMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of rawTables) m.set(t.id, t.table_number);
    return m;
  }, [rawTables]);

  // Build category_id → category name lookup
  const categoryNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of rawCategories) m.set(c.id, c.name);
    return m;
  }, [rawCategories]);

  // Adapt orders from Supabase shape → UI shape
  const adaptedOrders = useMemo<UIOrder[]>(
    () => rawOrders.map((o) => adaptOrder(o, tableNumberMap)),
    [rawOrders, tableNumberMap],
  );

  // Adapt tables from Supabase shape → UI shape (amount/pax/time are UI-only)
  const adaptedTables = useMemo<UITable[]>(
    () => rawTables.map((t) => ({
      id: t.table_number,
      _realId: t.id,
      status: t.status,
      time: t.status === 'occupied' ? '' : '',
      amount: 0,
      pax: 0,
    })),
    [rawTables],
  );

  // Adapt menus from Supabase shape → UI shape
  const adaptedMenus = useMemo<UIMenu[]>(
    () => rawMenuItems.map((m) => ({
      id: m.id,
      name: m.name,
      category: categoryNameMap.get(m.category_id) ?? '',
      price: m.price,
      stock: m.is_available,
      image: m.image_url ?? undefined,
      desc: m.description ?? undefined,
      badge: m.badge ?? undefined,
      options: [],
    })),
    [rawMenuItems, categoryNameMap],
  );

  // Revenue chart data from Supabase
  const [revenueData, setRevenueData] = useState<{ time: string; amount: number }[]>([]);
  useEffect(() => {
    if (!storeId) return;
    getDailyRevenue(storeId, 7).then((rows) => {
      setRevenueData(
        rows.map((r) => ({
          time: r.date.slice(5), // "MM-DD"
          amount: Math.round(r.amount / 10000),
        })),
      );
    }).catch(() => {});
  }, [storeId]);

  // Waiting queue from Supabase (realtime)
  const { waitings: rawWaitings } = useWaitingQueue(storeId);

  // Recent activity feed derived from latest orders
  const recentActivities = useMemo(() => {
    return rawOrders.slice(0, 5).map((o) => {
      const tableNum = tableNumberMap.get(o.table_id ?? '') ?? 0;
      return {
        time: `${minutesAgo(o.created_at)}분 전`,
        text: `${tableNum}번 테이블 주문 (${o.total_price.toLocaleString()}원)`,
        type: 'order' as const,
        icon: Receipt,
        color: 'text-blue-500',
        bg: 'bg-blue-50',
      };
    });
  }, [rawOrders, tableNumberMap]);

  // Local UI state backed by adapted data
  const [orders, setOrders] = useState<UIOrder[]>([]);
  const [tables, setTables] = useState<UITable[]>([]);
  const [menus, setMenus] = useState<UIMenu[]>([]);

  // Sync adapted data into local state when hooks update
  useEffect(() => { setOrders(adaptedOrders); }, [adaptedOrders]);
  useEffect(() => {
    setTables((prev) => {
      // Preserve UI-only fields (amount, pax, time) for tables that already exist
      const prevMap = new Map(prev.map((t) => [t.id, t]));
      return adaptedTables.map((t) => {
        const existing = prevMap.get(t.id);
        if (existing) {
          return { ...t, amount: existing.amount, pax: existing.pax, time: existing.time };
        }
        return t;
      });
    });
  }, [adaptedTables]);
  useEffect(() => { setMenus(adaptedMenus); }, [adaptedMenus]);

  const [appMode, setAppMode] = useState<'pos' | 'admin'>('pos'); // pos, admin
  const [activeTab, setActiveTab] = useState('orders'); // pos: orders, tables, waiting / admin: analytics, menu, customers, qr, event, settings

  // staff role은 pos 모드만 허용
  useEffect(() => {
    if (user?.role === 'staff' && appMode === 'admin') {
      setAppMode('pos')
    }

    if (user?.role === 'staff' && !STAFF_ALLOWED_TABS.has(activeTab)) {
      setActiveTab('orders')
    }
  }, [user?.role, appMode, activeTab])

  // Subscription check
  const [storeExpired, setStoreExpired] = useState<boolean>(false);
  useEffect(() => {
    if (!storeId) return;
    supabase
      .from('stores')
      .select('is_active, subscription_end')
      .eq('id', storeId)
      .single()
      .then(({ data }) => {
        if (data && !isStoreSubscriptionActive(data)) {
          setStoreExpired(true);
        }
      });
  }, [storeId]);

  // Loading guard (must come after all hooks)
  if (!user) return <div className="flex items-center justify-center h-screen"><span className="text-zinc-500 font-bold">로딩 중...</span></div>;
  
  
  // Event & Store Settings State
  const [eventSettings, setEventSettings] = useState({
    enabled: true,
    title: '네이버 영수증 리뷰 이벤트 🎉',
    desc: '참여하고 아메리카노 1잔 무료로 받기!',
    reward: '아메리카노 1잔'
  });

  const [staffCallOptions, setStaffCallOptions] = useState([
    { id: 1, name: '직원만 호출' },
    { id: 2, name: '물/얼음물 주세요' },
    { id: 3, name: '물티슈 주세요' },
    { id: 4, name: '앞치마 주세요' },
    { id: 5, name: '주문 수정할게요' },
  ]);

  const handleAddCallOption = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newName = formData.get('name') as string;
    if (!newName) return;
    setStaffCallOptions(prev => [...prev, { id: Date.now(), name: newName }]);
    e.currentTarget.reset();
    toast.success('직원 호출 옵션이 추가되었습니다.');
  };

  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwNew || !pwConfirm) { toast.error('모든 항목을 입력하세요.'); return; }
    if (!/^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(pwNew)) { toast.error('8자 이상, 특수문자를 포함해야 합니다.'); return; }
    if (pwNew !== pwConfirm) { toast.error('새 비밀번호가 일치하지 않습니다.'); return; }
    setPwLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwNew });
      if (error) throw error;
      toast.success('비밀번호가 변경되었습니다.');
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
    } catch (err: any) {
      toast.error(err?.message ?? '비밀번호 변경에 실패했습니다.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleRemoveCallOption = (id: number) => {
    setStaffCallOptions(prev => prev.filter(opt => opt.id !== id));
    toast.success('직원 호출 옵션이 삭제되었습니다.');
  };

  // Customers & Point State
  const [pointRate, setPointRate] = useState(5); // 5% point accumulation by default
  const [isPointPolicyModalOpen, setIsPointPolicyModalOpen] = useState(false);
  const [isCustomerEditModalOpen, setIsCustomerEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  // Menu Modal State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any>(null);
  const [menuOptions, setMenuOptions] = useState<any[]>([]);

  const handleOpenMenuModal = (menu?: any) => {
    if (menu) {
      setEditingMenu(menu);
      setMenuOptions(menu.options || []);
    } else {
      setEditingMenu(null);
      setMenuOptions([]);
    }
    setIsMenuModalOpen(true);
  };

  const handleAddOptionGroup = () => {
    setMenuOptions([...menuOptions, { id: Date.now().toString(), name: '', required: false, choices: [{ name: '', price: 0 }] }]);
  };

  const handleRemoveOptionGroup = (groupId: string) => {
    setMenuOptions(menuOptions.filter(opt => opt.id !== groupId));
  };

  const handleAddOptionChoice = (groupId: string) => {
    setMenuOptions(menuOptions.map(opt => {
      if (opt.id === groupId) {
        return { ...opt, choices: [...opt.choices, { name: '', price: 0 }] };
      }
      return opt;
    }));
  };

  const handleRemoveOptionChoice = (groupId: string, choiceIndex: number) => {
    setMenuOptions(menuOptions.map(opt => {
      if (opt.id === groupId) {
        return { ...opt, choices: opt.choices.filter((_: any, idx: number) => idx !== choiceIndex) };
      }
      return opt;
    }));
  };

  const handleOptionChange = (groupId: string, field: string, value: any) => {
    setMenuOptions(menuOptions.map(opt => {
      if (opt.id === groupId) {
        return { ...opt, [field]: value };
      }
      return opt;
    }));
  };

  const handleChoiceChange = (groupId: string, choiceIndex: number, field: string, value: any) => {
    setMenuOptions(menuOptions.map(opt => {
      if (opt.id === groupId) {
        const newChoices = [...opt.choices];
        newChoices[choiceIndex] = { ...newChoices[choiceIndex], [field]: value };
        return { ...opt, choices: newChoices };
      }
      return opt;
    }));
  };

  const handleSaveMenu = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const categoryName = formData.get('category') as string;
    const price = Number(formData.get('price'));
    const desc = formData.get('desc') as string || '';
    const badgeVal = formData.get('badge') as string;
    const badge = badgeVal === '없음' ? null : (badgeVal?.toLowerCase() || null);

    // Find category_id from name
    const cat = rawCategories.find(c => c.name === categoryName);
    const category_id = cat?.id ?? '';

    try {
      if (editingMenu) {
        await editMenuItem(editingMenu.id, { name, category_id, price, description: desc || null, badge });
      } else {
        await addMenuItem({ store_id: storeId, name, category_id, price, description: desc || null, badge });
      }
    } catch {
      // toast already handled by hook
    }
    setIsMenuModalOpen(false);
  };

  const handleSavePointPolicy = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setPointRate(Number(formData.get('rate')));
    setIsPointPolicyModalOpen(false);
    toast.success('포인트 적립 정책이 저장되었습니다.');
  };

  const handleSaveCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedPoints = Number(formData.get('points'));
    
    setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, points: updatedPoints } : c));
    setIsCustomerEditModalOpen(false);
    toast.success('고객 정보가 업데이트 되었습니다.');
  };

  // Table Modal State
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  const handleOpenTableModal = (table: any) => {
    setSelectedTable(table);
    setIsTableModalOpen(true);
  };

  // Add Order State
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [orderTableId, setOrderTableId] = useState<number | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [posCategory, setPosCategory] = useState('전체');

  const POS_CATEGORIES = ['전체', ...Array.from(new Set(menus.map(m => m.category)))];

  const handleAddToCart = (menu: any) => {
    if (!menu.stock) return toast.error('품절된 메뉴입니다.');
    setCart(prev => {
      const existing = prev.find(item => item.id === menu.id);
      if (existing) {
        return prev.map(item => item.id === menu.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...menu, qty: 1 }];
    });
  };

  const handleUpdateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item).filter(item => item.qty > 0));
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return toast.error('메뉴를 선택해주세요.');

    if (!storeId) return toast.error('매장 정보를 찾을 수 없습니다.');
    if (!orderTableId) return toast.error('테이블을 선택해주세요.');

    const tableRealId = findRealTableId(orderTableId);
    if (!tableRealId) return toast.error('테이블 정보를 불러오지 못했습니다.');

    const orderItems = cart.map((item) => ({
      menuItemId: item.id,
      menuItemName: item.name,
      unitPrice: item.price,
      quantity: item.qty,
      totalPrice: item.price * item.qty,
      selectedOptions: [],
    }));

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    setIsPlacingOrder(true);
    try {
      await createOrder({
        storeId,
        tableId: tableRealId,
        items: orderItems,
      });

      await apiUpdateTableStatus(tableRealId, 'occupied');
      setTables(prev => prev.map(t => t.id === orderTableId ? {
        ...t,
        status: 'occupied',
        amount: t.amount + totalAmount,
        time: t.time || '방금 전',
        pax: t.pax || 2,
      } : t));
      if (selectedTable && selectedTable.id === orderTableId) {
        setSelectedTable((prev: any) => ({
          ...prev,
          status: 'occupied',
          amount: (prev.amount || 0) + totalAmount,
          time: prev.time || '방금 전',
          pax: prev.pax || 2,
        }));
      }

      toast.success(`${orderTableId}번 테이블 주문이 주방으로 전달되었습니다.`, {
        icon: <ChefHat className="w-5 h-5 text-orange-500" />
      });
      setIsAddOrderModalOpen(false);
      setCart([]);
    } catch {
      toast.error('주문 전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleCheckoutTable = (id: number) => {
    const realId = findRealTableId(id);
    if (realId) apiUpdateTableStatus(realId, 'cleaning');
    setTables(prev => prev.map(t => t.id === id ? { ...t, status: 'cleaning', amount: 0, time: '', pax: 0 } : t));
    toast.success(`${id}번 테이블 정산이 완료되었습니다. 정리 대기 중입니다.`);
    setIsTableModalOpen(false);
  };

  const cancelTableOrder = (id: number) => {
    const realId = findRealTableId(id);
    if (realId) apiUpdateTableStatus(realId, 'available');
    setTables(prev => prev.map(t => t.id === id ? { ...t, status: 'available', amount: 0, time: '', pax: 0 } : t));
    toast.success(`${id}번 테이블 주문이 전체 취소되었습니다.`);
    setIsTableModalOpen(false);
  };

  const cancelTableMenuItem = (tableId: number, orderId: string, itemIndex: number) => {
    // Find the order and item to calculate price
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const removedItem = order.items[itemIndex];
    // Use the price property from the item
    const removedPrice = (removedItem.price || 0) * removedItem.qty;
    
    // Update orders
    setOrders(prev => {
      return prev.map(o => {
        if (o.id === orderId) {
          const updatedItems = o.items.filter((_, idx) => idx !== itemIndex);
          if (updatedItems.length === 0) {
            // Remove order entirely
            return null;
          }
          const newTotal = o.total - removedPrice;
          return { ...o, items: updatedItems, total: newTotal };
        }
        return o;
      }).filter((entry): entry is UIOrder => entry !== null);
    });

    // Update table amount
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        const newAmount = Math.max(0, t.amount - removedPrice);
        const tableOrders = orders.filter(o => o.table === tableId && o.id !== orderId);
        const isLastItem = order.items.length === 1 && tableOrders.length === 0;
        
        if (isLastItem) {
          return { ...t, status: 'cleaning', amount: 0, time: '', pax: 0 };
        }
        
        return { ...t, amount: newAmount };
      }
      return t;
    }));

    // Update selected table if modal is open
    if (selectedTable && selectedTable.id === tableId) {
      const newAmount = Math.max(0, selectedTable.amount - removedPrice);
      setSelectedTable((prev: any) => ({ ...prev, amount: newAmount }));
    }

    toast.success('메뉴가 취소되었습니다.');
  };

  const updateTablePax = (id: number, pax: number) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, pax } : t));
    if (selectedTable && selectedTable.id === id) {
      setSelectedTable((prev: any) => ({ ...prev, pax }));
    }
  };

  const markTableOccupied = (id: number) => {
    const realId = findRealTableId(id);
    if (realId) apiUpdateTableStatus(realId, 'occupied');
    setTables(prev => prev.map(t => t.id === id ? { ...t, status: 'occupied', amount: 0, time: '방금 전', pax: 2 } : t));
    toast.success(`${id}번 테이블 착석 처리되었습니다.`);
    setIsTableModalOpen(false);
  };

  const updateOrderStatus = async (id: string, newStatus: string) => {
    // Map UI status to DB OrderStatus
    const dbStatus = ORDER_STATUS_MAP[newStatus]
    if (!dbStatus) {
      toast.error('잘못된 주문 상태입니다.')
      return
    }
    try {
      await apiUpdateOrderStatus(id, dbStatus)
      if (newStatus === 'preparing') toast.success(`주방으로 전달되었습니다.`, { icon: <ChefHat className="w-5 h-5 text-orange-500"/> })
      if (newStatus === 'completed') toast.success(`서빙을 준비해주세요.`, { icon: <CheckCircle2 className="w-5 h-5 text-green-500"/> })
      if (newStatus === 'served') toast.success(`서빙이 완료되었습니다.`)
    } catch {
      toast.error('주문 상태 변경에 실패했습니다.')
    }
  };

  const updateOrderPax = (id: string, pax: number) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, pax } : o));
  };

  const deleteOrder = async (id: string) => {
    try {
      await apiDeleteOrder(id)
      toast.success(`주문이 삭제되었습니다.`)
    } catch {
      toast.error('주문 삭제에 실패했습니다.')
    }
  };

  // Helper to find real table UUID from table_number
  const findRealTableId = (tableNumber: number): string | undefined => {
    return tables.find(t => t.id === tableNumber)?._realId;
  };

  const markTableAvailable = (id: number) => {
    const realId = findRealTableId(id);
    if (realId) apiUpdateTableStatus(realId, 'available');
    setTables(prev => prev.map(t => t.id === id ? { ...t, status: 'available', amount: 0, time: '', pax: 0 } : t));
    toast.info(`${id}번 테이블 정리가 완료되었습니다.`);
  };

  const callWaiting = async (waitingId: string, queueNumber: number) => {
    try {
      await apiCallWaiting(waitingId);
      toast.success(`대기 ${queueNumber}번 고객님을 호출했습니다.`, { icon: <Volume2 className="w-5 h-5 text-blue-500" /> });
    } catch {
      toast.error('호출에 실패했습니다.');
    }
  };

  const completeWaiting = async (waitingId: string, queueNumber: number) => {
    try {
      await apiCompleteWaiting(waitingId);
      toast.success(`대기 ${queueNumber}번 고객님 입장이 완료되었습니다.`);
    } catch {
      toast.error('입장 처리에 실패했습니다.');
    }
  };

  const toggleMenuStock = (id: string) => {
    const menu = menus.find(m => m.id === id);
    if (menu) toggleAvailability(id, menu.stock);
    setMenus(prev => prev.map(m => m.id === id ? { ...m, stock: !m.stock } : m));
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const completedOrders = orders.filter(o => o.status === 'completed');

  const totalToday = orders.reduce((sum, o) => sum + o.total, 0);
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;

  const renderDashboard = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      {/* Premium KPI Widgets with Micro-charts */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-5">
        {[
          { title: '오늘 매출', value: `₩${(totalToday/10000).toLocaleString()}만`, trend: '+18.2%', isUp: true, icon: TrendingUp, color: 'blue', data: [{v:10},{v:20},{v:15},{v:30},{v:25},{v:45}] },
          { title: '주문 건수', value: '128', unit: '건', trend: '+5.4%', isUp: true, icon: Receipt, color: 'orange', data: [{v:20},{v:15},{v:25},{v:20},{v:35},{v:40}] },
          { title: '평균 조리 시간', value: '8', unit: '분', trend: '-2.1%', isUp: true, icon: Clock, color: 'purple', data: [{v:12},{v:10},{v:11},{v:9},{v:8},{v:8}] },
          { title: '테이블 점유', value: `${Math.round((occupiedTables/tables.length)*100)}%`, trend: '여유', isUp: true, icon: Users, color: 'green', data: [{v:30},{v:40},{v:35},{v:60},{v:50},{v:70}] }
        ].map((kpi, idx) => {
          const colorMap: Record<string, { bg: string, text: string, chart: string, grad: string }> = {
            blue: { bg: 'bg-blue-50', text: 'text-blue-600', chart: '#3b82f6', grad: 'from-blue-500/20' },
            orange: { bg: 'bg-orange-50', text: 'text-orange-600', chart: '#f97316', grad: 'from-orange-500/20' },
            purple: { bg: 'bg-purple-50', text: 'text-purple-600', chart: '#a855f7', grad: 'from-purple-500/20' },
            green: { bg: 'bg-green-50', text: 'text-green-600', chart: '#22c55e', grad: 'from-green-500/20' },
          };
          const colors = colorMap[kpi.color];

          return (
            <div key={idx} className="bg-white rounded-3xl p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`${colors.bg} p-3 md:p-3.5 rounded-2xl`}>
                  <kpi.icon className={`w-5 h-5 md:w-6 md:h-6 ${colors.text}`} />
                </div>
                <span className={`text-[10px] md:text-xs font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 ${kpi.isUp ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                  {kpi.trend}
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-zinc-400 text-xs md:text-sm font-bold mb-1">{kpi.title}</p>
                <h3 className="text-xl md:text-3xl font-black text-zinc-900 tracking-tight">
                  {kpi.value}{kpi.unit && <span className="text-sm md:text-lg font-bold text-zinc-400 ml-1">{kpi.unit}</span>}
                </h3>
              </div>
              {/* Mini Background Chart */}
              <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 group-hover:opacity-60 transition-opacity pointer-events-none min-h-[64px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                  <AreaChart data={kpi.data}>
                    <defs>
                      <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.chart} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={colors.chart} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={colors.chart} strokeWidth={2} fill={`url(#grad-${idx})`} isAnimationActive={true} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-5">
        {/* Main Chart */}
        <div className="xl:col-span-2 bg-white rounded-3xl p-5 md:p-6 border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg md:text-xl font-black text-zinc-900">시간대별 매출 추이</h2>
              <p className="text-xs text-zinc-400 font-bold mt-1">오늘 시간당 발생한 누적 매출</p>
            </div>
            <select className="bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs md:text-sm font-bold rounded-xl px-3 py-2 outline-none hover:border-orange-500 transition-colors focus:ring-2 focus:ring-orange-500/20">
              <option>오늘</option>
              <option>이번 주</option>
            </select>
          </div>
          <div className="h-[250px] md:h-[320px] w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
              <AreaChart id="revenue-chart" key="areachart" data={revenueData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <defs key="defs">
                  <linearGradient id="colorRevenueChart1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis key="xaxis" dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa', fontWeight: 'bold' }} dy={10} />
                <YAxis key="yaxis" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa', fontWeight: 'bold' }} tickFormatter={(value) => `${value}만`} />
                <Tooltip key="tooltip" contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontWeight: 'bold', color: '#18181b' }} formatter={(value: number) => [`${value}만원`, '매출']} />
                <Area key="area" type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenueChart1)" isAnimationActive={true} activeDot={{ r: 6, fill: '#f97316', stroke: '#fff', strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Feed */}
        <div className="bg-white rounded-3xl p-5 md:p-6 border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[350px] md:h-auto relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-center mb-6 shrink-0 relative z-10">
            <div>
              <h2 className="text-lg md:text-xl font-black text-zinc-900">실시간 활동</h2>
              <p className="text-xs text-zinc-400 font-bold mt-1">매장 내 주요 알림</p>
            </div>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-5 scrollbar-hide relative z-10">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-zinc-400 font-bold text-center py-8">최근 활동이 없습니다.</p>
            ) : recentActivities.map((feed, i) => (
              <div key={i} className="flex gap-4 items-center group cursor-pointer">
                <div className={`p-3 rounded-2xl shrink-0 ${feed.bg} transition-transform group-hover:scale-110`}>
                  <feed.icon className={`w-4 h-4 md:w-5 md:h-5 ${feed.color}`} />
                </div>
                <div className="flex-1 border-b border-zinc-50 pb-3 group-hover:border-transparent transition-colors">
                  <p className="text-sm font-bold text-zinc-800 leading-tight mb-1">{feed.text}</p>
                  <p className="text-[11px] font-bold text-zinc-400">{feed.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderKDS = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col md:overflow-hidden pb-20 md:pb-0">
      <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-900">주방 KDS</h2>
          <p className="text-xs md:text-sm text-zinc-500 mt-0.5 md:mt-1">주방 작업에 최적화된 큰 글씨와 고대비 UI입니다.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 md:overflow-hidden pb-4 overflow-y-auto">
        {/* Column 1: Pending (High Contrast Red) */}
        <div className="flex flex-col bg-zinc-100/50 rounded-3xl p-4 md:overflow-hidden border border-zinc-200/50 min-h-[300px] md:min-h-0 shrink-0">
          <div className="flex justify-between items-center mb-4 px-2 shrink-0">
            <h3 className="font-black text-lg text-zinc-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> 신규 주문
            </h3>
            <span className="bg-white text-red-600 font-black text-sm px-3 py-1 rounded-xl shadow-sm border border-red-100">{pendingOrders.length}건</span>
          </div>
          <div className="flex-1 md:overflow-y-auto space-y-4 pr-1 scrollbar-hide">
            <AnimatePresence>
              {pendingOrders.map(order => (
                <motion.div data-testid="kds-order-card" layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={order.id} className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-red-100 overflow-hidden flex flex-col relative">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
                  <div className="p-5 border-b-2 border-dashed border-zinc-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black text-xl border border-red-100">
                          T{order.table}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-400">주문번호</p>
                          <p className="text-sm font-black text-zinc-800">{order.id}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="w-3.5 h-3.5 text-zinc-400" />
                            <input 
                              type="number" 
                              min="0"
                              value={order.pax || 0} 
                              onChange={(e) => updateOrderPax(order.id, parseInt(e.target.value) || 0)}
                              className="w-12 text-xs font-bold text-zinc-700 bg-zinc-100 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-red-400"
                            />
                            <span className="text-xs font-medium text-zinc-500">명</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-sm font-black text-red-600 bg-red-50 px-2.5 py-1 rounded-lg flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> {order.time}분 전</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded px-1.5 py-1 outline-none"
                          >
                            <option value="pending">신규 주문</option>
                            <option value="preparing">조리중</option>
                            <option value="completed">서빙 대기</option>
                            <option value="served">서빙 완료</option>
                          </select>
                          <button onClick={() => deleteOrder(order.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-1" title="주문 삭제">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <ul className="space-y-4">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex gap-4 items-start">
                          <span className="font-black text-xl text-red-500 w-6 text-center">{item.qty}</span>
                          <div>
                            <p className="font-black text-lg text-zinc-900 leading-tight">{item.name}</p>
                            {item.option && <p className="text-sm font-bold text-zinc-500 mt-1">✓ {item.option}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 bg-zinc-50/50">
                    <button data-testid="order-action-start" onClick={() => updateOrderStatus(order.id, 'preparing')} className="w-full py-4 bg-zinc-900 text-white font-black text-lg rounded-xl hover:bg-zinc-800 transition-colors shadow-lg active:scale-[0.98]">
                      조리 시작
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {pendingOrders.length === 0 && <div className="text-center py-10 text-zinc-400 text-sm font-bold">신규 주문이 없습니다</div>}
          </div>
        </div>

        {/* Column 2: Preparing (High Contrast Orange) */}
        <div className="flex flex-col bg-zinc-100/50 rounded-3xl p-4 md:overflow-hidden border border-zinc-200/50 min-h-[300px] md:min-h-0 shrink-0">
          <div className="flex justify-between items-center mb-4 px-2 shrink-0">
            <h3 className="font-black text-lg text-zinc-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span> 조리중
            </h3>
            <span className="bg-white text-orange-600 font-black text-sm px-3 py-1 rounded-xl shadow-sm border border-orange-100">{preparingOrders.length}건</span>
          </div>
          <div className="flex-1 md:overflow-y-auto space-y-4 pr-1 scrollbar-hide">
            <AnimatePresence>
              {preparingOrders.map(order => {
                const isUrgent = order.time > 10;
                return (
                  <motion.div data-testid="kds-order-card" layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={order.id} className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-orange-100 overflow-hidden flex flex-col relative">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500" />
                    <div className="p-5 border-b-2 border-dashed border-zinc-100">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-black text-xl border border-orange-100">
                            T{order.table}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-400">주문번호</p>
                            <p className="text-sm font-black text-zinc-800">{order.id}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Users className="w-3.5 h-3.5 text-zinc-400" />
                              <input 
                                type="number" 
                                min="0"
                                value={order.pax || 0} 
                                onChange={(e) => updateOrderPax(order.id, parseInt(e.target.value) || 0)}
                                className="w-12 text-xs font-bold text-zinc-700 bg-zinc-100 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-orange-400"
                              />
                              <span className="text-xs font-medium text-zinc-500">명</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className={`text-sm font-black px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${isUrgent ? 'text-red-600 bg-red-50 animate-pulse' : 'text-orange-600 bg-orange-50'}`}>
                            <Clock className="w-3.5 h-3.5"/> {order.time}분 전
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className="text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded px-1.5 py-1 outline-none"
                            >
                              <option value="pending">신규 주문</option>
                              <option value="preparing">조리중</option>
                              <option value="completed">서빙 대기</option>
                              <option value="served">서빙 완료</option>
                            </select>
                            <button onClick={() => deleteOrder(order.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-1" title="주문 삭제">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <ul className="space-y-4">
                        {order.items.map((item, idx) => (
                          <li key={idx} className="flex gap-4 items-start">
                            <span className="font-black text-xl text-orange-500 w-6 text-center">{item.qty}</span>
                            <div>
                              <p className="font-black text-lg text-zinc-900 leading-tight">{item.name}</p>
                              {item.option && <p className="text-sm font-bold text-zinc-500 mt-1">✓ {item.option}</p>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 bg-zinc-50/50">
                      <button data-testid="order-action-complete" onClick={() => updateOrderStatus(order.id, 'completed')} className="w-full py-4 bg-orange-500 text-white font-black text-lg rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 active:scale-[0.98] flex items-center justify-center gap-2">
                        <Check className="w-6 h-6" /> 조리 완료
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {preparingOrders.length === 0 && <div className="text-center py-10 text-zinc-400 text-sm font-bold">조리중인 메뉴가 없습니다</div>}
          </div>
        </div>

        {/* Column 3: Completed/Serving */}
        <div className="flex flex-col bg-zinc-100/50 rounded-3xl p-4 md:overflow-hidden border border-zinc-200/50 min-h-[300px] md:min-h-0 shrink-0 opacity-80 hover:opacity-100 transition-opacity">
          <div className="flex justify-between items-center mb-4 px-2 shrink-0">
            <h3 className="font-black text-lg text-zinc-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> 서빙 대기
            </h3>
            <span className="bg-white text-green-600 font-black text-sm px-3 py-1 rounded-xl shadow-sm border border-green-100">{completedOrders.length}건</span>
          </div>
          <div className="flex-1 md:overflow-y-auto space-y-4 pr-1 scrollbar-hide">
            <AnimatePresence>
              {completedOrders.map(order => (
                <motion.div data-testid="kds-order-card" layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={order.id} className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-green-100 overflow-hidden flex flex-col relative">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500" />
                  <div className="p-5 border-b-2 border-dashed border-zinc-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-black text-xl border border-green-100">
                          T{order.table}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-400">주문번호</p>
                          <p className="text-sm font-black text-zinc-800">{order.id}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="w-3.5 h-3.5 text-zinc-400" />
                            <input 
                              type="number" 
                              min="0"
                              value={order.pax || 0} 
                              onChange={(e) => updateOrderPax(order.id, parseInt(e.target.value) || 0)}
                              className="w-12 text-xs font-bold text-zinc-700 bg-zinc-100 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-green-400"
                            />
                            <span className="text-xs font-medium text-zinc-500">명</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-sm font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-lg flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/> 서빙 대기</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded px-1.5 py-1 outline-none"
                          >
                            <option value="pending">신규 주문</option>
                            <option value="preparing">조리중</option>
                            <option value="completed">서빙 대기</option>
                            <option value="served">서빙 완료</option>
                          </select>
                          <button onClick={() => deleteOrder(order.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-1" title="주문 삭제">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <ul className="space-y-4">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex gap-4 items-start">
                          <span className="font-black text-xl text-green-500 w-6 text-center">{item.qty}</span>
                          <div>
                            <p className="font-black text-lg text-zinc-900 leading-tight">{item.name}</p>
                            {item.option && <p className="text-sm font-bold text-zinc-500 mt-1">✓ {item.option}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 bg-zinc-50/50">
                    <button data-testid="order-action-served" onClick={() => updateOrderStatus(order.id, 'served')} className="w-full py-4 bg-green-500 text-white font-black text-lg rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20 active:scale-[0.98] flex items-center justify-center gap-2">
                      <Check className="w-6 h-6" /> 서빙 완료
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {completedOrders.length === 0 && <div className="text-center py-10 text-zinc-400 text-sm font-bold">대기중인 서빙이 없습니다</div>}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderTables = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0 mb-2">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-900">홀 테이블 현황</h2>
          <p className="text-xs md:text-sm text-zinc-500 mt-0.5 md:mt-1">터치하여 테이블 상세 상태를 변경하세요.</p>
        </div>
        <div className="flex gap-3 md:gap-4 bg-white p-2 md:p-0 rounded-xl md:bg-transparent shadow-sm md:shadow-none border border-zinc-100 md:border-none">
          <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm font-bold text-zinc-600"><div className="w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-orange-500"></div> 이용중 ({occupiedTables})</div>
          <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm font-bold text-zinc-600"><div className="w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-zinc-200"></div> 빈자리 ({tables.filter(t=>t.status==='available').length})</div>
          <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm font-bold text-zinc-600"><div className="w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-yellow-400"></div> 정리중 ({tables.filter(t=>t.status==='cleaning').length})</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-8 border border-zinc-100 md:border-zinc-200 shadow-sm md:min-h-[600px]">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {tables.map(table => (
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={table.id}
              onClick={() => handleOpenTableModal(table)}
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

  const renderWaiting = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-900">웨이팅 관리</h2>
          <p className="text-xs md:text-sm text-zinc-500 mt-0.5 md:mt-1">고객 대기 명단을 관리하고 입장/호출을 진행하세요.</p>
        </div>
        <button onClick={() => navigate('/waiting')} className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors shadow-sm self-start md:self-auto">
          웨이팅 기기 모드 띄우기
        </button>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="bg-zinc-50 border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
          <span className="font-extrabold text-zinc-800">현재 대기 <span className="text-orange-500">{rawWaitings.length}</span>팀</span>
        </div>

        {rawWaitings.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 font-medium">
            현재 대기중인 고객이 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            <AnimatePresence>
              {rawWaitings.map((w) => (
                <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }} key={w.id} className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-zinc-50/50 transition-colors">
                  <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center font-black text-xl md:text-2xl shrink-0">
                      {w.queue_number}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-black text-lg md:text-xl text-zinc-900">{w.phone}</h4>
                        <span className="bg-zinc-100 text-zinc-600 text-xs font-bold px-2 py-1 rounded-md">{minutesAgo(w.created_at)}분 전 등록</span>
                      </div>
                      <p className="text-sm font-bold text-zinc-500 flex items-center gap-1"><Users className="w-4 h-4"/> 인원: {w.party_size}명</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <button data-testid="waiting-call" onClick={() => callWaiting(w.id, w.queue_number)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-blue-50 text-blue-600 px-4 py-3 md:py-2.5 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors">
                      <Volume2 className="w-4 h-4" /> 호출하기
                    </button>
                    <button data-testid="waiting-seat" onClick={() => completeWaiting(w.id, w.queue_number)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-zinc-900 text-white px-6 py-3 md:py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors shadow-md">
                      <Check className="w-4 h-4" /> 입장 완료
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderAnalytics = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-900">매출 및 통계 분석</h2>
          <p className="text-xs md:text-sm text-zinc-500 mt-0.5 md:mt-1">매장 운영에 필요한 핵심 데이터 인사이트를 제공합니다.</p>
        </div>
        <select className="bg-white border border-zinc-200 text-zinc-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none hover:border-orange-500 transition-colors focus:ring-2 focus:ring-orange-500/20 shadow-sm w-full md:w-auto">
          <option>이번 주</option>
          <option>이번 달</option>
          <option>지난 달</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: '총 누적 매출', value: '4,285,000', unit: '원', trend: '+12.5%', isUp: true },
          { label: '총 주문 건수', value: '184', unit: '건', trend: '+5.2%', isUp: true },
          { label: '평균 객단가', value: '23,280', unit: '원', trend: '-1.5%', isUp: false },
          { label: '신규 고객 유입', value: '42', unit: '명', trend: '+18.0%', isUp: true },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-3xl p-5 border border-zinc-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:border-orange-200 transition-colors">
            <p className="text-xs font-bold text-zinc-500 mb-2">{kpi.label}</p>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-xl md:text-2xl font-black text-zinc-900 tracking-tight">{kpi.value}</span>
              <span className="text-sm font-bold text-zinc-400">{kpi.unit}</span>
            </div>
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black ${kpi.isUp ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
              {kpi.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
              {kpi.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Weekly Revenue Trend */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 md:p-6 border border-zinc-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base md:text-lg font-extrabold text-zinc-900">요일별 매출 추이</h3>
            <span className="text-xs font-bold text-zinc-400 flex items-center gap-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span>이번 주</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-200"></span>지난 주</span>
            </span>
          </div>
          <div className="h-[280px] w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
              <AreaChart data={WEEKLY_REVENUE} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} tickFormatter={(val) => `${val}만`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="prev" stroke="#e4e4e7" strokeWidth={2} fill="transparent" name="지난 주" />
                <Area type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorCurrent)" name="이번 주" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Sales Distribution */}
        <div className="bg-white rounded-3xl p-5 md:p-6 border border-zinc-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col">
          <h3 className="text-base md:text-lg font-extrabold text-zinc-900 mb-2">카테고리별 판매 비중</h3>
          <p className="text-xs text-zinc-500 mb-6 font-medium">이번 주 총 184건 주문 기준</p>
          
          <div className="flex-1 flex flex-col justify-center">
            <div className="h-[200px] w-full relative min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                <PieChart>
                  <Pie
                    data={CATEGORY_SALES}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    formatter={(value) => [`${value}%`, '비중']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                <span className="text-[10px] font-bold text-zinc-400">1위 카테고리</span>
                <span className="text-xl font-black text-orange-600">브런치</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              {CATEGORY_SALES.map((cat, i) => (
                <div key={i} className="flex items-center gap-2 bg-zinc-50 rounded-xl p-2.5">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.fill }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-zinc-500 truncate">{cat.name}</p>
                    <p className="text-sm font-black text-zinc-900 leading-none mt-0.5">{cat.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Menus */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-5 md:p-6 border border-zinc-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <h3 className="text-base md:text-lg font-extrabold text-zinc-900 mb-6">이번 주 인기 메뉴 TOP 5</h3>
          <div className="h-[250px] w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
              <BarChart data={TOP_MENUS} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f4f4f5" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#3f3f46', fontWeight: 600 }} />
                <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)', fontSize: '12px' }} formatter={(value: number) => [`${value}개`, '판매']} />
                <Bar dataKey="sales" radius={[0, 8, 8, 0]} barSize={24}>
                  {TOP_MENUS.map((entry, index) => (
                    <Cell key={`sales-cell-${index}`} fill={index === 0 ? '#f97316' : index === 1 ? '#fb923c' : '#fdba74'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderMenuManagement = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-900">메뉴 관리</h2>
          <p className="text-xs md:text-sm text-zinc-500 mt-0.5 md:mt-1">품절 처리 및 메뉴 정보를 관리하세요.</p>
        </div>
        <button 
          onClick={() => handleOpenMenuModal()}
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
                    onClick={() => handleOpenMenuModal(menu)}
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
                onClick={() => toggleMenuStock(menu.id)}
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

  const renderQRManagement = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-900">고정 QR 코드 관리</h2>
          <p className="text-xs md:text-sm text-zinc-500 mt-0.5 md:mt-1">테이블별 고유 QR 코드를 생성하고 출력하여 부착하세요.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => toast.success('전체 QR 코드가 인쇄 대기열에 추가되었습니다.')} className="flex-1 md:flex-none bg-white border border-zinc-200 text-zinc-700 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-50 transition-colors shadow-sm flex items-center justify-center gap-2">
            <Printer className="w-4 h-4" /> 전체 인쇄
          </button>
          <button onClick={async () => {
            try {
              const nextNumber = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
              await addTable(storeId, nextNumber);
              toast.success('새 테이블이 추가되었습니다.');
            } catch {
              toast.error('테이블 추가에 실패했습니다.');
            }
          }} className="flex-1 md:flex-none bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors shadow-sm flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> 테이블 추가
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
        {tables.map(table => (
          <div key={table.id} className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-4 md:p-6 shadow-sm flex flex-col items-center text-center hover:border-orange-500 transition-colors group">
            <h3 className="font-black text-lg md:text-xl text-zinc-900 mb-1">테이블 {table.id}</h3>
            <p className="text-[10px] md:text-xs font-medium text-zinc-400 mb-4 md:mb-6 flex items-center gap-1">
              <Link2 className="w-3 h-3" /> .../m/{table.id}
            </p>
            
            <div className="w-24 h-24 md:w-32 md:h-32 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-orange-50 group-hover:border-orange-200 transition-colors">
              <QrCode className="w-10 h-10 md:w-16 md:h-16 text-zinc-300 group-hover:text-orange-500 transition-colors" />
            </div>

            <div className="w-full grid grid-cols-2 gap-2">
              <button onClick={() => toast.success(`${table.id}번 테이블 QR 다운로드 완료`)} className="flex items-center justify-center gap-1.5 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs md:text-sm font-bold hover:bg-zinc-200 transition-colors">
                <Download className="w-3.5 h-3.5" /> <span className="hidden md:inline">저장</span>
              </button>
              <button onClick={() => toast.success(`${table.id}번 테이블 QR 인쇄 시작`)} className="flex items-center justify-center gap-1.5 py-2 bg-orange-50 text-orange-600 rounded-xl text-xs md:text-sm font-bold hover:bg-orange-100 transition-colors">
                <Printer className="w-3.5 h-3.5" /> <span className="hidden md:inline">인쇄</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderEventManagement = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-900">이벤트 관리</h2>
          <p className="text-xs md:text-sm text-zinc-500 mt-0.5 md:mt-1">고객의 QR 주문 화면에 노출될 이벤트를 설정합니다.</p>
        </div>
        <button 
          onClick={() => {
            toast.success('이벤트 설정이 저장되었습니다.');
          }}
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
                onChange={e => setEventSettings(prev => ({...prev, title: e.target.value}))}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">이벤트 설명</label>
              <input 
                type="text" 
                value={eventSettings.desc}
                onChange={e => setEventSettings(prev => ({...prev, desc: e.target.value}))}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">제공 혜택 (리워드)</label>
              <input 
                type="text" 
                value={eventSettings.reward}
                onChange={e => setEventSettings(prev => ({...prev, reward: e.target.value}))}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-zinc-100 rounded-2xl md:rounded-3xl border border-zinc-200 p-6 md:p-8 flex flex-col items-center justify-center">
          <p className="text-sm font-bold text-zinc-500 mb-4">고객 QR 화면 미리보기</p>
          <div className="w-full max-w-[320px] bg-white rounded-[2rem] shadow-xl overflow-hidden border-4 border-zinc-900 h-[400px] flex flex-col relative">
            {/* Mock QR Header */}
            <div className="h-40 bg-zinc-800 relative shrink-0">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <p className="text-white/80 text-[10px] font-medium mb-1">환영합니다! 지금 계신 곳은</p>
                <h1 className="text-xl font-extrabold text-white flex items-end gap-1">5번 테이블 <span className="text-xs font-normal text-white/70 mb-0.5">입니다</span></h1>
              </div>
            </div>
            
            {/* Event Banner Preview */}
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
              
              {/* Mock Categories */}
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
    </motion.div>
  );

  // Customers State
  const [customers, setCustomers] = useState([
    { id: '1', name: '단골손님', phone: '010-1234-5678', points: 1500, visits: 12, lastVisit: '2023-10-24' },
    { id: '2', name: '김철수', phone: '010-9876-5432', points: 500, visits: 3, lastVisit: '2023-10-22' },
    { id: '3', name: '이영희', phone: '010-5555-4444', points: 3200, visits: 8, lastVisit: '2023-10-20' },
  ]);

  const renderCustomers = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-900">고객/포인트 관리</h2>
          <p className="text-xs md:text-sm text-zinc-500 mt-0.5 md:mt-1">가입된 고객의 방문 내역과 적립 포인트를 관���합니다.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="flex-1 md:w-64 bg-white border border-zinc-200 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2">
            <Search className="w-4 h-4 text-zinc-400" />
            <input type="text" placeholder="고객명/연락처 검색" className="bg-transparent border-none outline-none text-zinc-800 placeholder:text-zinc-400 w-full" />
          </div>
          <button 
            onClick={() => setIsPointPolicyModalOpen(true)}
            className="bg-zinc-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0"
          >
            <Settings className="w-4 h-4" /> 정책 설정
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {customers.map(customer => (
          <div key={customer.id} className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col hover:border-orange-300 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/5 to-transparent rounded-bl-full pointer-events-none" />
            <div className="flex justify-between items-start mb-5 relative z-10">
              <div>
                <h3 className="font-extrabold text-zinc-900 text-lg flex items-center gap-2 mb-0.5">
                  {customer.name}
                  {customer.visits >= 10 && <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-md shadow-sm">VIP</span>}
                </h3>
                <p className="text-xs font-bold text-zinc-400">{customer.phone}</p>
              </div>
              <button 
                onClick={() => { setEditingCustomer(customer); setIsCustomerEditModalOpen(true); }}
                className="text-zinc-400 hover:text-orange-600 bg-zinc-50 hover:bg-orange-50 p-2 rounded-xl transition-colors"
              >
                <PenSquare className="w-4 h-4" />
              </button>
            </div>
            
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-4 flex justify-between items-center relative z-10">
              <span className="text-orange-800 text-xs font-bold">보유 포인트</span>
              <div className="text-orange-600 font-black text-xl tracking-tight">
                {customer.points.toLocaleString()} <span className="text-sm font-bold ml-0.5">P</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-auto relative z-10">
              <div className="bg-zinc-50 rounded-2xl p-3.5 border border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 mb-1">총 방문 횟수</p>
                <p className="font-black text-zinc-800 text-sm">{customer.visits}회</p>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-3.5 border border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 mb-1">최근 방문일</p>
                <p className="font-black text-zinc-800 text-sm">{customer.lastVisit}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderSettings = () => (
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

  if (storeExpired) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 p-8 text-center">
      <span className="text-4xl">⚠️</span>
      <h1 className="text-xl font-bold text-zinc-800">이용 기간이 만료되었습니다</h1>
      <p className="text-zinc-500 text-sm">구독 기간이 만료되어 서비스를 이용할 수 없습니다.<br />관리자에게 문의해 주세요.</p>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-zinc-50 flex font-sans">

      {/* Mobile Bottom Navigation - Sticky at bottom */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-zinc-200 h-[70px] pb-safe z-50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] overflow-x-auto no-scrollbar">
        <div className="flex items-center h-full w-full justify-around px-2">
          {(appMode === 'pos' ? [
            { id: 'orders', icon: ChefHat, label: 'KDS', badge: pendingOrders.length + preparingOrders.length },
            { id: 'waiting', icon: Users, label: '웨이팅', badge: rawWaitings.length },
            { id: 'tables', icon: LayoutGrid, label: '홀현황' },
          ] : [
            { id: 'analytics', icon: LayoutDashboard, label: '대시보드' },
            { id: 'menu', icon: UtensilsCrossed, label: '메뉴' },
            { id: 'customers', icon: Users, label: '고객' },
            { id: 'qr', icon: QrCode, label: 'QR' },
            { id: 'settings', icon: Settings, label: '설정' },
            ...(user?.role === 'owner' ? [{ id: 'staff', icon: Users, label: '직원' }] : []),
          ]).map(item => (
            <button
              key={item.id}
              onClick={() => !item.disabled && setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
                item.disabled ? 'opacity-40 grayscale cursor-not-allowed pointer-events-none' :
                activeTab === item.id ? 'text-orange-600' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <div className="relative mb-1 flex justify-center">
                <item.icon className={`w-5 h-5 md:w-6 md:h-6 ${activeTab === item.id ? 'fill-orange-50 stroke-orange-600' : ''}`} />
                {item.isDev ? (
                  <span className="absolute -top-2 -right-6 bg-zinc-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm scale-75 origin-left whitespace-nowrap">개발중</span>
                ) : item.badge ? (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] font-bold ${activeTab === item.id ? 'text-orange-600' : 'text-zinc-500'}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* PC Sidebar Navigation */}
      <aside className="w-64 bg-zinc-950 text-zinc-400 flex flex-col hidden md:flex shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-zinc-800/50">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-orange-500/20">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-black text-xl tracking-tight leading-none">TableFlow</h1>
            <span className="text-orange-500 font-bold text-[10px] tracking-wider uppercase">Pro POS</span>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="px-4 py-4 border-b border-zinc-800/50">
          <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800">
            <button 
              onClick={() => { setAppMode('pos'); setActiveTab('orders'); }} 
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${appMode === 'pos' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              👨‍🍳 현장 POS
            </button>
            {user?.role !== 'staff' && (
              <button
                onClick={() => { setAppMode('admin'); setActiveTab('analytics'); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${appMode === 'admin' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                ⚙️ 매장 관리
              </button>
            )}
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1">
          {(appMode === 'pos' ? [
            { id: 'orders', icon: ChefHat, label: '주방 디스플레이', badge: pendingOrders.length },
            { id: 'waiting', icon: Users, label: '웨이팅 관리', badge: rawWaitings.length },
            { id: 'tables', icon: LayoutDashboard, label: '홀 테이블 현황' },
          ] : [
            { id: 'analytics', icon: BarChart4, label: '매출 분석' },
            { id: 'menu', icon: UtensilsCrossed, label: '메뉴 관리' },
            { id: 'customers', icon: Users, label: '고객/포인트 관리' },
            { id: 'qr', icon: QrCode, label: 'QR 코드 관리' },
            { id: 'event', icon: Gift, label: '이벤트 관리' },
            { id: 'settings', icon: Settings, label: '매장 설정' },
            ...(user?.role === 'owner' ? [{ id: 'staff', icon: Users, label: '직원 관리' }] : []),
          ]).map(item => (
            <button
              key={item.id}
              onClick={() => !item.disabled && setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all font-bold ${
                item.disabled ? 'opacity-40 grayscale cursor-not-allowed pointer-events-none' :
                activeTab === item.id 
                  ? 'bg-zinc-800 text-white' 
                  : 'hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-orange-500' : ''}`} />
                <span>{item.label}</span>
              </div>
              {item.isDev ? (
                <span className="bg-zinc-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">
                  개발중
                </span>
              ) : item.badge ? (
                <span className="bg-orange-500 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-sm">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800/50">
          <div className="bg-zinc-900 rounded-2xl p-4 flex items-center gap-3 mb-3 border border-zinc-800">
            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center font-bold text-white shrink-0">
              {(user?.storeName ?? '').slice(0, 2)}
            </div>
            <div className="truncate">
              <p className="text-white font-bold text-sm truncate">{user?.storeName ?? ''}</p>
              <p className="text-[11px] text-zinc-500 font-medium mt-0.5">{user?.role === 'owner' ? '최고관리자' : user?.role === 'manager' ? '매니저' : '직원'}</p>
            </div>
            <button className="ml-auto text-zinc-500 hover:text-white shrink-0">
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors text-sm font-bold border border-zinc-800"
          >
            <Home className="w-4 h-4" /> 홈으로 나가기
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden bg-zinc-50/50 w-full">
        {/* Top Header - Mobile Optimized */}
        <header className="h-14 md:h-20 bg-white border-b border-zinc-200/80 px-4 md:px-8 flex items-center justify-between shrink-0 shadow-sm z-10 sticky top-0">
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
            <button onClick={() => navigate('/')} className="md:hidden p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-xl">
              <Home className="w-5 h-5" />
            </button>
            
            {/* Mobile Mode Switcher */}
            <div className="md:hidden flex bg-zinc-100/80 p-1 rounded-xl mx-auto border border-zinc-200/50 shadow-inner">
              <button 
                onClick={() => { setAppMode('pos'); setActiveTab('orders'); }}
                className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${appMode === 'pos' ? 'bg-white text-orange-600 shadow-[0_2px_8px_rgba(0,0,0,0.08)]' : 'text-zinc-500'}`}
              >
                👨‍🍳 현장 POS
              </button>
              {user?.role !== 'staff' && (
                <button
                  onClick={() => { setAppMode('admin'); setActiveTab('analytics'); }}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${appMode === 'admin' ? 'bg-white text-orange-600 shadow-[0_2px_8px_rgba(0,0,0,0.08)]' : 'text-zinc-500'}`}
                >
                  ⚙️ 매장 관리
                </button>
              )}
            </div>

            {/* PC Search */}
            <div className="hidden lg:flex items-center bg-zinc-100/80 px-4 py-2.5 rounded-2xl border border-zinc-200/50 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 transition-all">
              <Search className="w-5 h-5 text-zinc-400 mr-2" />
              <input type="text" placeholder="검색어 입력..." className="bg-transparent border-none outline-none text-sm w-64 font-medium text-zinc-800 placeholder:text-zinc-400" />
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-5">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 font-bold rounded-full text-xs border border-green-200/50">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> 정상 가동중
            </div>
            <button className="hidden md:flex items-center gap-2 text-zinc-500 hover:text-zinc-900 font-bold text-sm">
              <RefreshCcw className="w-4 h-4" /> 동기화
            </button>
            <div className="hidden md:block w-px h-6 bg-zinc-200"></div>
            
            {/* Mobile Actions */}
            <button className="md:hidden p-2 text-zinc-600 hover:bg-zinc-100 rounded-xl">
              <Search className="w-5 h-5" />
            </button>
            <button className="relative p-2 text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5 md:w-6 md:h-6" />
              <span className="absolute top-1.5 md:top-1.5 right-1.5 md:right-1.5 w-2 h-2 md:w-2.5 md:h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* 알림 권한 거부 배너 */}
        {showBanner && (
          <div className="px-4 md:px-8 pt-3 shrink-0">
            <NotificationDeniedBanner onDismiss={dismissBanner} />
          </div>
        )}

        {/* Dynamic Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 w-full max-w-[100vw]">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderDashboard()}</motion.div>}
            {activeTab === 'orders' && <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">{renderKDS()}</motion.div>}
            {activeTab === 'waiting' && <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderWaiting()}</motion.div>}
            {activeTab === 'tables' && <motion.div key="tables" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderTables()}</motion.div>}
            {activeTab === 'analytics' && <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderAnalytics()}</motion.div>}
            {activeTab === 'menu' && <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderMenuManagement()}</motion.div>}
            {activeTab === 'qr' && <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderQRManagement()}</motion.div>}
            {activeTab === 'event' && <motion.div key="event" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderEventManagement()}</motion.div>}
            {activeTab === 'customers' && <motion.div key="customers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderCustomers()}</motion.div>}
            {activeTab === 'settings' && <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderSettings()}</motion.div>}
            {activeTab === 'staff' && user?.role === 'owner' && (
              <motion.div key="staff" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StaffManagement storeId={storeId} currentUserId={user.id} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Point Policy Modal */}
      <AnimatePresence>
        {isPointPolicyModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
              onClick={() => setIsPointPolicyModalOpen(false)}
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
                <button onClick={() => setIsPointPolicyModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form id="point-policy-form" onSubmit={handleSavePointPolicy} className="space-y-6">
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
                    onClick={() => setIsPointPolicyModalOpen(false)}
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

      {/* Customer Edit Modal */}
      <AnimatePresence>
        {isCustomerEditModalOpen && editingCustomer && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
              onClick={() => setIsCustomerEditModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-[32px] z-[70] shadow-2xl overflow-hidden flex flex-col p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-zinc-900">고객 정보 수정</h2>
                  <p className="text-sm font-medium text-zinc-500 mt-0.5">{editingCustomer.name} 고객님의 포인트를 조정합니다.</p>
                </div>
                <button onClick={() => setIsCustomerEditModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form id="customer-edit-form" onSubmit={handleSaveCustomer} className="space-y-6">
                <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1">고객명</label>
                    <p className="font-bold text-zinc-900">{editingCustomer.name}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1">연락처</label>
                    <p className="font-bold text-zinc-900">{editingCustomer.phone}</p>
                  </div>
                  <div className="pt-2 border-t border-zinc-200/50">
                    <label className="block text-sm font-bold text-zinc-900 mb-2">보유 포인트</label>
                    <div className="flex items-center gap-3">
                      <input 
                        name="points"
                        defaultValue={editingCustomer.points}
                        required
                        type="number" 
                        min="0"
                        className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-3 text-lg font-black text-orange-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-right"
                      />
                      <span className="text-lg font-black text-zinc-400">P</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsCustomerEditModalOpen(false)}
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

      {/* Menu Modal */}
      <AnimatePresence>
        {isMenuModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
              onClick={() => setIsMenuModalOpen(false)}
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
                <button onClick={() => setIsMenuModalOpen(false)} className="p-2.5 text-zinc-400 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="overflow-y-auto p-6 flex-1 space-y-6">
                <form id="menu-form" onSubmit={handleSaveMenu} className="space-y-6">
                  {/* Image Upload Area */}
                  <div className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                    <label className="flex items-center justify-between text-sm font-bold text-zinc-900 mb-3">
                      메뉴 이미지
                      <span className="text-xs font-medium text-zinc-400 font-normal">권장 사이즈 800x800px</span>
                    </label>
                    <input type="file" accept="image/*" className="hidden" id="menu-image-input" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await uploadImage(file);
                        if (editingMenu) {
                          setEditingMenu((prev: any) => ({ ...prev, image: url }));
                        }
                      } catch { /* handled by hook */ }
                      e.target.value = '';
                    }} />
                    <div onClick={() => document.getElementById('menu-image-input')?.click()} className="w-full h-48 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center text-zinc-400 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-500 transition-all cursor-pointer group relative overflow-hidden">
                      {editingMenu?.image ? (
                        <>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col items-center justify-center text-white">
                            <PenSquare className="w-8 h-8 mb-2" />
                            <span className="font-bold text-sm">이미지 변경</span>
                          </div>
                          <img src={editingMenu.image} alt={editingMenu.name} className="w-full h-full object-cover" />
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
                        <div className="relative">
                          <select 
                            name="category"
                            defaultValue={editingMenu?.category || '브런치'}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all appearance-none"
                          >
                            <option value="브런치">브런치</option>
                            <option value="커피">커피</option>
                            <option value="음료">음료</option>
                            <option value="디저트">디저트</option>
                            <option value="주류">주류</option>
                          </select>
                          <ChevronRight className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                        </div>
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
                        rows={3}
                        defaultValue={editingMenu?.desc || ''}
                        placeholder="고객이 메뉴를 잘 이해할 수 있도록 설명을 작성해주세요." 
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none placeholder:text-zinc-400"
                      />
                    </div>

                    <div className="pt-2">
                      <label className="block text-sm font-bold text-zinc-900 mb-3">배지 설정 (선택)</label>
                      <div className="flex gap-2">
                        {['없음', 'BEST', 'NEW', 'HIT'].map(badge => (
                          <label key={badge} className="flex-1 cursor-pointer">
                            <input type="radio" name="badge" value={badge} defaultChecked={badge === '없음'} className="peer sr-only" />
                            <div className="text-center py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-500 peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:text-orange-600 transition-all">
                              {badge}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Optional Options Configuration */}
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
                        <p className="text-sm text-zinc-500 font-medium">등록된 추가 옵션이 없습니다.<br/><span className="text-xs mt-1 block">(예: 사이즈업, 맵기 조절, 토핑 추가)</span></p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {menuOptions.map((optGroup, gIdx) => (
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
                                {optGroup.choices.map((choice: any, cIdx: number) => (
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
                  onClick={() => setIsMenuModalOpen(false)}
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

      {/* Table Detail Modal */}
      <AnimatePresence>
        {isTableModalOpen && selectedTable && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
              onClick={() => setIsTableModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-3xl z-[70] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-100 shrink-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-zinc-900">{selectedTable.id}번 테이블</h2>
                  {selectedTable.status === 'occupied' && (
                    <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2.5 py-1 rounded-lg">이용중</span>
                  )}
                  {selectedTable.status === 'available' && (
                    <span className="bg-zinc-100 text-zinc-600 text-xs font-bold px-2.5 py-1 rounded-lg">빈자리</span>
                  )}
                  {selectedTable.status === 'cleaning' && (
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-lg">정리중</span>
                  )}
                </div>
                <button onClick={() => setIsTableModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 bg-zinc-50/50">
                {selectedTable.status === 'occupied' ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                      <div className="text-center flex-1 border-r border-zinc-100">
                        <p className="text-xs font-bold text-zinc-500 mb-1">입장 시간</p>
                        <p className="text-sm font-black text-zinc-900">{selectedTable.time}</p>
                      </div>
                      <div className="text-center flex-1 flex flex-col items-center">
                        <p className="text-xs font-bold text-zinc-500 mb-1">인원수</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateTablePax(selectedTable.id, Math.max(0, (selectedTable.pax || 0) - 1))} className="w-5 h-5 rounded bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200"><Minus className="w-3 h-3" /></button>
                          <span className="text-sm font-black text-zinc-900 w-4">{selectedTable.pax || 0}</span>
                          <button onClick={() => updateTablePax(selectedTable.id, (selectedTable.pax || 0) + 1)} className="w-5 h-5 rounded bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
                      <h4 className="font-bold text-zinc-900 mb-3 text-sm">주문 내역</h4>
                      {(() => {
                        const tableOrders = orders.filter(o => o.table === selectedTable.id);
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
                                        <button
                                          onClick={() => cancelTableMenuItem(selectedTable.id, order.id, itemIdx)}
                                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                                          title="메뉴 취소"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                            <div className="pt-3 border-t border-zinc-100 flex justify-between items-center">
                              <span className="font-bold text-zinc-500 text-sm">총 주문 금액</span>
                              <span className="font-black text-orange-600 text-lg">{selectedTable.amount.toLocaleString()}원</span>
                            </div>
                          </>
                        ) : (
                          <p className="text-center text-zinc-400 text-sm py-8">주문 내역이 없습니다.</p>
                        );
                      })()}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => cancelTableOrder(selectedTable.id)}
                        className="py-3.5 bg-zinc-100 text-zinc-600 font-bold rounded-xl hover:bg-zinc-200 transition-colors col-span-2 flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> 주문 취소 및 빈자리 전환
                      </button>
                      <button 
                        onClick={() => {
                          setOrderTableId(selectedTable.id);
                          setCart([]);
                          setIsTableModalOpen(false);
                          setIsAddOrderModalOpen(true);
                        }}
                        className="py-3.5 bg-white border-2 border-orange-500 text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-colors"
                      >
                        주문 추가
                      </button>
                      <button 
                        onClick={() => handleCheckoutTable(selectedTable.id)}
                        className="py-3.5 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors shadow-md"
                      >
                        정산 완료
                      </button>
                    </div>
                  </div>
                ) : selectedTable.status === 'available' ? (
                  <div className="py-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Users className="w-10 h-10 text-zinc-400" />
                    </div>
                    <p className="text-zinc-500 font-medium">현재 빈 자리입니다.</p>
                    <button 
                      onClick={() => markTableOccupied(selectedTable.id)}
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
                      onClick={() => { markTableAvailable(selectedTable.id); setIsTableModalOpen(false); }}
                      className="w-full py-3.5 bg-yellow-400 text-yellow-900 font-black rounded-xl hover:bg-yellow-500 transition-colors shadow-md"
                    >
                      정리 ���료 (빈자리 전환)
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Order Modal */}
      <AnimatePresence>
        {isAddOrderModalOpen && orderTableId && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
              onClick={() => setIsAddOrderModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 h-[85dvh] max-h-[800px] md:h-[80dvh] bg-zinc-50 rounded-t-3xl z-[70] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-200 shrink-0">
                <div>
                  <h2 className="text-xl font-black text-zinc-900">{orderTableId}번 테이블 주문 추가</h2>
                  <p className="text-xs font-medium text-zinc-500">원하는 메뉴를 터치하여 장바구니에 담아주세요.</p>
                </div>
                <button onClick={() => setIsAddOrderModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                <div className="flex-1 flex overflow-hidden">
                  {/* POS Categories Filter */}
                  <div className="w-[84px] bg-white border-r border-zinc-200 overflow-y-auto no-scrollbar shrink-0 flex flex-col z-10">
                    {POS_CATEGORIES.map(cat => {
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
                      )
                    })}
                  </div>
                  {/* Menu List */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32 md:pb-6 grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 content-start bg-zinc-50">
                    {menus.filter(m => posCategory === '전체' || m.category === posCategory).map((menu) => (
                      <div 
                        key={menu.id} 
                        onClick={() => handleAddToCart(menu)}
                        className={`bg-white rounded-2xl p-4 flex flex-col justify-between cursor-pointer border-2 transition-all ${
                          menu.stock ? 'border-zinc-100 hover:border-orange-500 hover:shadow-md' : 'border-zinc-100 opacity-50 grayscale'
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
                            <button onClick={() => handleUpdateCartQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-900 rounded-md hover:bg-zinc-100"><Minus className="w-3.5 h-3.5" /></button>
                            <span className="font-bold text-sm text-zinc-900 w-3 text-center">{item.qty}</span>
                            <button onClick={() => handleUpdateCartQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-900 rounded-md hover:bg-zinc-100"><Plus className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-4 border-t border-zinc-100 bg-white shrink-0">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-zinc-500">총 주문금액</span>
                      <span className="text-xl md:text-2xl font-black text-orange-600">
                        {cart.reduce((sum, item) => sum + (item.price * item.qty), 0).toLocaleString()}원
                      </span>
                    </div>
                    <button 
                      onClick={handlePlaceOrder}
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

    </div>
  );
}
