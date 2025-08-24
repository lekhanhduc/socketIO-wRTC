import { useRef, useCallback, useState, useEffect } from 'react';
import SimplePeer from 'simple-peer';

interface UseWebRTCProps {
    socket: any;
    onCallReceived?: (callData: any) => void;
    onCallEnded?: () => void;
    onStreamReceived?: (stream: MediaStream) => void;
}

export const useWebRTC = ({ socket, onCallReceived, onCallEnded, onStreamReceived }: UseWebRTCProps) => {

    const [isCallActive, setIsCallActive] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [callId, setCallId] = useState<string | null>(null);
    const [isInitiator, setIsInitiator] = useState(false);
    const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isCallAccepted, setIsCallAccepted] = useState(false);
    const [callType, setCallType] = useState<'audio' | 'video'>('video');

    const peerRef = useRef<SimplePeer.Instance | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const ensureAudioEnabled = useCallback((stream: MediaStream) => {
        const audioTracks = stream.getAudioTracks();
        audioTracks.forEach(track => {
            if (!track.enabled) {
                track.enabled = true;
            }
        });
        return audioTracks.length > 0;
    }, []);

    const getUserMedia = useCallback(async (video: boolean = true, audio: boolean = true) => {
        try {
            const constraints = {
                video: video ? {
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    frameRate: { ideal: 30, max: 60 }
                } : false,
                audio: audio ? {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100,
                    sampleSize: 16,
                    channelCount: 2
                } : false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            const audioTracks = stream.getAudioTracks();
            const videoTracks = stream.getVideoTracks();

            audioTracks.forEach((track) => {
                track.enabled = true;
            });

            videoTracks.forEach((track) => {
                track.enabled = true;
            });

            localStreamRef.current = stream;

            return stream;
        } catch (error: any) {
            if (error.name === 'NotAllowedError') {
                alert('Vui lòng cấp quyền microphone/camera trong browser settings.');
            } else if (error.name === 'NotFoundError') {
                alert('Không tìm thấy microphone/camera. Vui lòng kiểm tra thiết bị.');
            } else if (error.name === 'NotReadableError') {
                alert('Microphone/camera đang được sử dụng bởi ứng dụng khác.');
            }

            if (video && audio) {
                return getUserMedia(false, true);
            }
            throw error;
        }
    }, []);

    const initializePeer = useCallback((initiator: boolean, currentCallId: string, currentRemoteUserId: string, stream?: MediaStream) => {
        if (!currentCallId || !currentRemoteUserId) {
            return;
        }

        const peer = new SimplePeer({
            initiator,
            trickle: true,
            stream: stream || undefined,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ],
                iceCandidatePoolSize: 4,
                bundlePolicy: 'max-bundle',
                rtcpMuxPolicy: 'require',
                iceTransportPolicy: 'all'
            },
            offerOptions: {
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            },
            answerOptions: {
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            }
        });

        peer.on('signal', (data: any) => {
            if (socket && currentCallId && currentRemoteUserId) {
                const signalData = {
                    callId: currentCallId,
                    targetUserId: currentRemoteUserId,
                    signalType: data.type === 'offer' ? 'offer' : data.type === 'answer' ? 'answer' : 'ice-candidate',
                    sdp: data.sdp,
                    candidate: data.candidate ? JSON.stringify(data.candidate) : null,
                    sdpMid: data.sdpMid,
                    sdpMLineIndex: data.sdpMLineIndex
                };

                socket.emit('webrtc.signal', signalData);
            }
        });

        peer.on('connect', () => {
            setIsConnected(true);
        });

        peer.on('stream', (remoteStream) => {
            const remoteAudioTracks = remoteStream.getAudioTracks();
            const remoteVideoTracks = remoteStream.getVideoTracks();

            remoteAudioTracks.forEach((track) => {
                track.enabled = true;

                if (track.muted) {
                    const audioElement = new Audio();
                    audioElement.srcObject = new MediaStream([track]);
                    audioElement.volume = 1.0;
                    audioElement.muted = false;
                    audioElement.autoplay = true;

                    audioElement.play().catch(() => { });

                    (window as any)[`audioTrack_${track.id}`] = audioElement;
                }
            });

            ensureAudioEnabled(remoteStream);

            remoteVideoTracks.forEach((track) => {
                track.enabled = true;
            });

            if (remoteAudioTracks.length > 0 && !audioContextRef.current) {
                try {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                    if (audioContextRef.current.state === 'suspended') {
                        audioContextRef.current.resume();
                    }
                } catch (error) { }
            }

            remoteStreamRef.current = remoteStream;

            onStreamReceived?.(remoteStream);

            if (streamTimeout) {
                clearTimeout(streamTimeout);
            }
        });

        peer.on('error', (error) => {
            console.error('❌ Peer error:', error);
        });

        const streamTimeout = setTimeout(() => {
        }, 3000);

        peer.on('close', () => {
            setIsConnected(false);
            endCall();
        });

        peer.on('iceConnectionState', (state: string) => {
            if (state === 'connected' || state === 'completed') {
                setIsConnected(true);
            }
            if (state === 'failed' || state === 'disconnected') {
                endCall();
            }
        });

        peerRef.current = peer;
        return peer;
    }, [socket, onStreamReceived]);

    const startCall = useCallback(async (targetUserId: string, callType: 'audio' | 'video') => {
        try {
            const stream = await getUserMedia(true, true);

            if (callType === 'audio') {
                const videoTracks = stream.getVideoTracks();
                videoTracks.forEach(track => {
                    track.enabled = false;
                });
                setIsVideoEnabled(false);
            } else {
                setIsVideoEnabled(true);
            }

            setRemoteUserId(targetUserId);
            setIsInitiator(true);
            setIsCallActive(true);
            setIsCallAccepted(false);
            setCallType(callType);

            localStreamRef.current = stream;

            if (socket) {
                socket.emit('call.initiate', {
                    targetUserId,
                    callType
                });
            }
        } catch (error) {
            setIsCallActive(false);
            setCallId(null);
            setRemoteUserId(null);
            setIsInitiator(false);
            setIsCallAccepted(false);
            setCallType('video');
        }
    }, [socket, getUserMedia]);

    const acceptCall = useCallback(async (incomingCallData: any, withVideo: boolean = true) => {
        try {
            const stream = await getUserMedia(true, true);

            if (incomingCallData.callType === 'audio' || !withVideo) {
                const videoTracks = stream.getVideoTracks();
                videoTracks.forEach(track => {
                    track.enabled = false;
                });
                setIsVideoEnabled(false);
            } else {
                setIsVideoEnabled(true);
            }

            setCallId(incomingCallData.callId);
            setRemoteUserId(incomingCallData.fromUserId);
            setIsInitiator(false);
            setIsCallActive(true);
            setIsCallAccepted(true);
            setCallType(incomingCallData.callType);

            // Initialize peer as non-initiator (receiver)
            initializePeer(false, incomingCallData.callId, incomingCallData.fromUserId, stream);

            if (socket) {
                // Send acceptance to backend
                socket.emit('call.accept', {
                    callId: incomingCallData.callId,
                    targetUserId: incomingCallData.fromUserId,
                    callType: incomingCallData.callType
                });
            }
        } catch (error) {
            declineCall(incomingCallData);
        }
    }, [socket, getUserMedia, initializePeer]);

    const declineCall = useCallback((incomingCallData: any) => {
        if (socket) {
            socket.emit('call.decline', {
                callId: incomingCallData.callId,
                targetUserId: incomingCallData.fromUserId,
                callType: incomingCallData.callType
            });

            socket.emit('call.rejected', {
                callId: incomingCallData.callId,
                fromUserId: incomingCallData.fromUserId,
                callType: incomingCallData.callType
            });
        }
    }, [socket]);

    const endCall = useCallback(() => {
        if (socket && callId && remoteUserId) {
            socket.emit('call.end', {
                callId,
                targetUserId: remoteUserId,
                callType: callType
            });
        }

        if (peerRef.current && !peerRef.current.destroyed) {
            try {
                peerRef.current.destroy();
            } catch (error) { }
            peerRef.current = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                track.stop();
            });
            localStreamRef.current = null;
        }

        if (remoteStreamRef.current) {
            remoteStreamRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().then(() => {
                audioContextRef.current = null;
            }).catch(() => { });
        }

        Object.keys(window).forEach(key => {
            if (key.startsWith('audioTrack_')) {
                const audioElement = (window as any)[key];
                if (audioElement && audioElement.pause) {
                    audioElement.pause();
                    audioElement.srcObject = null;
                    delete (window as any)[key];
                }
            }
        });

        setIsCallActive(false);
        setIsConnected(false);
        setCallId(null);
        setRemoteUserId(null);
        setIsInitiator(false);
        setIsMuted(false);
        setIsVideoEnabled(true);
        setIsCallAccepted(false);
        setCallType('video');

        onCallEnded?.();
    }, [socket, callId, remoteUserId, onCallEnded]);

    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
                return !audioTrack.enabled;
            }
        }
        return false;
    }, []);

    const toggleVideo = useCallback(() => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
                return !videoTrack.enabled;
            }
        }
        return false;
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleCallIncoming = (data: any) => {
            if (data.signalType === 'call-incoming') {
                setCallId(data.callId);
                setRemoteUserId(data.fromUserId);
                setCallType(data.callType || 'video');
                onCallReceived?.(data);
            } else if (data.signalType === 'call-cancelled') {
                endCall();
            }
        };

        const handleCallResponse = (data: any) => {
            if (data.signalType === 'call-accepted' && isInitiator) {
                setIsCallAccepted(true);

                if (!peerRef.current && data.callId && localStreamRef.current) {
                    setCallId(data.callId);
                    initializePeer(true, data.callId, data.fromUserId, localStreamRef.current);
                }
            } else if (data.signalType === 'call-declined') {
                setIsCallAccepted(false);
                endCall();
            } else if (data.signalType === 'call-ended') {
                setIsCallAccepted(false);
                endCall();
            } else if (data.signalType === 'call-unavailable') {
                setIsCallAccepted(false);
                endCall();
            }
        };

        const handleCallAccepted = (data: any) => {
            setIsCallAccepted(true);
        };

        const handleWebRTCSignal = (data: any) => {
            if (callId && data.callId !== callId) {
                return;
            }

            if (!callId && data.callId) {
                setCallId(data.callId);
            }

            if (peerRef.current && !peerRef.current.destroyed) {
                try {
                    if (data.signalType === 'offer' || data.signalType === 'answer') {
                        if (!data.sdp) {
                            return;
                        }
                        const signalData = {
                            type: data.signalType,
                            sdp: data.sdp
                        };
                        peerRef.current.signal(signalData as any);
                    } else if (data.signalType === 'ice-candidate') {
                        if (!data.candidate) {
                            return;
                        }

                        let candidateObj = data.candidate;
                        if (typeof data.candidate === 'string') {
                            try {
                                candidateObj = JSON.parse(data.candidate);
                            } catch (error) {
                                return;
                            }
                        }

                        const candidateData = {
                            candidate: candidateObj,
                            sdpMid: data.sdpMid,
                            sdpMLineIndex: data.sdpMLineIndex
                        };
                        peerRef.current.signal(candidateData as any);
                    }
                } catch (error) { }
            }
        };

        socket.on('call.incoming', handleCallIncoming);
        socket.on('call.response', handleCallResponse);
        socket.on('call.accepted', handleCallAccepted);
        socket.on('webrtc.signal', handleWebRTCSignal);

        return () => {
            socket.off('call.incoming', handleCallIncoming);
            socket.off('call.response', handleCallResponse);
            socket.off('call.accepted', handleCallAccepted);
            socket.off('webrtc.signal', handleWebRTCSignal);
        };
    }, [socket, onCallReceived, endCall]);

    useEffect(() => {
        return () => {
            if (isCallActive) {
                endCall();
            }
        };
    }, []);

    return {
        // States
        isCallActive,
        isConnected,
        isCallAccepted,
        callId,
        isMuted,
        isVideoEnabled,
        callType,

        // Streams
        localStream: localStreamRef.current,
        remoteStream: remoteStreamRef.current,

        // Actions
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMute,
        toggleVideo
    };
};