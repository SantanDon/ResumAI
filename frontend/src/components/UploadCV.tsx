import React, { useState } from 'react';

interface UploadCVProps {
    onFileSelect?: (file: File) => void;
    onCVParsed?: (userId: string) => void;
}

export const UploadCV: React.FC<UploadCVProps> = ({ onFileSelect, onCVParsed }) => {
    const [fileName, setFileName] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string>('');

    const handleFileUpload = async (file: File) => {
        setFileName(file.name);
        
        // If onFileSelect is provided (old behavior), use it
        if (onFileSelect) {
            onFileSelect(file);
            return;
        }

        // New behavior: upload to backend
        if (onCVParsed) {
            setIsUploading(true);
            setUploadStatus('Uploading and parsing CV...');
            
            const formData = new FormData();
            formData.append('cv', file);

            try {
                const response = await fetch('http://localhost:3001/api/cv/parse', {
                    method: 'POST',
                    body: formData,
                });
                const data = await response.json();
                
                if (data.success) {
                    setUploadStatus('✅ CV parsed successfully!');
                    setTimeout(() => {
                        onCVParsed(data.userId);
                    }, 1000);
                } else {
                    setUploadStatus(`❌ Error: ${data.error || 'Unknown error'}`);
                }
            } catch (error) {
                setUploadStatus('❌ Upload failed');
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
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    return (
        <div className="glass rounded-xl p-6 text-center">
            <label className="block text-gray-200 font-medium mb-2">Upload CV (PDF)</label>
            <div
                className="border-2 border-dashed border-gray-400 rounded-lg p-8 cursor-pointer hover:border-purple-400 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => !isUploading && document.getElementById('cv-input')?.click()}
            >
                {isUploading ? (
                    <div>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                        <p className="text-white">{uploadStatus}</p>
                    </div>
                ) : fileName ? (
                    <div>
                        <p className="text-white mb-2">Selected: <span className="font-medium">{fileName}</span></p>
                        {uploadStatus && <p className="text-sm text-green-300">{uploadStatus}</p>}
                    </div>
                ) : (
                    <p className="text-gray-400">Drag & drop a PDF here, or click to select</p>
                )}
                <input
                    type="file"
                    accept="application/pdf"
                    id="cv-input"
                    className="hidden"
                    onChange={handleChange}
                    disabled={isUploading}
                />
            </div>
        </div>
    );
};
