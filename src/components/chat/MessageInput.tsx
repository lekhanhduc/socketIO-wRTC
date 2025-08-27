'use client';

interface MessageInputProps {
    newMessage: string;
    onNewMessageChange: (message: string) => void;
    onSendMessage: () => void;
}

export default function MessageInput({
    newMessage,
    onNewMessageChange,
    onSendMessage,
}: MessageInputProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onSendMessage();
        }
    };

    return (
        <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-end space-x-3">
                <div className="flex-1">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => onNewMessageChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Nhập tin nhắn..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                </div>
                <button
                    onClick={onSendMessage}
                    disabled={!newMessage.trim()}
                    className="p-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </div>
        </div>
    );
}