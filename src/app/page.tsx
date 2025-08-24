'use client';

import Link from 'next/link';
import { useUserContext } from '@/components/providers/AppWrapper';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { isAuthenticated } = useUserContext();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/chat');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow text-center">
        <h1 className="text-3xl font-bold">Chào mừng đến Chat App</h1>
        <p className="text-gray-600">Kết nối và trò chuyện với mọi người</p>

        <div className="space-y-4">
          <Link
            href="/auth"
            className="block w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
          >
            Đăng nhập
          </Link>

          <Link
            href="/register"
            className="block w-full border border-blue-500 text-blue-500 py-2 px-4 rounded hover:bg-blue-50 transition-colors"
          >
            Đăng ký tài khoản
          </Link>
        </div>
      </div>
    </div>
  );
}
