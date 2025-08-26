'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useUserContext } from '@/components/providers/AppWrapper';
import { ChatMessageRequest, isOwnMessage } from '@/types/auth';
import { chatApi } from '@/lib/api';
import Header from '@/components/Header';
import VideoCallModal from '@/components/VideoCallModal';
import UserSearchSidebar from '@/components/UserSearchSidebar/UserSearchSidebar';

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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
        conversations,
        selectedConversation,
        messages,
        isSocketConnected,
        loadConversations,
        selectConversation,
        sendMessage: sendChatMessage,
        socket
    } = useChat();

    // WebRTC hook for handling calls
    const webRTCHook = useWebRTC({
        socket,
        onCallReceived: (callData) => {
            console.log('Incoming call received:', callData);

            // Tự động tìm conversation với người gọi nếu chưa có conversation được chọn
            if (!selectedConversation && callData.fromUserId && conversations.length > 0) {
                const callerConversation = conversations.find(conv =>
                    conv.participants.some(p => p.userId === callData.fromUserId)
                );
                if (callerConversation) {
                    selectConversation(callerConversation);
                    console.log('🔄 Auto-selected conversation for incoming call:', callerConversation);
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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);



    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        const messageText = newMessage;
        setNewMessage('');

        try {
            if (selectedConversation) {
                // Gửi message cho conversation đã có
                const messageData: ChatMessageRequest = {
                    conversationId: selectedConversation.id,
                    message: messageText,
                    messageType: 'TEXT',
                };
                await sendChatMessage(messageData);
            } else if (pendingChatUser) {
                // Tạo conversation mới với message đầu tiên
                const conversationRequest = {
                    conversationType: 'PRIVATE' as const,
                    participantIds: [pendingChatUser.userId, userId!],
                    messageRequest: {
                        senderId: userId!,
                        conversationId: '',
                        message: messageText,
                        messageType: 'TEXT' as const
                    }
                };

                const conversation = await chatApi.createConversation(conversationRequest);

                // Tạo conversation object giả để hiển thị ngay lập tức
                const newConversation = {
                    id: conversation.id,
                    conversationType: 'PRIVATE' as const,
                    participants: [
                        {
                            userId: pendingChatUser.userId,
                            username: pendingChatUser.username,
                            avatar: null
                        }
                    ],
                    lastMessageContent: messageText,
                    lastMessageTime: new Date().toISOString()
                };

                // Clear pending user và select conversation mới ngay lập tức
                setPendingChatUser(null);
                selectConversation(newConversation);

                // Load conversations để update sidebar (không cần timeout)
                loadConversations();
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
                {/* Sidebar - Chat List hoặc User Search */}
                {isSearchMode ? (
                    <UserSearchSidebar
                        onBackToChat={() => setIsSearchMode(false)}
                        onUserSelected={(targetUserId, targetUsername) => {
                            // Lưu thông tin user để chuẩn bị chat
                            setPendingChatUser({ userId: targetUserId, username: targetUsername });
                            // Quay lại chat mode
                            setIsSearchMode(false);
                        }}
                    />
                ) : (
                    <div className="w-80 bg-white border-r border-emerald-200 flex flex-col shadow-lg">
                        {/* Search */}
                        <div className="p-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Tìm roommate, chủ trọ..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onFocus={() => setIsSearchMode(true)}
                                    className="w-full pl-10 pr-12 py-3 bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm shadow-sm"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                    <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                {/* New Chat Button */}
                                <button
                                    onClick={() => setIsSearchMode(true)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-500 hover:text-emerald-600 transition-colors"
                                    title="Tìm người ở ghép mới"
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Connection Status */}
                            <div className="flex items-center mt-3 text-xs">
                                <div className={`w-2 h-2 rounded-full mr-2 ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-gray-500">
                                    {isSocketConnected ? 'Đã kết nối' : 'Mất kết nối'}
                                </span>
                            </div>
                        </div>

                        {/* Conversations List */}
                        <div className="flex-1 overflow-y-auto">
                            {filteredConversations.length === 0 ? (
                                <div className="p-6 text-center text-gray-500 text-sm">
                                    {conversations.length === 0 ? 'Đang tải...' : 'Không tìm thấy cuộc trò chuyện'}
                                </div>
                            ) : (
                                filteredConversations.map((conversation) => (
                                    <div
                                        key={conversation.id}
                                        onClick={() => selectConversation(conversation)}
                                        className={`p-4 border-b border-emerald-50 cursor-pointer hover:bg-emerald-50 transition-colors border-l-4 border-transparent hover:border-emerald-500 ${selectedConversation?.id === conversation.id ? 'bg-emerald-50 border-emerald-500' : ''
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                                                {getConversationName(conversation).charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 truncate">
                                                    {getConversationName(conversation)}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate">
                                                    {conversation.lastMessageContent || 'Chưa có tin nhắn'}
                                                </div>
                                            </div>
                                            {conversation.lastMessageTime && (
                                                <div className="text-xs text-gray-400 flex-shrink-0">
                                                    {parseDateTime(conversation.lastMessageTime).toLocaleTimeString('vi-VN', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-white">
                    {selectedConversation || pendingChatUser ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-6 py-4 border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                                            {selectedConversation
                                                ? getConversationName(selectedConversation).charAt(0).toUpperCase()
                                                : pendingChatUser?.username.charAt(0).toUpperCase()
                                            }
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-emerald-800">
                                                {selectedConversation
                                                    ? getConversationName(selectedConversation)
                                                    : pendingChatUser?.username
                                                }
                                            </h3>
                                            <p className="text-sm text-emerald-600">
                                                {selectedConversation
                                                    ? 'Đang online • Tìm trọ/Cho thuê trọ'
                                                    : 'Bắt đầu cuộc trò chuyện về tìm trọ'
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {/* Call Buttons */}
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => {
                                                setCallType('audio');
                                                setIsOutgoingCall(true);
                                                setIncomingCall(null);
                                                setIsCallModalOpen(true);
                                            }}
                                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors duration-200"
                                            title="Gọi thoại"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </button>

                                        {/* Video Call Button */}
                                        <button
                                            onClick={() => {
                                                setCallType('video');
                                                setIsOutgoingCall(true);
                                                setIncomingCall(null);
                                                setIsCallModalOpen(true);
                                            }}
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                                            title="Gọi video"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>

                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-emerald-50/30 to-white">
                                {(selectedConversation && messages.length === 0) || pendingChatUser ? (
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
                                                    : 'Chưa có tin nhắn nào'
                                                }
                                            </p>
                                            <p className="text-xs text-emerald-500 mt-1">
                                                {pendingChatUser
                                                    ? 'Hỏi về phòng trọ, giá cả, tiện ích...'
                                                    : 'Hãy nhập tin nhắn đầu tiên!'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    messages.map((message) => {
                                        const isOwn = isOwnMessage(message, userId);
                                        return (
                                            <div
                                                key={message.id || message.tempId}
                                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                                                    {!isOwn && (
                                                        <div className="text-xs text-gray-500 mb-1 px-1">
                                                            {message.username}
                                                        </div>
                                                    )}
                                                    <div
                                                        className={`px-4 py-2 rounded-2xl ${isOwn
                                                            ? 'bg-blue-500 text-white rounded-br-md'
                                                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                                                            }`}
                                                    >
                                                        <p className="text-sm">{message.message}</p>
                                                        <div className={`flex items-center justify-between mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                                                            <span className="text-xs">
                                                                {parseDateTime(message.createdAt).toLocaleTimeString('vi-VN', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                            {isOwn && (
                                                                <span className="text-xs ml-2">
                                                                    {message.status === 'SENDING' && '⏳'}
                                                                    {message.status === 'SENT' && '✓'}
                                                                    {message.status === 'DELIVERED' && '✓✓'}
                                                                    {message.status === 'READ' && '✓✓'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t border-gray-200 bg-white">
                                <div className="flex items-end space-x-3">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                            placeholder="Nhập tin nhắn..."
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        />
                                    </div>
                                    <button
                                        onClick={sendMessage}
                                        disabled={!newMessage.trim()}
                                        className="p-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-gray-50">
                            <div className="text-center text-emerald-600">
                                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-emerald-800 mb-2">Chào mừng đến RoomChat!</h3>
                                <p className="text-sm text-emerald-600">Tìm kiếm roommate hoặc bắt đầu cuộc trò chuyện về tìm trọ</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>



            {/* Video Call Modal */}
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