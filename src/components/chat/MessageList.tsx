'use client';

import { RefObject, useEffect, useRef, useCallback } from 'react';
import { ConversationDetailResponse, ChatMessageResponse, isOwnMessage } from '@/types/auth';
import MessageItem from './MessageItem';

interface MessageListProps {
    selectedConversation: ConversationDetailResponse | null;
    pendingChatUser: { userId: string, username: string } | null;
    messages: ChatMessageResponse[];
    userId: string | null;
    loading: boolean;
    loadingMoreMessages: boolean;
    hasMoreMessages: boolean;
    onLoadMore: () => void;
    parseDateTime: (dateTimeString: string) => Date;
    messagesEndRef: RefObject<HTMLDivElement>;
}

export default function MessageList({
    selectedConversation,
    pendingChatUser,
    messages,
    userId,
    loading,
    loadingMoreMessages,
    hasMoreMessages,
    onLoadMore,
    parseDateTime,
    messagesEndRef,
}: MessageListProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const previousScrollHeight = useRef<number>(0);
    const isInitialLoad = useRef<boolean>(true);
    const hasScrolledDown = useRef<boolean>(false);

    const handleScroll = useCallback(() => {
        const container = scrollContainerRef.current;

        if (!container) {
            return;
        }

        const { scrollTop, scrollHeight, clientHeight } = container;

        if (scrollTop > 100) {
            hasScrolledDown.current = true;
        }

        if (isInitialLoad.current && scrollTop > 10) {
            isInitialLoad.current = false;
        }
        if (!hasMoreMessages || loadingMoreMessages) {
            return;
        }

        if (!isInitialLoad.current && hasScrolledDown.current && scrollTop <= 50) {
            previousScrollHeight.current = scrollHeight;
            onLoadMore();
        }
    }, [hasMoreMessages, loadingMoreMessages, onLoadMore]);

    useEffect(() => {
        if (selectedConversation) {
            isInitialLoad.current = true;
            hasScrolledDown.current = false;
        }
    }, [selectedConversation?.id]);

    useEffect(() => {
        if (selectedConversation && messages.length > 0 && isInitialLoad.current && !loading && !loadingMoreMessages) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
                isInitialLoad.current = false;
            }, 100);
        }
    }, [selectedConversation?.id, messages.length, loading, loadingMoreMessages]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container && loadingMoreMessages === false && previousScrollHeight.current > 0) {
            const newScrollHeight = container.scrollHeight;
            const heightDiff = newScrollHeight - previousScrollHeight.current;

            container.scrollTop = heightDiff;
            previousScrollHeight.current = 0;
        }
    }, [loadingMoreMessages]);

    useEffect(() => {
        const container = scrollContainerRef.current;

        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
            return () => {
                container.removeEventListener('scroll', handleScroll);
            };
        }
    }, [handleScroll, messages.length]);
    const showEmptyState = pendingChatUser || (selectedConversation && messages.length === 0 && !loading);

    if (showEmptyState) {
        return (
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-emerald-50/30 to-white">
                <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p className="text-sm">
                            {pendingChatUser
                                ? `Bắt đầu cuộc trò chuyện với ${pendingChatUser.username}`
                                : selectedConversation?.conversationName
                                    ? `Bắt đầu cuộc trò chuyện với ${selectedConversation.conversationName}`
                                    : 'Chưa có tin nhắn nào'
                            }
                        </p>
                        <p className="text-xs text-emerald-500 mt-1">
                            Hãy nhập tin nhắn đầu tiên!
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (selectedConversation && loading) {
        return (
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-emerald-50/30 to-white">
                <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <p className="text-sm">Đang tải tin nhắn...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-emerald-50/30 to-white"
        >
            {loadingMoreMessages && (
                <div className="flex justify-center py-4">
                    <div className="flex items-center space-x-3 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100">
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-sm text-gray-600 font-medium">Đang tải tin nhắn cũ...</span>
                    </div>
                </div>
            )}

            {!hasMoreMessages && messages.length > 0 && (
                <div className="flex justify-center py-2">
                    <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                        Đầu cuộc trò chuyện
                    </span>
                </div>
            )}

            {messages.map((message) => (
                <MessageItem
                    key={message.id || message.tempId}
                    message={message}
                    isOwn={isOwnMessage(message, userId)}
                    parseDateTime={parseDateTime}
                />
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
}