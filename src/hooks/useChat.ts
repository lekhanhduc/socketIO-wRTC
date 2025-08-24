import { useState, useCallback, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useUserContext } from '@/components/providers/AppWrapper';
import { chatApi } from '@/lib/api';
import { ConversationDetailResponse, ChatMessageResponse, ChatMessageRequest, isOwnMessage } from '@/types/auth';

export const useChat = () => {
    const { userId: currentUserId } = useUserContext();
    const [conversations, setConversations] = useState<ConversationDetailResponse[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<ConversationDetailResponse | null>(null);
    const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
    const [loading, setLoading] = useState(false);

    // Socket handlers
    const handleChatMessage = useCallback((message: ChatMessageResponse) => {

        // Thêm tin nhắn với trạng thái SENDING ngay lập tức
        if (selectedConversation && message.conversationId === selectedConversation.id) {
            setMessages(prevMessages => {
                // Kiểm tra xem tin nhắn đã tồn tại chưa
                const exists = prevMessages.some(msg => msg.tempId === message.tempId);
                if (exists) return prevMessages;

                return [...prevMessages, message];
            });
        }
    }, [selectedConversation, currentUserId]);

    const handleNewMessage = useCallback((message: ChatMessageResponse) => {

        // Chỉ thêm tin nhắn nếu đang ở trong conversation đó
        if (selectedConversation && message.conversationId === selectedConversation.id) {
            setMessages(prevMessages => {
                // Tìm tin nhắn có tempId tương ứng để cập nhật
                const existingIndex = prevMessages.findIndex(msg => msg.tempId === message.tempId);

                if (existingIndex !== -1) {
                    // Cập nhật tin nhắn từ SENDING thành SENT với ID thực
                    const updatedMessages = [...prevMessages];
                    updatedMessages[existingIndex] = { ...message };
                    return updatedMessages;
                } else {
                    // Nếu không tìm thấy tempId, thêm tin nhắn mới (từ người khác)
                    const exists = prevMessages.some(msg => msg.id === message.id);
                    if (!exists) {
                        return [...prevMessages, message];
                    }
                    return prevMessages;
                }
            });
        }
    }, [selectedConversation, currentUserId]);

    const handleConversationUpdated = useCallback((message: ChatMessageResponse) => {

        // Cập nhật last message trong danh sách conversations
        setConversations(prevConversations =>
            prevConversations.map(conv =>
                conv.id === message.conversationId
                    ? {
                        ...conv,
                        lastMessageContent: message.message,
                        lastMessageTime: message.createdAt
                    }
                    : conv
            )
        );
    }, []);

    // Sử dụng useSocket với handlers
    const { socket, isConnected } = useSocket({
        onChatMessage: handleChatMessage,
        onNewMessage: handleNewMessage,
        onConversationUpdated: handleConversationUpdated,
        conversationId: selectedConversation?.id
    });

    useEffect(() => {
        if (socket && isConnected && currentUserId) {
            socket.emit('call.join_room', currentUserId);
            console.log(`🔔 Joined global call room for user: ${currentUserId}`);
        }
    }, [socket, isConnected, currentUserId]);

    const loadConversations = useCallback(async () => {
        try {
            setLoading(true);
            const response = await chatApi.getMyConversations();
            const conversationsData = response?.data?.data || [];
            setConversations(conversationsData);
        } catch (err) {
            console.error('Failed to load conversations', err);
            setConversations([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load messages for a conversation
    const loadMessages = useCallback(async (conversationId: string) => {
        try {
            setLoading(true);
            const response = await chatApi.getMessages(conversationId);
            const messagesData = response?.data?.data || [];
            setMessages(messagesData);
        } catch (err) {
            console.error('Failed to load messages', err);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Send message via Socket.IO
    const sendMessage = useCallback(async (messageData: ChatMessageRequest) => {
        if (!socket || !isConnected) {
            throw new Error('Socket not connected');
        }

        try {
            socket.emit('chat.send', messageData);
        } catch (err) {
            console.error('Failed to send message via socket', err);
            throw err;
        }
    }, [socket, isConnected]);

    // Select conversation and join room
    const selectConversation = useCallback((conversation: ConversationDetailResponse) => {
        setSelectedConversation(conversation);
        loadMessages(conversation.id);
        // useSocket sẽ tự động join room khi conversationId thay đổi
    }, [loadMessages]);



    return {
        conversations,
        selectedConversation,
        messages,
        loading,
        isSocketConnected: isConnected,
        loadConversations,
        selectConversation,
        sendMessage,
        setMessages,
        socket
    };
};