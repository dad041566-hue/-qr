import { Metadata } from 'next';
import { Settings, Save, Globe, Type, AlertCircle } from 'lucide-react';

export const metadata: Metadata = { title: '사이트 설정 | 관리자' };

export default function AdminSettingsPage() {
  const lbl = "block text-xs font-bold text-gray-700 mb-1";
  const ipt = "w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500";

  return (
    <div className="max-w-[800px] space-y-4 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-red-600" /> 기본 환경 설정
        </h1>
        <button className="flex items-center gap-1 bg-red-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-red-700">
          <Save className="w-4 h-4" /> 설정 저장
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded p-4">
        <h2 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100 flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-blue-500" /> 사이트 기본 정보
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={lbl}>사이트명</label><input type="text" defaultValue="힐링찾기" className={ipt}/></div>
          <div><label className={lbl}>대표 연락처</label><input type="text" defaultValue="1588-0000" className={ipt}/></div>
          <div className="md:col-span-2"><label className={lbl}>사이트 한줄 소개 (Meta Description)</label><input type="text" defaultValue="전국 마사지·힐링 업소를 지역별·테마별로 한눈에 찾아보세요." className={ipt}/></div>
          <div className="md:col-span-2"><label className={lbl}>검색 키워드 (Meta Keywords)</label><input type="text" defaultValue="마사지, 힐링, 스웨디시, 아로마, 타이마사지" className={ipt}/></div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded p-4">
        <h2 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100 flex items-center gap-1.5">
          <Type className="w-4 h-4 text-green-500" /> 상단 띠배너 문구
        </h2>
        <div className="space-y-3">
          <div><label className={lbl}>배너 내용</label><input type="text" defaultValue="🎁 제휴업소 입점 문의 환영! &nbsp;|&nbsp; 프리미엄 배너 광고 진행중 &nbsp;|&nbsp; ☎ 1588-0000" className={ipt}/></div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-red-600"/> 띠배너 노출 (사용함)
          </label>
        </div>
      </div>
    </div>
  );
}
