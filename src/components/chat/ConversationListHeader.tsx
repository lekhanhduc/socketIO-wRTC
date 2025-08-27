'use client';

import { useState } from 'react';

type FilterTab = 'all' | 'unread' | 'archived';

interface ConversationListHeaderProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    onSearchModeToggle: () => void;
}

export default function ConversationListHeader({
    searchTerm,
    onSearchChange,
    onSearchModeToggle,
}: ConversationListHeaderProps) {
    const [activeTab, setActiveTab] = useState<FilterTab>('all');

    const handleTabClick = (tab: FilterTab) => {
        console.log(`🔄 Clicked tab: ${tab}`);
        setActiveTab(tab);
    };

    return (
        <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
            {/* Search Section */}
            <div className="p-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Tìm roommate, chủ trọ..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onFocus={onSearchModeToggle}
                        className="w-full pl-10 pr-12 py-3 bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm shadow-sm"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                        <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    {/* New Chat Button */}
                    <button
                        onClick={onSearchModeToggle}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-500 hover:text-emerald-600 transition-colors"
                        title="Tìm người ở ghép mới"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-4 pb-4">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => handleTabClick('all')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'all'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Tất cả
                    </button>
                    <button
                        onClick={() => handleTabClick('unread')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'unread'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Chưa đọc
                    </button>
                    <button
                        onClick={() => handleTabClick('archived')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'archived'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Lưu trữ
                    </button>
                </div>
            </div>
        </div>
    );
}