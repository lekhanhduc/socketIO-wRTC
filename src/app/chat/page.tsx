'use client';

import { useState, useEffect, useMemo } from 'react';
import { useChat } from '@/hooks/useChat';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useUserContext } from '@/components/providers/AppWrapper';
import { ChatMessageRequest } from '@/types/auth';
import Header from '@/components/Header';
import VideoCallModal from '@/components/VideoCallModal';
import UserSearchSidebar from '@/components/UserSearchSidebar/UserSearchSidebar';
import ConversationList from '@/components/chat/ConversationList';
import ChatArea from '@/components/chat/ChatArea';

export default function Chat() {
    const { userId } = useUserContext();
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isCallModalOpen, setIsCallModalOpen] = useState(false);
    const [callType, setCallType] = useState<'audio' | 'video'>('video');
    const [incomingCall, setIncomingCall] = useState<any>(null);
    const [isOutgoingCall, setIsOutgoingCall] = useState(true);
    const [isSearchMode, setIsSearchMode] = useState(false);
    const [pendingChatUser, setPendingChatUser] = useState<{ userId: string, username: string } | null>(null);

    const {
        conversations,
        selectedConversation,
        messages,
        loading,
        loadingMoreMessages,
        hasMoreMessages,
        isSocketConnected,
        loadConversations,
        selectConversation,
        deleteConversation,
        sendMessage: sendChatMessage,
        createOrFindConversation,
        loadMoreMessages,
        socket
    } = useChat();

    const webRTCHook = useWebRTC({
        socket,
        onCallReceived: (callData) => {
            if (!selectedConversation && callData.fromUserId && conversations.length > 0) {
                const callerConversation = conversations.find(conv =>
                    conv.participants.some(p => p.userId === callData.fromUserId)
                );
                if (callerConversation) {
                    selectConversation(callerConversation);
                }
            }

            setIncomingCall(callData);
            setIsOutgoingCall(false);
            setCallType(callData.callType);
            setIsCallModalOpen(true);
        },
        onCallEnded: () => {
            setIsCallModalOpen(false);
            setIncomingCall(null);
        },
        onStreamReceived: (stream) => {
            console.log('Remote stream received in Chat component');
        }
    });

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    const handleMarkAsUnread = (conversationId: string) => {
        console.log('Mark as unread:', conversationId);
    };

    const handleBlockUser = (conversationId: string) => {
        if (confirm('Bạn có chắc chắn muốn chặn người dùng này?')) {
            console.log('Block user:', conversationId);
        }
    };

    const handleArchiveConversation = (conversationId: string) => {
        console.log('Archive conversation:', conversationId);
    };

    const handleDeleteConversation = (conversationId: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) {
            deleteConversation(conversationId);
        }
    };

    const handleAudioCall = () => {
        setCallType('audio');
        setIsOutgoingCall(true);
        setIncomingCall(null);
        setIsCallModalOpen(true);
    };

    const handleVideoCall = () => {
        setCallType('video');
        setIsOutgoingCall(true);
        setIncomingCall(null);
        setIsCallModalOpen(true);
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        const messageText = newMessage;
        setNewMessage('');

        try {
            if (selectedConversation) {
                // Send message to existing conversation
                const messageData: ChatMessageRequest = {
                    conversationId: selectedConversation.id,
                    message: messageText,
                    messageType: 'TEXT',
                };
                await sendChatMessage(messageData);
            } else if (pendingChatUser) {
                // Fallback: create conversation with first message (legacy support)
                try {
                    const newConversation = await createOrFindConversation(pendingChatUser.userId, pendingChatUser.username);
                    setPendingChatUser(null);

                    // Send message to the newly created conversation
                    const messageData: ChatMessageRequest = {
                        conversationId: newConversation.id,
                        message: messageText,
                        messageType: 'TEXT',
                    };
                    await sendChatMessage(messageData);
                } catch (error) {
                    console.error('Failed to create conversation for pending user:', error);
                    setNewMessage(messageText); // Restore message
                }
            }
        } catch (err) {
            console.error('Failed to send message', err);
            setNewMessage(messageText);
        }
    };

    const parseDateTime = (dateTimeString: string): Date => {
        if (!dateTimeString) return new Date();

        try {
            if (dateTimeString.includes('T')) {
                return new Date(dateTimeString);
            }
            const [datePart, timePart] = dateTimeString.split(' ');
            if (!datePart || !timePart) return new Date();

            const [day, month, year] = datePart.split('-');
            const [hour, minute] = timePart.split(':');

            return new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hour),
                parseInt(minute)
            );
        } catch (error) {
            console.error('Error parsing date:', dateTimeString, error);
            return new Date();
        }
    };

    const getConversationName = useMemo(() => (conversation: any) => {
        if (conversation.conversationType === 'PRIVATE') {
            const participant = conversation.participants?.find((p: any) => p.username) || conversation.participants?.[0];
            return participant?.username || 'Người dùng';
        }
        return `Nhóm (${conversation.participants?.length || 0} thành viên)`;
    }, []);

    const filteredConversations = useMemo(() =>
        conversations.filter(conv => {
            const name = getConversationName(conv);
            return name.toLowerCase().includes(searchTerm.toLowerCase());
        }), [conversations, searchTerm, getConversationName]);

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-emerald-50">
            <Header title="RoomChat - Tìm trọ & Tìm người ở ghép" />

            <div className="flex-1 flex overflow-hidden">
                {isSearchMode ? (
                    <UserSearchSidebar
                        onBackToChat={() => {
                            setIsSearchMode(false);
                            setPendingChatUser(null);
                        }}
                        onUserSelected={async (targetUserId, targetUsername) => {
                            try {
                                await createOrFindConversation(targetUserId, targetUsername);
                                setPendingChatUser(null);
                            } catch (error) {
                                console.error('Error creating/finding conversation:', error);
                                setPendingChatUser({ userId: targetUserId, username: targetUsername });
                            }
                            setIsSearchMode(false);
                        }}
                    />
                ) : (
                    <ConversationList
                        conversations={conversations}
                        filteredConversations={filteredConversations}
                        selectedConversation={selectedConversation}
                        loading={loading}
                        isSocketConnected={isSocketConnected}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        onSearchModeToggle={() => setIsSearchMode(true)}
                        onConversationSelect={selectConversation}
                        onMarkAsUnread={handleMarkAsUnread}
                        onArchive={handleArchiveConversation}
                        onBlock={handleBlockUser}
                        onDelete={handleDeleteConversation}
                        getConversationName={getConversationName}
                        parseDateTime={parseDateTime}
                    />
                )}

                <ChatArea
                    selectedConversation={selectedConversation}
                    pendingChatUser={pendingChatUser}
                    messages={messages}
                    newMessage={newMessage}
                    userId={userId}
                    loading={loading}
                    loadingMoreMessages={loadingMoreMessages}
                    hasMoreMessages={hasMoreMessages}
                    onLoadMore={loadMoreMessages}
                    onNewMessageChange={setNewMessage}
                    onSendMessage={sendMessage}
                    onAudioCall={handleAudioCall}
                    onVideoCall={handleVideoCall}
                    getConversationName={getConversationName}
                    parseDateTime={parseDateTime}
                />
            </div>

            {selectedConversation && (
                <VideoCallModal
                    isOpen={isCallModalOpen}
                    onClose={() => {
                        setIsCallModalOpen(false);
                        setIncomingCall(null);
                    }}
                    isVideoCall={callType === 'video'}
                    contactName={incomingCall ?
                        (conversations.find(c => c.participants.some(p => p.userId === incomingCall.fromUserId))?.participants.find(p => p.userId === incomingCall.fromUserId)?.username || 'Unknown User')
                        : getConversationName(selectedConversation)
                    }
                    isOutgoing={isOutgoingCall}
                    targetUserId={isOutgoingCall ?
                        selectedConversation.participants.find(p => p.userId !== userId)?.userId
                        : undefined
                    }
                    socket={socket}
                    incomingCallData={incomingCall}
                    webRTCHook={webRTCHook}
                />
            )}
        </div>
    );
}