'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MessageMedia } from '@/types/auth';
import { chatApi } from '@/lib/api';

interface MessageInputProps {
    newMessage: string;
    onNewMessageChange: (message: string) => void;
    onSendMessage: (attachments?: MessageMedia[]) => void;
}

interface LocalFilePreview {
    file: File;
    previewUrl: string;
    id: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
];

export default function MessageInput({
    newMessage,
    onNewMessageChange,
    onSendMessage,
}: MessageInputProps) {
    const [localFiles, setLocalFiles] = useState<LocalFilePreview[]>([]);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Cleanup object URLs when component unmounts or files change
    useEffect(() => {
        return () => {
            localFiles.forEach(filePreview => {
                URL.revokeObjectURL(filePreview.previewUrl);
            });
        };
    }, [localFiles]);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileType: string): string => {
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('word')) return '📝';
        if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
        if (fileType.includes('zip') || fileType.includes('rar')) return '🗜️';
        if (fileType.includes('text')) return '📃';
        return '📎';
    };

    const validateFile = (file: File): { valid: boolean; error?: string } => {
        if (file.size > MAX_FILE_SIZE) {
            return { valid: false, error: 'File quá lớn. Kích thước tối đa là 10MB.' };
        }

        const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
        const isFile = ALLOWED_FILE_TYPES.includes(file.type);

        if (!isImage && !isFile) {
            return { valid: false, error: 'Định dạng file không được hỗ trợ.' };
        }

        return { valid: true };
    };

    const uploadFiles = async (files: File[]): Promise<MessageMedia[]> => {
        try {
            console.log('🚀 Uploading files:', files.map(f => f.name));

            const response = await chatApi.uploadMediaFiles(files);
            console.log('✅ Files uploaded successfully:', response);

            // Convert FileMetaDataResponse to MessageMedia
            return response.data.map((file, index) => ({
                mediaUrl: file.url,
                mediaName: file.name,
                mediaSize: file.size,
                mimeType: file.contentType,
                displayOrder: file.displayOrder || index,
                uploadedAt: new Date().toISOString()
            }));
        } catch (error) {
            console.error('❌ File upload failed:', error);
            return [];
        }
    };

    const handleFileSelect = useCallback((files: FileList | null) => {
        if (!files || files.length === 0) return;

        const validFiles: LocalFilePreview[] = [];

        // Validate all files first and create local previews
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const validation = validateFile(file);

            if (!validation.valid) {
                alert(validation.error);
                continue;
            }

            // Create local preview with object URL
            const previewUrl = URL.createObjectURL(file);
            console.log('🖼️ Created preview URL for:', file.name, 'URL:', previewUrl);
            const filePreview: LocalFilePreview = {
                file,
                previewUrl,
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            };

            validFiles.push(filePreview);
        }

        if (validFiles.length > 0) {
            // Add to local files for preview (no upload yet)
            setLocalFiles(prev => [...prev, ...validFiles]);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleFileSelect(e.dataTransfer.files);
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    const removeLocalFile = (id: string) => {
        setLocalFiles(prev => {
            const fileToRemove = prev.find(f => f.id === id);
            if (fileToRemove) {
                URL.revokeObjectURL(fileToRemove.previewUrl);
            }
            return prev.filter(f => f.id !== id);
        });
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() && localFiles.length === 0) return;

        try {
            setUploading(true);

            let messageMedia: MessageMedia[] | undefined = undefined;

            // If there are local files, upload them first
            if (localFiles.length > 0) {
                const filesToUpload = localFiles.map(fp => fp.file);
                messageMedia = await uploadFiles(filesToUpload);

                // Clean up local previews after successful upload
                localFiles.forEach(filePreview => {
                    URL.revokeObjectURL(filePreview.previewUrl);
                });
                setLocalFiles([]);
            }

            // Send message with uploaded media (if any)
            onSendMessage(messageMedia);

        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Gửi tin nhắn thất bại. Vui lòng thử lại.');
        } finally {
            setUploading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const isImageFile = (file: File) => ALLOWED_IMAGE_TYPES.includes(file.type);

    return (
        <div className="bg-white border-t border-gray-200 shadow-sm">
            {/* Local File Preview Area - Facebook Style */}
            {localFiles.length > 0 && (
                <div className="p-3 border-b border-gray-200 bg-white">
                    <div className="flex flex-wrap gap-2">
                        {localFiles.map((filePreview) => (
                            <div key={filePreview.id} className="relative">
                                {isImageFile(filePreview.file) ? (
                                    /* Facebook-style Image Preview with Visible X */
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 border border-gray-300">
                                            <img
                                                src={filePreview.previewUrl}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        {/* Always Visible X Button - Facebook Style */}
                                        <button
                                            onClick={() => removeLocalFile(filePreview.id)}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg border-2 border-white z-10"
                                            style={{ lineHeight: '1' }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ) : (
                                    /* File Preview */
                                    <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2 border">
                                        <div className="text-lg">{getFileIcon(filePreview.file.type)}</div>
                                        <div className="text-sm text-gray-700 max-w-32 truncate">{filePreview.file.name}</div>
                                        <button
                                            onClick={() => removeLocalFile(filePreview.id)}
                                            className="w-4 h-4 bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center text-xs"
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Input Area */}
            <div
                className={`p-4 transition-all duration-200 relative ${dragOver ? 'bg-blue-50 border-blue-200' : 'bg-white'
                    }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                {dragOver && (
                    <div className="absolute inset-0 bg-blue-100 bg-opacity-80 border-2 border-dashed border-blue-400 rounded-xl flex items-center justify-center z-10 m-2">
                        <div className="text-center">
                            <div className="text-4xl mb-2">📁</div>
                            <div className="text-blue-600 font-semibold">Thả file để tải lên</div>
                            <div className="text-blue-500 text-sm mt-1">Hỗ trợ ảnh và tài liệu</div>
                        </div>
                    </div>
                )}

                <div className="flex items-end space-x-3">
                    {/* Attachment Buttons */}
                    <div className="flex items-center space-x-1">
                        {/* Image Upload Button */}
                        <button
                            onClick={() => imageInputRef.current?.click()}
                            disabled={uploading}
                            className="p-2.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all duration-200 disabled:opacity-50 hover:scale-105"
                            title="Chọn ảnh"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </button>

                        {/* File Upload Button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="p-2.5 text-gray-500 hover:text-green-500 hover:bg-green-50 rounded-full transition-all duration-200 disabled:opacity-50 hover:scale-105"
                            title="Chọn file"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        </button>
                    </div>

                    {/* Message Input */}
                    <div className="flex-1">
                        <textarea
                            value={newMessage}
                            onChange={(e) => onNewMessageChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Nhập tin nhắn..."
                            rows={1}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white resize-none max-h-32 min-h-[3rem] transition-all duration-200"
                            style={{
                                height: 'auto',
                                overflowY: newMessage.split('\n').length > 3 ? 'scroll' : 'hidden'
                            }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                            }}
                        />
                    </div>

                    {/* Send Button */}
                    <button
                        onClick={handleSendMessage}
                        disabled={(!newMessage.trim() && localFiles.length === 0) || uploading}
                        className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0 hover:scale-105 disabled:hover:scale-100"
                        title="Gửi tin nhắn"
                    >
                        {uploading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Hidden File Inputs */}
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                />
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                />
            </div>
        </div>
    );
}