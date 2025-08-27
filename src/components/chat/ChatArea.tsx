'use client';

import { useRef, useEffect } from 'react';
import { ConversationDetailResponse, ChatMessageResponse, MessageMedia } from '@/types/auth';
import EmptyChatState from './EmptyChatState';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatAreaProps {
    selectedConversation: ConversationDetailResponse | null;
    pendingChatUser: { userId: string, username: string } | null;
    messages: ChatMessageResponse[];
    newMessage: string;
    userId: string | null;
    loading: boolean;
    loadingMoreMessages: boolean;
    hasMoreMessages: boolean;
    onLoadMore: () => void;
    onNewMessageChange: (message: string) => void;
    onSendMessage: (attachments?: MessageMedia[]) => void;
    onAudioCall: () => void;
    onVideoCall: () => void;
    getConversationName: (conversation: ConversationDetailResponse) => string;
    parseDateTime: (dateTimeString: string) => Date;
}

export default function ChatArea({
    selectedConversation,
    pendingChatUser,
    messages,
    newMessage,
    userId,
    loading,
    loadingMoreMessages,
    hasMoreMessages,
    onLoadMore,
    onNewMessageChange,
    onSendMessage,
    onAudioCall,
    onVideoCall,
    getConversationName,
    parseDateTime,
}: ChatAreaProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null!);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const previousMessagesLength = useRef<number>(0);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const newMessagesAdded = messages.length > previousMessagesLength.current && !loadingMoreMessages;

        if (newMessagesAdded) {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

            if (isNearBottom) {
                console.log('✅ Auto-scrolling to bottom - user is near bottom and new message added');
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
            } else {
                console.log('📌 Not auto-scrolling - user is reading older messages');
            }
        }

        previousMessagesLength.current = messages.length;
    }, [messages, loadingMoreMessages]);

    if (!selectedConversation && !pendingChatUser) {
        return <EmptyChatState />;
    }

    return (
        <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-50 to-white">
            <ChatHeader
                selectedConversation={selectedConversation}
                pendingChatUser={pendingChatUser}
                onAudioCall={onAudioCall}
                onVideoCall={onVideoCall}
                getConversationName={getConversationName}
            />

            <MessageList
                selectedConversation={selectedConversation}
                pendingChatUser={pendingChatUser}
                messages={messages}
                userId={userId}
                loading={loading}
                loadingMoreMessages={loadingMoreMessages}
                hasMoreMessages={hasMoreMessages}
                onLoadMore={onLoadMore}
                parseDateTime={parseDateTime}
                messagesEndRef={messagesEndRef}
                scrollContainerRef={scrollContainerRef}
            />

            <MessageInput
                newMessage={newMessage}
                onNewMessageChange={onNewMessageChange}
                onSendMessage={onSendMessage}
            />
        </div>
    );
}