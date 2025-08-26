import { ConversationDetailResponse, PageResponse, ChatMessageResponse, ChatMessageRequest, SignInRequest, SignInResponse, ParticipantResponse, ConversationCreationRequest, ConversationCreationResponse } from "@/types/auth";

const API_BASE = 'http://localhost:9191';

interface ApiResponse<T> {
    code: number;
    message: string;
    data: T;
}

export const api = {
    async post<T>(endpoint: string, data: any): Promise<T> {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const result: ApiResponse<T> = await response.json();
        return result.data;
    },

    async get<T>(endpoint: string): Promise<T> {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const result: ApiResponse<T> = await response.json();
        return result.data;
    },
};

export const chatApi = {
    async getMyConversations(page = 1, size = 20): Promise<ApiResponse<PageResponse<ConversationDetailResponse>>> {
        const response = await fetch(`${API_BASE}/chat/api/v1/conversations?page=${page}&size=${size}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        return response.json();
    },

    async getMessages(conversationId: string, page = 1, size = 20): Promise<ApiResponse<PageResponse<ChatMessageResponse>>> {
        const response = await fetch(`${API_BASE}/chat/api/v1/messages/${conversationId}?page=${page}&size=${size}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        return response.json();
    },

    async sendMessage(data: ChatMessageRequest): Promise<ApiResponse<ChatMessageResponse>> {
        const response = await fetch(`${API_BASE}/chat/api/v1/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        return response.json();
    },

    async createConversation(request: ConversationCreationRequest): Promise<ConversationCreationResponse> {
        const response = await fetch(`${API_BASE}/chat/api/v1/conversations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const result: ApiResponse<ConversationCreationResponse> = await response.json();
        return result.data;
    },
};

// Profile/User search API
export const profileApi = {
    async searchUsers(page = 1, pageSize = 15, keyword = ''): Promise<PageResponse<ParticipantResponse>> {
        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString(),
            keywork: keyword
        });

        const response = await fetch(`${API_BASE}/profile/api/v1/search?${params}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const result: ApiResponse<PageResponse<ParticipantResponse>> = await response.json();
        return result.data;
    },
};



export const authApi = {
    async login(credentials: SignInRequest): Promise<SignInResponse> {
        const response = await fetch(`${API_BASE}/identity/api/v1/auth/sign-in`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Login failed');
        }

        const result: ApiResponse<SignInResponse> = await response.json();
        return result.data;
    },

    async verifyToken(token: string): Promise<{ valid: boolean; userId?: string; authorities?: string[] }> {
        const response = await fetch(`${API_BASE}/identity/api/v1/auth/verification`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Token verification failed');
        }

        const result = await response.json();
        return result.data;
    }
};