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
    currentPage: number;
    pageSize: number;
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
    conversationName?: string;
    conversationAvatar?: string;
    participants: ConversationParticipant[];
    lastMessageContent: string | null;
    lastMessageTime: string | null;
}

export interface FileMetaDataResponse {
    name: string;
    contentType: string;
    size: number;
    url: string;
    displayOrder?: number;
}

export interface MessageMedia {
    id?: string;
    mediaUrl: string;
    mediaName?: string;
    mediaSize?: number;
    mimeType?: string;
    displayOrder?: number;
    uploadedAt?: string;
}

export interface MediaAttachment {
    fileId?: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    url: string;
    thumbnailUrl?: string;
}

export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'STICKER';

export interface ChatMessageResponse {
    id?: string;
    tempId?: string;
    conversationId: string;
    senderId?: string;
    username?: string;
    message: string;
    status: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ';
    isRead: boolean;
    messageType: MessageType;
    createdAt: string;
    messageMedia?: MessageMedia[]; // Matches backend ChatMessageResponse
    participants?: string[];
}

// Helper function để xác định tin nhắn có phải của người dùng hiện tại không
export const isOwnMessage = (message: ChatMessageResponse, currentUserId: string | null): boolean => {
    return message.senderId === currentUserId;
};

export interface ChatMessageRequest {
    conversationId: string;
    message: string;
    messageType: MessageType;
    messageMedia?: MessageMedia[];
    tempId?: string;
    senderId?: string;
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

// User search types
export interface ParticipantResponse {
    userId: string;
    username: string;
    avatar: string | null;
}

// Conversation creation types
export interface ConversationCreationRequest {
    conversationType: 'PRIVATE' | 'GROUP';
    conversationName?: string;
    conversationAvatar?: string;
    participantIds: string[];
    // Removed messageRequest as it's not in backend
}

// Backend ParticipantInfo structure
export interface ParticipantInfo {
    userId: string;
    username: string;
    avatar: string | null;
}

export interface ConversationCreationResponse {
    id: string;
    conversationType: 'PRIVATE' | 'GROUP';
    participantHash: string;
    conversationAvatar?: string;
    conversationName?: string;
    participantInfo: ParticipantInfo[]; // Changed from ConversationParticipant[] to ParticipantInfo[]
    createdAt: string;
}