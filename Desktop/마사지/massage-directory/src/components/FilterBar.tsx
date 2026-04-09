'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Tag, ChevronRight } from 'lucide-react';
import { REGIONS, THEMES, RegionCode, ThemeCode } from '@/lib/types';
import clsx from 'clsx';

interface FilterBarProps {
  selectedRegion: string;
  selectedTheme: string;
}

export default function FilterBar({ selectedRegion, selectedTheme }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-4 space-y-4">
      {/* 지역 필터 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-rose-400" />
          <span className="text-white text-sm font-bold">지역</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map(region => (
            <button
              key={region.code}
              onClick={() => updateFilter('region', region.code)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                selectedRegion === region.code || (region.code === 'all' && !selectedRegion)
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
              )}
            >
              {region.label}
            </button>
          ))}
        </div>
      </div>

      {/* 테마 필터 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-rose-400" />
          <span className="text-white text-sm font-bold">테마</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {THEMES.map(theme => (
            <button
              key={theme.code}
              onClick={() => updateFilter('theme', theme.code)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                selectedTheme === theme.code || (theme.code === 'all' && !selectedTheme)
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
              )}
            >
              #{theme.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
