import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl font-black text-gray-200 mb-4">404</div>
        <h1 className="text-lg font-black text-gray-800 mb-2">페이지를 찾을 수 없습니다</h1>
        <p className="text-sm text-gray-400 mb-6">요청하신 페이지가 존재하지 않거나 삭제되었습니다.</p>
        <Link href="/" className="px-5 py-2 bg-red-600 text-white text-sm font-bold rounded hover:bg-red-700">
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
