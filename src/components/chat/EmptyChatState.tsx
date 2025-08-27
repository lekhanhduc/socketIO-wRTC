'use client';

export default function EmptyChatState() {
    return (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-emerald-600">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-emerald-800 mb-2">Chào mừng đến RoomChat!</h3>
                <p className="text-sm text-emerald-600">Tìm kiếm roommate hoặc bắt đầu cuộc trò chuyện về tìm trọ</p>
            </div>
        </div>
    );
}