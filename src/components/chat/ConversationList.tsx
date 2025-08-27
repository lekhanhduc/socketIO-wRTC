'use client';

import { ConversationDetailResponse } from '@/types/auth';
import ConversationItem from './ConversationItem';
import ConversationListHeader from './ConversationListHeader';

interface ConversationListProps {
    conversations: ConversationDetailResponse[];
    filteredConversations: ConversationDetailResponse[];
    selectedConversation: ConversationDetailResponse | null;
    loading: boolean;
    isSocketConnected: boolean;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    onSearchModeToggle: () => void;
    onConversationSelect: (conversation: ConversationDetailResponse) => void;
    onMarkAsUnread: (conversationId: string) => void;
    onArchive: (conversationId: string) => void;
    onBlock: (conversationId: string) => void;
    onDelete: (conversationId: string) => void;
    getConversationName: (conversation: ConversationDetailResponse) => string;
    parseDateTime: (dateTimeString: string) => Date;
}

export default function ConversationList({
    conversations,
    filteredConversations,
    selectedConversation,
    loading,
    searchTerm,
    onSearchChange,
    onSearchModeToggle,
    onConversationSelect,
    onMarkAsUnread,
    onArchive,
    onBlock,
    onDelete,
    getConversationName,
    parseDateTime,
}: ConversationListProps) {
    return (
        <div className="w-80 bg-white border-r border-emerald-200 flex flex-col shadow-lg">
            <ConversationListHeader
                searchTerm={searchTerm}
                onSearchChange={onSearchChange}
                onSearchModeToggle={onSearchModeToggle}
            />

            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-sm">
                        {loading ? (
                            <div className="flex flex-col items-center space-y-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                                <span>Đang tải...</span>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="flex flex-col items-center space-y-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-1">Chưa có cuộc trò chuyện</h3>
                                    <p className="text-gray-500">Tìm kiếm người dùng để bắt đầu chat</p>
                                </div>
                                <button
                                    onClick={onSearchModeToggle}
                                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition-colors"
                                >
                                    Bắt đầu trò chuyện
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center space-y-3">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <span>Không tìm thấy cuộc trò chuyện</span>
                            </div>
                        )}
                    </div>
                ) : (
                    filteredConversations.map((conversation) => (
                        <ConversationItem
                            key={conversation.id}
                            conversation={conversation}
                            isSelected={selectedConversation?.id === conversation.id}
                            onSelect={onConversationSelect}
                            onMarkAsUnread={onMarkAsUnread}
                            onArchive={onArchive}
                            onBlock={onBlock}
                            onDelete={onDelete}
                            getConversationName={getConversationName}
                            parseDateTime={parseDateTime}
                        />
                    ))
                )}
            </div>
        </div>
    );
}