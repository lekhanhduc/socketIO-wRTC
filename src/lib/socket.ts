import { io, Socket } from 'socket.io-client';
import { ChatMessageResponse } from '@/types/auth';

class SocketService {
    private socket: Socket | null = null;
    private isConnected = false;

    connect(token: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.socket?.connected) {
                resolve();
                return;
            }

            this.socket = io('http://localhost:9999', {
                auth: {
                    token: token
                },
                transports: ['websocket', 'polling']
            });

            this.socket.on('connect', () => {
                console.log('Socket connected:', this.socket?.id);
                this.isConnected = true;
                resolve();
            });

            this.socket.on('disconnect', () => {
                console.log('Socket disconnected');
                this.isConnected = false;
            });

            this.socket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                this.isConnected = false;
                reject(error);
            });
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    joinConversation(conversationId: string) {
        if (this.socket && this.isConnected) {
            this.socket.emit('join_room', conversationId);
            console.log('Joined conversation:', conversationId);
        }
    }

    leaveConversation(conversationId: string) {
        if (this.socket && this.isConnected) {
            this.socket.emit('leave_room', conversationId);
            console.log('Left conversation:', conversationId);
        }
    }

    onNewMessage(callback: (message: ChatMessageResponse) => void) {
        if (this.socket) {
            this.socket.on('new_message', callback);
        }
    }

    onConversationUpdated(callback: (message: ChatMessageResponse) => void) {
        if (this.socket) {
            this.socket.on('conversation_updated', callback);
        }
    }

    offNewMessage() {
        if (this.socket) {
            this.socket.off('new_message');
        }
    }

    offConversationUpdated() {
        if (this.socket) {
            this.socket.off('conversation_updated');
        }
    }

    getConnectionStatus(): boolean {
        return this.isConnected;
    }
}

export const socketService = new SocketService();