'use client';

import { ChatMessageResponse, MessageMedia } from '@/types/auth';
import { useState, useEffect } from 'react';

interface MessageItemProps {
    message: ChatMessageResponse;
    isOwn: boolean;
    parseDateTime: (dateTimeString: string) => Date;
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileType: string): string => {
    if (fileType.includes('pdf')) return '📋';
    if (fileType.includes('word') || fileType.includes('document')) return '📄';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️';
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('compressed')) return '🗜️';
    if (fileType.includes('text') || fileType.includes('txt')) return '📝';
    if (fileType.includes('video')) return '🎬';
    if (fileType.includes('audio') || fileType.includes('sound')) return '🎵';
    if (fileType.includes('code') || fileType.includes('javascript') || fileType.includes('python') || fileType.includes('java')) return '💻';
    return '📎';
};

const isImage = (mimeType: string | undefined) => mimeType ? mimeType.startsWith('image/') : false;

interface ImageModalProps {
    images: MessageMedia[];
    currentIndex: number;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
}

const ImageModal = ({ images, currentIndex, onClose, onNext, onPrev }: ImageModalProps) => {
    const currentImage = images[currentIndex];
    const hasMultiple = images.length > 1;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowRight' && hasMultiple) {
                onNext();
            } else if (e.key === 'ArrowLeft' && hasMultiple) {
                onPrev();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [hasMultiple, onClose, onNext, onPrev]);

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999]"
            onClick={onClose}
        >
            <div className="relative w-full h-full flex items-center justify-center p-4">
                {/* Previous Button */}
                {hasMultiple && currentIndex > 0 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onPrev();
                        }}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black bg-opacity-60 hover:bg-opacity-80 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 z-[10000] shadow-xl border border-white border-opacity-30"
                        style={{ backdropFilter: 'blur(10px)' }}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}

                <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center">
                    <img
                        src={currentImage.mediaUrl}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                        style={{ filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.5))' }}
                    />
                </div>

                {/* Next Button */}
                {hasMultiple && currentIndex < images.length - 1 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onNext();
                        }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black bg-opacity-60 hover:bg-opacity-80 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 z-[10000] shadow-xl border border-white border-opacity-30"
                        style={{ backdropFilter: 'blur(10px)' }}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 z-[10000] shadow-lg border border-white border-opacity-20"
                    style={{ backdropFilter: 'blur(10px)' }}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Image Counter */}
                {hasMultiple && (
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full z-[10000] shadow-lg border border-white border-opacity-20"
                        style={{ backdropFilter: 'blur(10px)' }}>
                        {currentIndex + 1} / {images.length}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function MessageItem({
    message,
    isOwn,
    parseDateTime,
}: MessageItemProps) {
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [imageError, setImageError] = useState<Set<string>>(new Set());

    const handleImageError = (url: string) => {
        setImageError(prev => new Set([...prev, url]));
    };

    const downloadFile = (attachment: MessageMedia) => {
        const link = document.createElement('a');
        link.href = attachment.mediaUrl;
        link.download = attachment.mediaName || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const hasMedia = message.messageMedia && message.messageMedia.length > 0;
    const images = hasMedia && message.messageMedia ? message.messageMedia.filter(media => isImage(media.mimeType)) : [];
    const files = hasMedia && message.messageMedia ? message.messageMedia.filter(media => !isImage(media.mimeType)) : [];

    const handleImageClick = (index: number) => {
        setSelectedImageIndex(index);
    };

    const handleNextImage = () => {
        if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
            setSelectedImageIndex(selectedImageIndex + 1);
        } else if (selectedImageIndex !== null && selectedImageIndex === images.length - 1) {
            setSelectedImageIndex(0); // Loop back to first image
        }
    };

    const handlePrevImage = () => {
        if (selectedImageIndex !== null && selectedImageIndex > 0) {
            setSelectedImageIndex(selectedImageIndex - 1);
        } else if (selectedImageIndex !== null && selectedImageIndex === 0) {
            setSelectedImageIndex(images.length - 1); // Loop to last image
        }
    };

    return (
        <>
            <div className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {!isOwn && (
                    <div className="flex-shrink-0 mr-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-medium shadow-sm">
                            {message.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    </div>
                )}

                <div className={`max-w-sm lg:max-w-md group relative ${isOwn ? 'ml-16' : 'mr-16'}`}>
                    {/* Username for incoming messages - Facebook style */}
                    {!isOwn && (
                        <div className="text-xs text-gray-600 font-medium mb-1">
                            {message.username}
                        </div>
                    )}

                    {/* Timestamp for sent messages - appears on left side */}
                    {isOwn && (
                        <div className={`absolute -left-14 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-70 transition-opacity duration-200 text-xs text-gray-500 flex-shrink-0 whitespace-nowrap`}>
                            <span>
                                {parseDateTime(message.createdAt).toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                            <span className="ml-2">
                                {message.status === 'SENDING' && '⏳'}
                                {message.status === 'SENT' && '✓'}
                                {message.status === 'DELIVERED' && '✓✓'}
                                {message.status === 'READ' && <span className="text-emerald-300">✓✓</span>}
                            </span>
                        </div>
                    )}

                    {/* Timestamp for received messages - appears on right side */}
                    {!isOwn && (
                        <div className={`absolute -right-14 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-70 transition-opacity duration-200 text-xs text-gray-500 flex-shrink-0 whitespace-nowrap`}>
                            <span>
                                {parseDateTime(message.createdAt).toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    )}

                    <div
                        className={`relative shadow-sm ${isOwn
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                            } rounded-2xl overflow-hidden`}
                    >
                        {/* Images */}
                        {images.length > 0 && (
                            <div className="">
                                {images.length === 1 ? (
                                    /* Single Image */
                                    <div
                                        className="cursor-pointer"
                                        onClick={() => handleImageClick(0)}
                                    >
                                        {!imageError.has(images[0].mediaUrl) ? (
                                            <img
                                                src={images[0].mediaUrl}
                                                alt={images[0].mediaName || 'Image'}
                                                className="w-full max-w-sm rounded-2xl object-cover border border-gray-100"
                                                style={{ maxHeight: '300px', minHeight: '150px' }}
                                                onError={() => handleImageError(images[0].mediaUrl)}
                                            />
                                        ) : (
                                            <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-2xl">
                                                <div className="text-center">
                                                    <div className="text-3xl mb-1 text-gray-400">🖼️</div>
                                                    <div className="text-sm text-gray-500">Không thể tải ảnh</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Multiple Images Grid */
                                    <div className="grid gap-1">
                                        {images.length === 2 && (
                                            <div className="grid grid-cols-2 gap-1 rounded-2xl overflow-hidden">
                                                {images.map((image, index) => (
                                                    <div
                                                        key={index}
                                                        className="cursor-pointer"
                                                        onClick={() => handleImageClick(index)}
                                                    >
                                                        {!imageError.has(image.mediaUrl) ? (
                                                            <img
                                                                src={image.mediaUrl}
                                                                alt={image.mediaName || 'Image'}
                                                                className="w-full h-32 object-cover"
                                                                onError={() => handleImageError(image.mediaUrl)}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                                                                <span className="text-2xl text-gray-400">🖼️</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {images.length >= 3 && (
                                            <div className="rounded-2xl overflow-hidden">
                                                <div className="grid grid-cols-2 gap-1">
                                                    <div
                                                        className="cursor-pointer"
                                                        onClick={() => handleImageClick(0)}
                                                    >
                                                        {!imageError.has(images[0].mediaUrl) ? (
                                                            <img
                                                                src={images[0].mediaUrl}
                                                                alt={images[0].mediaName || 'Image'}
                                                                className="w-full h-40 object-cover"
                                                                onError={() => handleImageError(images[0].mediaUrl)}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                                                                <span className="text-2xl text-gray-400">🖼️</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-rows-2 gap-1">
                                                        {images.slice(1, 3).map((image, index) => (
                                                            <div
                                                                key={index + 1}
                                                                className="cursor-pointer relative"
                                                                onClick={() => handleImageClick(index + 1)}
                                                            >
                                                                {!imageError.has(image.mediaUrl) ? (
                                                                    <>
                                                                        <img
                                                                            src={image.mediaUrl}
                                                                            alt={image.mediaName || 'Image'}
                                                                            className="w-full h-20 object-cover"
                                                                            onError={() => handleImageError(image.mediaUrl)}
                                                                        />
                                                                        {index === 1 && images.length > 3 && (
                                                                            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                                                                <span className="text-white font-bold text-lg">+{images.length - 3}</span>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <div className="w-full h-20 bg-gray-200 flex items-center justify-center">
                                                                        <span className="text-lg text-gray-400">🖼️</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Files */}
                        {files.length > 0 && (
                            <div className={`${images.length > 0 ? 'border-t border-gray-200' : ''}`}>
                                {files.map((file, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 hover:bg-gray-50 hover:bg-opacity-50 transition-colors cursor-pointer ${index > 0 ? 'border-t border-gray-100' : ''}`}
                                        onClick={() => downloadFile(file)}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base ${isOwn ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {getFileIcon(file.mimeType || '')}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-gray-900'
                                                    }`}>
                                                    {file.mediaName || 'Unknown file'}
                                                </div>
                                                <div className={`text-xs flex items-center space-x-1 ${isOwn ? 'text-emerald-100' : 'text-gray-500'
                                                    }`}>
                                                    <span>{formatFileSize(file.mediaSize || 0)}</span>
                                                </div>
                                            </div>
                                            <div className={`flex-shrink-0 ${isOwn ? 'text-emerald-100' : 'text-gray-400'
                                                }`}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {message.message && (
                            <div className={`px-3 py-1.5 ${hasMedia ? 'pt-2' : 'rounded-2xl'}`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.message}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Modal */}
            {selectedImageIndex !== null && (
                <ImageModal
                    images={images}
                    currentIndex={selectedImageIndex}
                    onClose={() => setSelectedImageIndex(null)}
                    onNext={handleNextImage}
                    onPrev={handlePrevImage}
                />
            )}
        </>
    );
}