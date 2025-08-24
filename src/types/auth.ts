export interface UserCreationRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    userType: 'USER' | 'LANDLORD';
}

export interface UserCreationResponse {
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
}

export interface SignInRequest {
    email: string;
    password: string;
}

export interface SignInResponse {
    accessToken: string;
    refreshToken: string;
    requiresOtp: boolean;
    userType: string[];
    tokenType: string;
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
}

export interface PageResponse<T> {
    currentPages: number;
    pageSizes: number;
    totalPages: number;
    totalElements: number;
    data: T[];
}

export interface ConversationParticipant {
    userId: string;
    username: string;
    avatar: string | null;
}

export interface ConversationDetailResponse {
    id: string;
    conversationType: 'PRIVATE' | 'GROUP';
    participants: ConversationParticipant[];
    lastMessageContent: string;
    lastMessageTime: string;
}

export interface ChatMessageResponse {
    id?: string;
    tempId?: string;
    conversationId: string;
    senderId?: string;
    username?: string;
    message: string;
    status: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ';
    isRead: boolean;
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'STICKER';
    createdAt: string;
    messageMedia?: any[];
    participants?: string[];
}

// Helper function để xác định tin nhắn có phải của người dùng hiện tại không
export const isOwnMessage = (message: ChatMessageResponse, currentUserId: string | null): boolean => {
    return message.senderId === currentUserId;
};

export interface ChatMessageRequest {
    conversationId: string;
    message: string;
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'STICKER';
}

export interface SocketEvents {
    new_message: ChatMessageResponse;
    conversation_updated: ChatMessageResponse;
    join_conversation: string;
    leave_conversation: string;
}

export interface SocketResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface TokenVerificationResponse {
    valid: boolean;  // API trả về field 'valid' không phải 'isValid'
    userId?: string;
    authorities?: string[];
}

export interface AuthState {
    isAuthenticated: boolean;
    userId: string | null;
    authorities: string[];
    isLoading: boolean;
    error: string | null;
}