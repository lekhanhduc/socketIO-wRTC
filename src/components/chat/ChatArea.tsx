'use client';

import { useRef, useEffect } from 'react';
import { ConversationDetailResponse, ChatMessageResponse } from '@/types/auth';
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
    onSendMessage: () => void;
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

    // Removed auto-scroll logic - let user control their scroll position

    if (!selectedConversation && !pendingChatUser) {
        return <EmptyChatState />;
    }

    return (
        <div className="flex-1 flex flex-col bg-white">
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
            />

            <MessageInput
                newMessage={newMessage}
                onNewMessageChange={onNewMessageChange}
                onSendMessage={onSendMessage}
            />
        </div>
    );
}