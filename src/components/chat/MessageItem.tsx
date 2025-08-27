'use client';

import { ChatMessageResponse } from '@/types/auth';

interface MessageItemProps {
    message: ChatMessageResponse;
    isOwn: boolean;
    parseDateTime: (dateTimeString: string) => Date;
}

export default function MessageItem({
    message,
    isOwn,
    parseDateTime,
}: MessageItemProps) {
    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                {!isOwn && (
                    <div className="text-xs text-gray-500 mb-1 px-1">
                        {message.username}
                    </div>
                )}
                <div
                    className={`px-4 py-2 rounded-2xl ${isOwn
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                        }`}
                >
                    <p className="text-sm">{message.message}</p>
                    <div className={`flex items-center justify-between mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                        <span className="text-xs">
                            {parseDateTime(message.createdAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                        {isOwn && (
                            <span className="text-xs ml-2">
                                {message.status === 'SENDING' && '⏳'}
                                {message.status === 'SENT' && '✓'}
                                {message.status === 'DELIVERED' && '✓✓'}
                                {message.status === 'READ' && '✓✓'}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}