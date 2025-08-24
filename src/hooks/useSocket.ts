import { useEffect, useMemo, useRef } from 'react';
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

    const socket = useMemo(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) return null;

        const socketInstance = io('http://localhost:9999', {
            query: {
                token: token
            },
            transports: ['websocket', 'polling'],
            autoConnect: false
        });

        return socketInstance;
    }, []);

    useEffect(() => {
        if (!socket) return;

        socketRef.current = socket;

        socket.connect();

        socket.on('connect', () => {
            // Connected - Join user call room for incoming calls
            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    // Decode token to get userId (assuming JWT format)
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const userId = payload.sub || payload.userId || payload.id;
                    if (userId) {
                        const callRoom = `user_calls_${userId}`;
                        console.log('🔗 Joining call room:', callRoom, 'for userId:', userId);
                        socket.emit('join_conversation', callRoom);
                    } else {
                        console.error('❌ No userId found in token payload:', payload);
                    }
                } catch (error) {
                    console.error('❌ Error joining call room:', error);
                }
            }
        });

        socket.on('disconnect', () => {
            // Disconnected
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        socket.on('chat.message', (message: ChatMessageResponse) => {
            onChatMessage?.(message);
        });

        socket.on('new_message', (message: ChatMessageResponse) => {
            onNewMessage?.(message);
        });

        socket.on('conversation_updated', (message: ChatMessageResponse) => {
            onConversationUpdated?.(message);
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('connect_error');
            socket.off('chat.message');
            socket.off('new_message');
            socket.off('conversation_updated');
            socket.disconnect();
        };
    }, [socket, onChatMessage, onNewMessage, onConversationUpdated]);

    useEffect(() => {
        if (!socket || !conversationId) return;

        socket.emit('join_conversation', conversationId);

        return () => {
            socket.emit('leave_conversation', conversationId);
        };
    }, [socket, conversationId]);

    return {
        socket: socketRef.current,
        isConnected: socket?.connected || false
    };
};