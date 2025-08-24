'use client';

import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/lib/hooks';
import { logout as logoutAction } from '@/lib/features/auth/authSlice';
import { useUserContext } from '@/components/providers/AppWrapper';

interface HeaderProps {
    title?: string;
}

export default function Header({ title = "Chat App" }: HeaderProps) {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { userId, isAuthenticated } = useUserContext();

    const handleLogout = () => {
        dispatch(logoutAction());
        router.push('/auth');
    };

    if (!isAuthenticated) return null;

    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {userId?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-700 hidden sm:block">
                            {userId?.slice(0, 8)}...
                        </span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        Đăng xuất
                    </button>
                </div>
            </div>
        </header>
    );
}
