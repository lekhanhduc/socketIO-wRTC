import { useState, useCallback, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useUserContext } from '@/components/providers/AppWrapper';
import { chatApi } from '@/lib/api';
import { ConversationDetailResponse, ChatMessageResponse, ChatMessageRequest, ConversationCreationRequest, isOwnMessage } from '@/types/auth';

export const useChat = () => {
    const { userId: currentUserId } = useUserContext();
    const [conversations, setConversations] = useState<ConversationDetailResponse[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<ConversationDetailResponse | null>(null);
    const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [currentMessagePage, setCurrentMessagePage] = useState(1);

    const handleChatMessage = useCallback((message: ChatMessageResponse) => {
        if (selectedConversation &&
            message.conversationId === selectedConversation.id &&
            message.senderId === currentUserId &&
            message.status === 'SENDING') {

            setMessages(prevMessages => {
                const exists = prevMessages.some(msg => msg.tempId === message.tempId);
                if (exists) return prevMessages;

                return [...prevMessages, message];
            });
        }
    }, [selectedConversation, currentUserId]);

    const handleNewMessage = useCallback((message: ChatMessageResponse) => {
        if (selectedConversation && message.conversationId === selectedConversation.id) {
            setMessages(prevMessages => {
                const tempIndex = prevMessages.findIndex(msg =>
                    msg.tempId === message.tempId && msg.status === 'SENDING'
                );

                if (tempIndex !== -1) {
                    const updatedMessages = [...prevMessages];
                    updatedMessages[tempIndex] = { ...message };
                    return updatedMessages;
                } else {
                    const exists = prevMessages.some(msg => msg.id === message.id);
                    if (!exists) {
                        return [...prevMessages, message];
                    }
                    return prevMessages;
                }
            });
        }
    }, [selectedConversation, currentUserId]);

    const loadConversations = useCallback(async (force = false) => {
        try {
            setLoading(true);
            const response = await chatApi.getMyConversations();
            const conversationsData = response?.data?.data || [];

            const sortedConversations = conversationsData.sort((a: ConversationDetailResponse, b: ConversationDetailResponse) => {
                const timeA = new Date(a.lastMessageTime || 0).getTime();
                const timeB = new Date(b.lastMessageTime || 0).getTime();
                return timeB - timeA;
            });

            setConversations(sortedConversations);
        } catch (err) {
            setConversations([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleConversationUpdated = useCallback((message: ChatMessageResponse) => {

        setConversations(prevConversations => {
            const existingIndex = prevConversations.findIndex(conv => conv.id === message.conversationId);

            let updated: ConversationDetailResponse[];

            if (existingIndex !== -1) {
                updated = prevConversations.map(conv =>
                    conv.id === message.conversationId
                        ? {
                            ...conv,
                            lastMessageContent: message.message,
                            lastMessageTime: message.createdAt
                        }
                        : conv
                );
            } else {
                setTimeout(() => {
                    loadConversations();
                }, 100);
                return prevConversations;
            }

            const sorted = updated.sort((a, b) => {
                const timeA = new Date(a.lastMessageTime || 0).getTime();
                const timeB = new Date(b.lastMessageTime || 0).getTime();
                return timeB - timeA;
            });

            return sorted;
        });
    }, [currentUserId, loadConversations]);

    const { socket, isConnected } = useSocket({
        onChatMessage: handleChatMessage,
        onNewMessage: handleNewMessage,
        onConversationUpdated: handleConversationUpdated,
        conversationId: selectedConversation?.id
    });

    useEffect(() => {
        if (socket && isConnected && currentUserId) {
            const userCallRoom = `user_calls_${currentUserId}`;
            socket.emit('join_conversation', userCallRoom);
        }
    }, [socket, isConnected, currentUserId]);

    const loadMessages = useCallback(async (conversationId: string, page = 1, append = false) => {
        try {
            if (page === 1) {
                setLoading(true);
                setMessages([]);
                setCurrentMessagePage(1);
                setHasMoreMessages(true);
            } else {
                setLoadingMoreMessages(true);
            }

            const response = await chatApi.getMessages(conversationId, page, 10);
            const messagesData = response?.data?.data || [];
            const totalPages = response?.data?.totalPages || 1;
            const currentPage = response?.data?.currentPage || page;

            if (append && page > 1) {
                setMessages(prevMessages => [...messagesData, ...prevMessages]);
            } else {
                setMessages(messagesData);
            }

            setHasMoreMessages(currentPage < totalPages);
            setCurrentMessagePage(currentPage);
        } catch (err) {
            console.error('Failed to load messages:', err);
            if (!append) {
                setMessages([]);
            }
        } finally {
            setLoading(false);
            setLoadingMoreMessages(false);
        }
    }, []);

    const sendMessage = useCallback(async (messageData: ChatMessageRequest) => {
        if (!socket || !isConnected) {
            throw new Error('Socket not connected');
        }

        try {
            socket.emit('chat.send', messageData);
        } catch (err) {
            console.error('Failed to send message via socket', err);
        }
    }, [socket, isConnected]);

    const loadMoreMessages = useCallback(async () => {
        if (!selectedConversation || !hasMoreMessages || loadingMoreMessages) {
            return;
        }
        await loadMessages(selectedConversation.id, currentMessagePage + 1, true);
    }, [selectedConversation, hasMoreMessages, loadingMoreMessages, currentMessagePage, loadMessages]);

    const selectConversation = useCallback((conversation: ConversationDetailResponse) => {
        setCurrentMessagePage(1);
        setHasMoreMessages(true);
        setSelectedConversation(conversation);
        loadMessages(conversation.id, 1, false);

        if (socket && isConnected) {
            socket.emit('join_conversation', conversation.id);
        }
    }, [loadMessages, socket, isConnected, messages.length]);

    const deleteConversation = useCallback(async (conversationId: string) => {
        try {
            await chatApi.deleteConversation(conversationId);

            setConversations(prevConversations =>
                prevConversations.filter(conv => conv.id !== conversationId)
            );

            if (selectedConversation?.id === conversationId) {
                setSelectedConversation(null);
                setMessages([]);
            }

            return true;
        } catch (err) {
            console.error('Failed to delete conversation', err);
        }
    }, [selectedConversation]);

    const clearSelectedConversation = useCallback(() => {
        setSelectedConversation(null);
        setMessages([]);
        setCurrentMessagePage(1);
        setHasMoreMessages(true);
    }, []);

    const createOrFindConversation = useCallback(async (targetUserId: string, targetUsername: string) => {
        try {
            setLoading(true);

            const request: ConversationCreationRequest = {
                conversationType: 'PRIVATE',
                participantIds: [targetUserId, currentUserId!],
            };

            const response = await chatApi.createConversation(request);
            const conversationDetail = chatApi.convertToConversationDetail(response, currentUserId!);

            setSelectedConversation(conversationDetail);
            loadMessages(conversationDetail.id, 1, false);

            loadConversations();

            return conversationDetail;
        } catch (error) {
            console.error('Failed to create/find conversation:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [currentUserId, loadMessages, loadConversations]);

    return {
        conversations,
        selectedConversation,
        messages,
        loading,
        loadingMoreMessages,
        hasMoreMessages,
        isSocketConnected: isConnected,
        loadConversations,
        selectConversation,
        sendMessage,
        deleteConversation,
        clearSelectedConversation,
        createOrFindConversation,
        loadMoreMessages,
        setMessages,
        socket
    };
};