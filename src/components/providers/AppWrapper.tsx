'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { verifyToken } from '@/lib/features/auth/authSlice';
import { useRouter, usePathname } from 'next/navigation';

interface AppWrapperProps {
    children: React.ReactNode;
}

interface UserContextType {
    userId: string | null;
    authorities: string[];
    isAuthenticated: boolean;
    isLoading: boolean;
}

const UserContext = createContext<UserContextType>({
    userId: null,
    authorities: [],
    isAuthenticated: false,
    isLoading: false
});

export const useUserContext = () => useContext(UserContext);

const PROTECTED_ROUTES = ['/chat', '/profile', '/settings'];
const PUBLIC_ROUTES = ['/auth', '/register', '/'];

const isProtectedRoute = (pathname: string): boolean => {
    return PROTECTED_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
};

const isPublicRoute = (pathname: string): boolean => {
    return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
};

export default function AppWrapper({ children }: AppWrapperProps) {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isLoading, userId, authorities, error } = useAppSelector((state) => state.auth);
    const [isInitialized, setIsInitialized] = useState(false);

    // Khôi phục state khi F5 hoặc refresh
    useEffect(() => {
        const initializeApp = async () => {
            const token = localStorage.getItem('accessToken');

            if (token) {
                try {
                    await dispatch(verifyToken()).unwrap();
                } catch (error) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');

                    if (isProtectedRoute(pathname)) {
                        router.push('/auth');
                    }
                }
            } else {
                if (isProtectedRoute(pathname)) {
                    router.push('/auth');
                }
            }

            setIsInitialized(true);
        };

        initializeApp();
    }, [dispatch, pathname, router]);

    useEffect(() => {
        if (!isInitialized) return;



        if (isAuthenticated) {
            if (pathname === '/auth' || pathname === '/register') {
                router.push('/chat');
            }
        } else {
            if (isProtectedRoute(pathname)) {
                router.push('/auth');
            }
        }
    }, [isAuthenticated, pathname, router, isInitialized, userId, authorities]);

    useEffect(() => {
        if (error && isProtectedRoute(pathname)) {
            router.push('/auth');
        }
    }, [error, pathname, router]);

    if (!isInitialized || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">
                        {!isInitialized ? 'Đang khởi tạo ứng dụng...' : 'Đang xác thực...'}
                    </p>
                </div>
            </div>
        );
    }

    // Provide user context to all children
    const userContextValue: UserContextType = {
        userId,
        authorities,
        isAuthenticated,
        isLoading
    };

    return (
        <UserContext.Provider value={userContextValue}>
            {children}
        </UserContext.Provider>
    );
}
