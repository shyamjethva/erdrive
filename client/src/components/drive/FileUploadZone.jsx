import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../../api/axios';
import { UploadCloudIcon, Loader2Icon } from 'lucide-react';

const FileUploadZone = ({ folderId, onUploadSuccess, children }) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const onDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;

        setUploading(true);
        if (!folderId || folderId === 'root' || folderId === 'undefined') {
            console.error('Invalid folderId for upload:', folderId);
            setUploading(false);
            return;
        }

        const formData = new FormData();
        formData.append('folderId', folderId);
        acceptedFiles.forEach(file => {
            formData.append('files', file);
            // Include path if it's a folder upload
            if (file.webkitRelativePath) {
                formData.append('paths', file.webkitRelativePath);
            } else {
                formData.append('paths', file.name);
            }
        });

        try {
            const response = await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                }
            });
            onUploadSuccess(response.data);
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
            setProgress(0);
        }
    }, [folderId, onUploadSuccess]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        noClick: true
    });

    return (
        <div {...getRootProps()} className="relative min-h-[400px]">
            <input {...getInputProps()} id="manual-upload" />
            <input
                id="folder-upload"
                type="file"
                webkitdirectory=""
                directory=""
                className="hidden"
                onChange={(e) => onDrop(Array.from(e.target.files))}
            />

            {isDragActive && (
                <div className="absolute inset-0 z-40 bg-primary-500/10 backdrop-blur-sm border-4 border-dashed border-primary-500 rounded-3xl flex flex-col items-center justify-center animate-in fade-in duration-200">
                    <UploadCloudIcon size={64} className="text-primary-600 mb-4 animate-bounce" />
                    <p className="text-2xl font-bold text-primary-700">Drop files to upload</p>
                    <p className="text-primary-600 mt-2 font-medium">Instantly add them to your folder</p>
                </div>
            )}

            {uploading && (
                <div className="fixed bottom-8 right-8 z-50 bg-white shadow-2xl rounded-2xl border p-6 w-80 animate-in slide-in-from-bottom-10 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                            <Loader2Icon size={18} className="animate-spin text-primary-600" />
                            Uploading...
                        </h4>
                        <span className="text-sm font-bold text-primary-600">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-3 font-medium">Please don't close the tab</p>
                </div>
            )}

            {children}
        </div>
    );
};

export default FileUploadZone;
