'use client';

import Link from 'next/link';
import { Star, MapPin, Phone, Crown } from 'lucide-react';
import { Shop } from '@/lib/types';
import { formatRating } from '@/lib/utils';
import clsx from 'clsx';

interface ShopCardProps {
  shop: Shop;
  variant?: 'premium' | 'regular';
}

const themeEmoji: Record<string, string> = {
  swedish: '🌿', aroma: '🌸', thai: '🙏', sport: '💪',
  deep: '🔥', hot_stone: '💎', foot: '🦶', couple: '👫',
};

const gradients = [
  'from-rose-100 to-pink-50',
  'from-purple-100 to-violet-50',
  'from-blue-100 to-sky-50',
  'from-emerald-100 to-teal-50',
  'from-amber-100 to-yellow-50',
  'from-cyan-100 to-blue-50',
  'from-fuchsia-100 to-pink-50',
  'from-lime-100 to-green-50',
];

export default function ShopCard({ shop, variant = 'regular' }: ShopCardProps) {
  const isPremium = variant === 'premium' || shop.isPremium;
  const gIdx = parseInt(shop.id.replace(/\D/g, ''), 10) % gradients.length;

  return (
    <Link
      href={`/shop/${shop.slug}`}
      className={clsx(
        'banner-item block bg-white border rounded overflow-hidden',
        isPremium ? 'border-amber-400' : 'border-gray-200'
      )}
    >
      {/* 썸네일 */}
      <div className={clsx(
        'relative aspect-[4/3] bg-gradient-to-br flex items-center justify-center',
        gradients[gIdx]
      )}>
        <span className="text-3xl opacity-60">
          {themeEmoji[shop.theme] ?? '✨'}
        </span>
        {isPremium && (
          <div className="absolute top-0 left-0 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-br flex items-center gap-0.5">
            <Crown className="w-2.5 h-2.5" />AD
          </div>
        )}
        {/* 평점 */}
        <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 flex items-center gap-0.5">
          <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
          {formatRating(shop.rating)}
        </div>
      </div>

      {/* 정보 */}
      <div className="p-1.5">
        <h3 className="text-xs font-bold text-gray-900 line-clamp-1 leading-tight mb-0.5">
          {shop.name}
        </h3>
        <p className="text-[10px] text-gray-500 line-clamp-1 leading-tight mb-1">
          {shop.tagline}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-red-600 flex items-center gap-0.5">
            <MapPin className="w-2.5 h-2.5" />{shop.regionLabel}
          </span>
          <span className="text-[10px] text-gray-400">
            #{shop.themeLabel}
          </span>
        </div>
        {shop.courses.length > 0 && (
          <div className="mt-1 pt-1 border-t border-gray-100 text-right">
            <span className="text-[11px] font-bold text-red-600">{shop.courses[0].price}~</span>
          </div>
        )}
      </div>
    </Link>
  );
}
