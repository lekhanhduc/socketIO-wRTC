import React, { useState, useEffect, useRef } from 'react';
interface VideoCallModalProps {
    isOpen: boolean;
    onClose: () => void;
    isVideoCall: boolean;
    contactName: string;
    isOutgoing: boolean;
    targetUserId?: string;
    socket: any;
    incomingCallData?: any;
    webRTCHook: {
        isCallActive: boolean;
        isConnected: boolean;
        isCallAccepted: boolean;
        isMuted: boolean;
        isVideoEnabled: boolean;
        localStream: MediaStream | null;
        remoteStream: MediaStream | null;
        startCall: (targetUserId: string, callType: 'audio' | 'video') => Promise<void>;
        acceptCall: (incomingCallData: any, withVideo?: boolean) => Promise<void>;
        declineCall: (incomingCallData: any) => void;
        endCall: () => void;
        toggleMute: () => boolean;
        toggleVideo: () => boolean;
    };
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({
    isOpen,
    onClose,
    isVideoCall,
    contactName,
    isOutgoing,
    targetUserId,
    socket,
    incomingCallData,
    webRTCHook
}) => {
    const [callDuration, setCallDuration] = useState(0);
    const [hasAcceptedCall, setHasAcceptedCall] = useState(false);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);


    const {
        isCallActive,
        isConnected,
        isCallAccepted,
        isMuted,
        isVideoEnabled,
        localStream,
        remoteStream,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMute,
        toggleVideo
    } = webRTCHook;

    // Set local video stream
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Set remote video stream
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Start call when modal opens for outgoing calls
    useEffect(() => {
        if (isOpen && isOutgoing && targetUserId && !isCallActive) {
            startCall(targetUserId, isVideoCall ? 'video' : 'audio');
        }
    }, [isOpen, isOutgoing, targetUserId, isVideoCall, isCallActive, startCall]);

    // Timer effect - CHỈ chạy khi cuộc gọi thực sự được kết nối
    useEffect(() => {
        let interval: NodeJS.Timeout;

        // Chỉ bắt đầu timer khi:
        // 1. Cuộc gọi đang active
        // 2. VÀ (cuộc gọi đã được chấp nhận HOẶC đây là cuộc gọi incoming đã được accept)
        // 3. VÀ đã kết nối WebRTC thành công
        const shouldStartTimer = isCallActive && isConnected && (
            isCallAccepted || // Cuộc gọi outgoing đã được chấp nhận
            (!isOutgoing && hasAcceptedCall) // Cuộc gọi incoming và đã được chấp nhận
        );

        if (shouldStartTimer) {
            interval = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            // Reset timer nếu cuộc gọi chưa được chấp nhận hoặc chưa kết nối
            setCallDuration(0);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isCallActive, isConnected, isCallAccepted, isOutgoing, hasAcceptedCall]);

    // Reset states when modal closes
    useEffect(() => {
        if (!isOpen) {
            setCallDuration(0);
            setHasAcceptedCall(false);
        }
    }, [isOpen]);

    const handleAcceptCall = async () => {
        if (incomingCallData) {
            setHasAcceptedCall(true);
            await acceptCall(incomingCallData, isVideoCall);
        }
    };

    const handleDeclineCall = () => {
        if (incomingCallData) {
            declineCall(incomingCallData);
        }
        onClose();
    };

    const handleEndCall = () => {
        endCall();
        onClose();
        setCallDuration(0);
        setHasAcceptedCall(false);
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getCallStatus = () => {
        if (!isCallActive) return '';

        // Cuộc gọi outgoing
        if (isOutgoing) {
            if (!isCallAccepted) {
                return 'Đang gọi...';
            }
            if (!isConnected) {
                return 'Đang kết nối...';
            }
            return formatDuration(callDuration);
        }

        // Cuộc gọi incoming
        if (!hasAcceptedCall) {
            return 'Cuộc gọi đến';
        }
        if (!isConnected) {
            return 'Đang kết nối...';
        }
        return formatDuration(callDuration);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {contactName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">{contactName}</h3>
                            <p className="text-sm text-gray-300">
                                {getCallStatus()}
                            </p>
                        </div>
                    </div>

                    {/* Connection Status Indicator */}
                    <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <span className="text-xs">
                            {isConnected ? 'Đã kết nối' : 'Đang kết nối'}
                        </span>
                    </div>
                </div>

                {/* Video Area */}
                <div className="relative bg-gray-900" style={{ height: '400px' }}>
                    {isVideoCall ? (
                        <>
                            {/* Remote Video */}
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                                style={{ transform: 'scaleX(-1)' }}
                            />

                            {/* Local Video (Picture in Picture) */}
                            <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                    style={{ transform: 'scaleX(-1)' }}
                                />
                            </div>
                        </>
                    ) : (
                        /* Audio Call - Show Avatar */
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-4xl mx-auto mb-4 shadow-2xl">
                                    {contactName.charAt(0).toUpperCase()}
                                </div>
                                <h3 className="text-white text-2xl font-bold">{contactName}</h3>
                                <p className="text-gray-300 mt-2 text-lg">{getCallStatus()}</p>
                            </div>
                        </div>
                    )}

                    {/* No video overlay */}
                    {isVideoCall && !isVideoEnabled && (
                        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-xl">
                                    {contactName.charAt(0).toUpperCase()}
                                </div>
                                <h4 className="text-white text-lg font-semibold mb-2">{contactName}</h4>
                                <p className="text-gray-300">Camera đã tắt</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="bg-gray-900 p-6">
                    {/* Incoming Call Actions */}
                    {!isOutgoing && !hasAcceptedCall && (
                        <div className="flex items-center justify-center space-x-8">
                            <button
                                onClick={handleDeclineCall}
                                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg hover:scale-105"
                                title="Từ chối"
                            >
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </button>

                            <button
                                onClick={handleAcceptCall}
                                className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg hover:scale-105"
                                title="Chấp nhận"
                            >
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Call Controls - chỉ hiển thị khi cuộc gọi đã được chấp nhận */}
                    {(isOutgoing && isCallAccepted) || (!isOutgoing && hasAcceptedCall) ? (
                        <div className="flex items-center justify-center space-x-8">
                            {/* Mute Button */}
                            <button
                                onClick={toggleMute}
                                className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg ${isMuted ? 'bg-red-500 hover:bg-red-600 hover:scale-105' : 'bg-gray-600 hover:bg-gray-700 hover:scale-105'
                                    }`}
                                title={isMuted ? 'Bỏ tắt tiếng' : 'Tắt tiếng'}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {isMuted ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                    )}
                                </svg>
                            </button>

                            {/* Video Toggle Button - chỉ hiển thị cho video call */}
                            {isVideoCall && (
                                <button
                                    onClick={toggleVideo}
                                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg ${!isVideoEnabled ? 'bg-red-500 hover:bg-red-600 hover:scale-105' : 'bg-gray-600 hover:bg-gray-700 hover:scale-105'
                                        }`}
                                    title={isVideoEnabled ? 'Tắt camera' : 'Bật camera'}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {isVideoEnabled ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                        )}
                                    </svg>
                                </button>
                            )}

                            {/* End Call Button */}
                            <button
                                onClick={handleEndCall}
                                className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg hover:scale-105"
                                title="Kết thúc cuộc gọi"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </button>
                        </div>
                    ) : null}

                    {/* Outgoing call controls khi chưa được chấp nhận */}
                    {isOutgoing && !isCallAccepted && (
                        <div className="flex items-center justify-center">
                            <button
                                onClick={handleEndCall}
                                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg hover:scale-105"
                                title="Hủy cuộc gọi"
                            >
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoCallModal;

