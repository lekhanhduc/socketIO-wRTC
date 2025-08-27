'use client';

import { useState, useCallback, useRef } from 'react';
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
    const abortControllerRef = useRef<AbortController | null>(null);

    const searchUsers = useCallback(async (keyword: string): Promise<ParticipantResponse[]> => {
        if (!keyword.trim()) {
            setIsLoading(false);
            setError(null);
            return [];
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        setIsLoading(true);
        setError(null);

        try {
            const result = await profileApi.searchUsers(1, 15, keyword);

            if (abortControllerRef.current?.signal.aborted) {
                return [];
            }

            return result.data || [];
        } catch (err: any) {
            if (err.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
                return [];
            }

            console.error('Search failed:', err);
            setError('Không thể tìm kiếm người dùng');
            return [];
        } finally {
            if (!abortControllerRef.current?.signal.aborted) {
                setIsLoading(false);
            }
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
