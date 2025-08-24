'use client';

import { useUserContext } from '@/components/providers/AppWrapper';

export default function UserInfo() {
    const { userId, authorities } = useUserContext();

    if (!userId) return null;

    return (
        <div className="bg-white p-4 border-b">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-medium">
                    {userId.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div className="font-medium">User ID: {userId}</div>
                    <div className="text-sm text-gray-500">
                        Authorities: {authorities.join(', ') || 'None'}
                    </div>
                </div>
            </div>
        </div>
    );
}
