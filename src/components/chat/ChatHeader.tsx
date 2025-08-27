'use client';

import { ConversationDetailResponse } from '@/types/auth';

interface ChatHeaderProps {
    selectedConversation: ConversationDetailResponse | null;
    pendingChatUser: { userId: string, username: string } | null;
    onAudioCall: () => void;
    onVideoCall: () => void;
    getConversationName: (conversation: ConversationDetailResponse) => string;
}

export default function ChatHeader({
    selectedConversation,
    pendingChatUser,
    onAudioCall,
    onVideoCall,
    getConversationName,
}: ChatHeaderProps) {
    const displayName = selectedConversation
        ? getConversationName(selectedConversation)
        : pendingChatUser?.username;

    const displayStatus = selectedConversation
        ? 'Đang online • Tìm trọ/Cho thuê trọ'
        : 'Bắt đầu cuộc trò chuyện về tìm trọ';

    return (
        <div className="px-6 py-4 border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-white">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                        {displayName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-semibold text-emerald-800">
                            {displayName}
                        </h3>
                        <p className="text-sm text-emerald-600">
                            {displayStatus}
                        </p>
                    </div>
                </div>

                {/* Call Buttons */}
                <div className="flex items-center space-x-2">
                    <button
                        onClick={onAudioCall}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors duration-200"
                        title="Gọi thoại"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                    </button>

                    <button
                        onClick={onVideoCall}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                        title="Gọi video"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}