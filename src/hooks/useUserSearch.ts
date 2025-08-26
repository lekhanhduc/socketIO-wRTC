'use client';

import { useState, useCallback } from 'react';
import { profileApi } from '@/lib/api';
import { ParticipantResponse } from '@/types/auth';

interface UseUserSearchResult {
    searchUsers: (keyword: string) => Promise<ParticipantResponse[]>;
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
}

export function useUserSearch(): UseUserSearchResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchUsers = useCallback(async (keyword: string): Promise<ParticipantResponse[]> => {
        if (!keyword.trim()) {
            return [];
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await profileApi.searchUsers(1, 15, keyword);
            return result.data || [];
        } catch (err) {
            console.error('Search failed:', err);
            setError('Không thể tìm kiếm người dùng');
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);



    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        searchUsers,
        isLoading,
        error,
        clearError
    };
}
