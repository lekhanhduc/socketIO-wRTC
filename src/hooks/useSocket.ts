import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ChatMessageResponse } from '@/types/auth';

interface UseSocketProps {
    onChatMessage?: (message: ChatMessageResponse) => void;
    onNewMessage?: (message: ChatMessageResponse) => void;
    onConversationUpdated?: (message: ChatMessageResponse) => void;
    conversationId?: string;
}

export const useSocket = ({ onChatMessage, onNewMessage, onConversationUpdated, conversationId }: UseSocketProps) => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const callbacksRef = useRef({ onChatMessage, onNewMessage, onConversationUpdated });

    useEffect(() => {
        callbacksRef.current = { onChatMessage, onNewMessage, onConversationUpdated };
    });

    const socket = useMemo(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) return null;

        return io('http://localhost:9999', {
            query: { token },
            transports: ['websocket', 'polling'],
            autoConnect: false
        });
    }, []);

    const handleConnect = useCallback(() => {
        setIsConnected(true);
    }, []);

    const handleDisconnect = useCallback(() => {
        setIsConnected(false);
    }, []);

    const handleChatMessage = useCallback((message: ChatMessageResponse) => {
        callbacksRef.current.onChatMessage?.(message);
    }, []);

    const handleNewMessage = useCallback((message: ChatMessageResponse) => {
        callbacksRef.current.onNewMessage?.(message);
    }, []);

    const handleConversationUpdated = useCallback((message: ChatMessageResponse) => {
        callbacksRef.current.onConversationUpdated?.(message);
    }, []);

    useEffect(() => {
        if (!socket) return;

        socketRef.current = socket;

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('chat.message', handleChatMessage);
        socket.on('new_message', handleNewMessage);
        socket.on('conversation_updated', handleConversationUpdated);

        socket.connect();

        return () => {
            socket.off('chat.message', handleChatMessage);
            socket.off('new_message', handleNewMessage);
            socket.off('conversation_updated', handleConversationUpdated);
        };
    }, [socket, handleConnect, handleDisconnect, handleChatMessage, handleNewMessage, handleConversationUpdated]);

    useEffect(() => {
        if (!socket || !conversationId || !isConnected) return;

        socket.emit('join_conversation', conversationId);

        return () => {
            if (socket.connected) {
                socket.emit('leave_conversation', conversationId);
            }
        };
    }, [socket, conversationId, isConnected]);

    return {
        socket: socketRef.current,
        isConnected
    };
};