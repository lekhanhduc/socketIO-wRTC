'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ParticipantResponse } from '@/types/auth';
import { useUserContext } from '@/components/providers/AppWrapper';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useDebounce } from '@/hooks/useDebounce';

interface UserSearchSidebarProps {
    onBackToChat: () => void;
    onUserSelected?: (targetUserId: string, targetUsername: string) => void;
}

export default function UserSearchSidebar({
    onBackToChat,
    onUserSelected
}: UserSearchSidebarProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<ParticipantResponse[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const { searchUsers, isLoading, error, clearError } = useUserSearch();

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        const performSearch = async () => {
            if (!debouncedSearchTerm.trim()) {
                setSearchResults([]);
                return;
            }

            try {
                const results = await searchUsers(debouncedSearchTerm);
                setSearchResults(results);
            } catch (err) {
                console.error('Search error:', err);
                setSearchResults([]);
            }
        };

        performSearch();
    }, [debouncedSearchTerm, searchUsers]);

    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    const handleUserSelect = useCallback((selectedUser: ParticipantResponse) => {
        onUserSelected?.(selectedUser.userId, selectedUser.username);
    }, [onUserSelected]);

    return (
        <div className="w-80 bg-white border-r border-emerald-200 flex flex-col h-full shadow-lg">
            {/* Header với nút Back */}
            <div className="p-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center space-x-3 mb-4">
                    <button
                        onClick={onBackToChat}
                        className="p-2 hover:bg-emerald-100 rounded-full transition-colors"
                        disabled={isLoading}
                    >
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 className="text-lg font-semibold text-emerald-800">
                        Tìm roommate
                    </h2>
                </div>

                {/* Search Input */}
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Nhập tên người cần tìm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm shadow-sm"
                        autoFocus
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                        <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto">
                {error && (
                    <div className="p-4 text-center text-red-600 text-sm bg-red-50 border-b">
                        {error}
                    </div>
                )}

                {isLoading && (
                    <div className="p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">Đang tìm kiếm...</p>
                    </div>
                )}

                {!isLoading && !error && searchTerm && searchResults.length === 0 && (
                    <div className="p-6 text-center text-gray-500 text-sm">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <p className="font-medium">Không tìm thấy người dùng</p>
                        <p className="text-xs text-gray-400 mt-1">Thử tìm kiếm với từ khóa khác</p>
                    </div>
                )}

                {!isLoading && !error && !searchTerm && (
                    <div className="p-6 text-center text-gray-500">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-emerald-800 mb-2">Tìm roommate</h3>
                        <p className="text-sm text-emerald-600">Nhập tên để tìm kiếm người cần tìm trọ hoặc cho thuê trọ</p>
                    </div>
                )}

                {!isLoading && !error && searchResults.length > 0 && (
                    <div>
                        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100">
                            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">
                                Người dùng tìm thấy
                            </p>
                        </div>
                        <div className="divide-y divide-emerald-100">
                            {searchResults.map((user) => (
                                <div
                                    key={user.userId}
                                    onClick={() => !isLoading && handleUserSelect(user)}
                                    className={`p-4 transition-colors border-l-4 border-transparent ${isLoading
                                        ? 'cursor-not-allowed opacity-50'
                                        : 'hover:bg-emerald-50 cursor-pointer hover:border-emerald-500'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="relative">
                                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">
                                                {user.username}
                                            </p>
                                            <p className="text-sm text-emerald-600 truncate">
                                                Tìm trọ/Cho thuê trọ
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


