import { Metadata } from 'next';
import { Users, Crown, Store, UserCheck, Shield } from 'lucide-react';

export const metadata: Metadata = { title: '회원 관리 | 관리자' };

const MOCK_USERS = [
  { id: 'u1', name: '관리자', email: 'admin@healing.kr', role: 'super_admin', joinDate: '2024-01-01' },
  { id: 'u2', name: '강남힐링 담당', email: 'gangnam@healing.kr', role: 'shop_admin', joinDate: '2024-02-01' },
  { id: 'u3', name: '홍대아로 담당', email: 'hongdae@healing.kr', role: 'shop_admin', joinDate: '2024-02-15' },
  { id: 'u4', name: '일반회원1', email: 'user1@example.com', role: 'user', joinDate: '2024-03-01' },
];

const roleMap: Record<string, { label: string; bg: string; text: string; icon: typeof Crown }> = {
  super_admin: { label: '최고관리자', bg: 'bg-purple-100', text: 'text-purple-700', icon: Shield },
  shop_admin: { label: '업체관리자', bg: 'bg-amber-100', text: 'text-amber-700', icon: Store },
  user: { label: '일반회원', bg: 'bg-gray-100', text: 'text-gray-600', icon: UserCheck },
};

export default function AdminUsersPage() {
  return (
    <div className="max-w-[1000px] space-y-4">
      <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
        <Users className="w-5 h-5 text-red-600" /> 대상별 회원 관리
      </h1>

      <div className="bg-white border border-gray-200 rounded overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-[11px] text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-2 font-bold">이름</th>
              <th className="px-4 py-2 font-bold">이메일</th>
              <th className="px-4 py-2 font-bold text-center">권한</th>
              <th className="px-4 py-2 font-bold">가입일</th>
              <th className="px-4 py-2 font-bold text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {MOCK_USERS.map(user => {
              const r = roleMap[user.role];
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-bold text-gray-800">{user.name}</td>
                  <td className="px-4 py-2.5 text-gray-600">{user.email}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] ${r.bg} ${r.text}`}>
                      {user.role === 'super_admin' ? '👑' : user.role === 'shop_admin' ? '🏢' : '👤'} {r.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400">{user.joinDate}</td>
                  <td className="px-4 py-2.5 text-center">
                    <button className="px-2 py-1 bg-white border border-gray-300 rounded text-[10px] text-gray-600 hover:bg-gray-100">
                      수정
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
