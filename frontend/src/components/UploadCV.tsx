import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './ui/Icons';

interface UploadCVProps {
    onFileSelect?: (file: File) => void;
    onCVParsed?: (userId: string) => void;
}

const uploadStates = {
    idle: 'idle',
    dragging: 'dragging',
    uploading: 'uploading',
    success: 'success',
    error: 'error'
} as const;

type UploadState = typeof uploadStates[keyof typeof uploadStates];

export const UploadCV: React.FC<UploadCVProps> = ({ onFileSelect, onCVParsed }) => {
    const [fileName, setFileName] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string>('');
    const [progress, setProgress] = useState(0);
    const [state, setState] = useState<UploadState>('idle');
    const [error, setError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (file: File) => {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            setError('Please upload a PDF file');
            setState('error');
            return;
        }

        setFileName(file.name);
        setError('');

        if (onFileSelect) {
            onFileSelect(file);
            return;
        }

        if (onCVParsed) {
            setState('uploading');
            setProgress(0);
            setUploadStatus('Reading your CV...');
            
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + Math.random() * 12;
                });
            }, 150);
            
            const formData = new FormData();
            formData.append('cv', file);

            try {
                setUploadStatus('Extracting content...');
                setProgress(25);
                
                const response = await fetch('http://localhost:3001/api/cv/parse', {
                    method: 'POST',
                    body: formData,
                });
                
                setUploadStatus('Analyzing structure...');
                setProgress(65);
                
                const data = await response.json();
                
                clearInterval(progressInterval);
                
                if (data.success) {
                    setProgress(100);
                    setState('success');
                    setUploadStatus('CV parsed successfully!');
                    setTimeout(() => {
                        onCVParsed(data.userId);
                    }, 1200);
                } else {
                    setState('error');
                    setUploadStatus(data.error || 'Parse failed');
                    setError(data.error || 'Failed to parse CV');
                }
            } catch (error) {
                clearInterval(progressInterval);
                setState('error');
                setUploadStatus('Upload failed');
                setError('Network error. Please try again.');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setState('idle');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!isUploading) {
            setState('dragging');
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!isUploading) {
            setState('idle');
        }
    };

    const resetUpload = () => {
        setState('idle');
        setFileName('');
        setProgress(0);
        setError('');
        setUploadStatus('');
    };

    const particleCount = 8;

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {state === 'uploading' || state === 'success' ? (
                    <motion.div
                        key="progress"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 border border-white/10 p-8"
                    >
                        <div className="absolute inset-0 overflow-hidden">
                            {[...Array(particleCount)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 bg-primary-400/30 rounded-full"
                                    initial={{
                                        x: Math.random() * 400,
                                        y: Math.random() * 200,
                                        scale: Math.random() * 0.5 + 0.5
                                    }}
                                    animate={{
                                        y: [null, -100],
                                        opacity: [0, 1, 0]
                                    }}
                                    transition={{
                                        duration: Math.random() * 2 + 1,
                                        repeat: 2,
                                        repeatType: "loop" as const,
                                        delay: Math.random() * 2,
                                        ease: "easeOut"
                                    }}
                                />
                            ))}
                        </div>

                        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                            <motion.div
                                className="relative"
                                animate={state === 'success' ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ duration: 0.5 }}
                            >
                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
                                    state === 'success' 
                                        ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/30' 
                                        : 'bg-gradient-to-br from-primary-500/30 to-purple-500/30'
                                }`}>
                                    {state === 'success' ? (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 200 }}
                                        >
                                            <Icons.Check className="text-green-400" size={40} />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Icons.FileText className="text-primary-400" size={36} />
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>

                            <div className="space-y-2">
                                <motion.p 
                                    className="text-lg font-medium text-white"
                                    key={uploadStatus}
                                    initial={{ opacity: 0.5 }}
                                    animate={{ opacity: 1 }}
                                >
                                    {uploadStatus}
                                </motion.p>
                                {error && (
                                    <p className="text-sm text-red-400">{error}</p>
                                )}
                            </div>

                            <div className="w-full max-w-xs space-y-2">
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-primary-500 via-purple-500 to-primary-500 rounded-full relative"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <motion.div
                                            className="absolute inset-0 bg-white/30"
                                            animate={{ x: ["-100%", "100%"] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                        />
                                    </motion.div>
                                </div>
                                <p className="text-xs text-white/50">{Math.round(progress)}% complete</p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <div
                            className={`relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-500 ${
                                state === 'dragging'
                                    ? 'bg-gradient-to-br from-primary-500/20 to-purple-500/20 border-2 border-primary-500/50'
                                    : state === 'error'
                                    ? 'bg-gradient-to-br from-red-500/10 to-orange-500/10 border-2 border-red-500/30'
                                    : 'bg-gradient-to-br from-zinc-900/60 to-zinc-800/60 border border-white/10 hover:border-white/20'
                            }`}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                            onDoubleClick={() => fileInputRef.current?.click()}
                        >
                            {state === 'dragging' && (
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-500/10 to-transparent"
                                    animate={{ x: ["-100%", "100%"] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                            )}

                            <div className="relative z-10 p-10 text-center">
                                <motion.div
                                    className="mb-6"
                                    animate={state === 'dragging' ? { scale: 1.1, rotate: 5 } : {}}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center ${
                                        state === 'error'
                                            ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20'
                                            : 'bg-gradient-to-br from-white/10 to-white/5'
                                    } border border-white/10`}>
                                        {state === 'error' ? (
                                            <Icons.X className="text-red-400" size={36} />
                                        ) : (
                                            <motion.div
                                                animate={state === 'dragging' ? { y: [0, -10, 0] } : {}}
                                                transition={{ duration: 0.5, repeat: Infinity }}
                                            >
                                                <Icons.Upload className="text-white/80" size={36} />
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>

                                <div className="space-y-3">
                                    <motion.h3 
                                        className="text-xl font-semibold text-white"
                                        animate={state === 'dragging' ? { scale: 1.05 } : {}}
                                    >
                                        {state === 'error' ? 'Something went wrong' : 'Upload your CV'}
                                    </motion.h3>
                                    
                                    <p className="text-sm text-white/60 max-w-sm mx-auto">
                                        {state === 'error' 
                                            ? error || 'Try uploading again'
                                            : 'Drag and drop your PDF resume here, or click to browse'
                                        }
                                    </p>
                                </div>

                                {state !== 'error' && (
                                    <motion.div
                                        className="mt-8 flex items-center justify-center gap-2 text-xs text-white/40"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <Icons.FileText size={14} />
                                        <span>PDF format only • Max 10MB</span>
                                    </motion.div>
                                )}

                                {state === 'error' && (
                                    <motion.button
                                        className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            resetUpload();
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Try Again
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <input
                type="file"
                accept="application/pdf"
                id="cv-input"
                ref={fileInputRef}
                className="hidden"
                onChange={handleChange}
                disabled={isUploading}
            />
        </div>
    );
};

export default UploadCV;
