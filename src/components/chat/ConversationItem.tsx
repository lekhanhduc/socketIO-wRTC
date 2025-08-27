'use client';

import { useState } from 'react';
import { ConversationDetailResponse } from '@/types/auth';

interface ConversationItemProps {
    conversation: ConversationDetailResponse;
    isSelected: boolean;
    onSelect: (conversation: ConversationDetailResponse) => void;
    onMarkAsUnread: (conversationId: string) => void;
    onArchive: (conversationId: string) => void;
    onBlock: (conversationId: string) => void;
    onDelete: (conversationId: string) => void;
    getConversationName: (conversation: ConversationDetailResponse) => string;
    parseDateTime: (dateTimeString: string) => Date;
}

export default function ConversationItem({
    conversation,
    isSelected,
    onSelect,
    onMarkAsUnread,
    onArchive,
    onBlock,
    onDelete,
    getConversationName,
    parseDateTime,
}: ConversationItemProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleDropdownToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleAction = (action: () => void) => {
        action();
        setIsDropdownOpen(false);
    };

    return (
        <div
            className={`group relative p-4 hover:bg-emerald-50 transition-all duration-200 cursor-pointer border-l-4 border-transparent hover:border-emerald-200 ${isSelected ? 'bg-emerald-100 border-emerald-500' : ''
                }`}
        >
            <div
                onClick={() => onSelect(conversation)}
                className="flex items-center justify-between"
            >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {getConversationName(conversation).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <div className="font-semibold text-gray-900 truncate text-sm">
                                {getConversationName(conversation)}
                            </div>
                            {conversation.lastMessageTime && (
                                <div className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                    {parseDateTime(conversation.lastMessageTime).toLocaleTimeString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="text-sm text-gray-600 truncate mt-0.5">
                            {conversation.lastMessageContent || 'Chưa có tin nhắn'}
                        </div>
                    </div>
                </div>

                <div className="ml-2">
                    <button
                        onClick={handleDropdownToggle}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-100 rounded-full transition-all duration-200"
                        title="Tùy chọn"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                    </button>

                    {isDropdownOpen && (
                        <div className="dropdown-menu absolute right-0 top-20 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                            <button
                                onClick={() => handleAction(() => onMarkAsUnread(conversation.id))}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>Đánh dấu là chưa đọc</span>
                            </button>

                            <button
                                onClick={() => handleAction(() => onArchive(conversation.id))}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                                <span>Lưu trữ đoạn chat</span>
                            </button>

                            <button
                                onClick={() => handleAction(() => onBlock(conversation.id))}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                </svg>
                                <span>Chặn</span>
                            </button>

                            <hr className="my-1" />

                            <button
                                onClick={() => handleAction(() => onDelete(conversation.id))}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>Xóa đoạn chat</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}