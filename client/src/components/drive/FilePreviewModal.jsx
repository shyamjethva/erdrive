import React from 'react';
import { XIcon, DownloadIcon, FileIcon } from 'lucide-react';
import api from '../../api/axios';

const FilePreviewModal = ({ file, onClose }) => {
    if (!file) return null;

    const apiBase = api.defaults.baseURL.replace('/api', '');
    const token = localStorage.getItem('token');

    const isImage = file.mimetype.startsWith('image/');
    const isPDF = file.mimetype.includes('pdf');

    // Construct storage URL via backend proxy
    const fileStorageUrl = `${apiBase}${file.previewUrl}?token=${token}`;

    const downloadUrl = `${apiBase}/api/files/download/${file._id}?token=${token}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 lg:p-10">
            <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in fade-in duration-300">
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                            <FileIcon size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 truncate max-w-md">{file.name}</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{file.mimetype}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={downloadUrl}
                            className="p-3 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
                        >
                            <DownloadIcon size={22} />
                        </a>
                        <button onClick={onClose} className="p-3 text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all">
                            <XIcon size={22} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-slate-50 flex items-center justify-center p-8">
                    {isImage ? (
                        <img
                            src={fileStorageUrl}
                            alt={file.name}
                            className="max-width-full max-h-full object-contain rounded-xl shadow-lg border"
                        />
                    ) : isPDF ? (
                        <iframe
                            src={fileStorageUrl}
                            className="w-full h-full rounded-xl border shadow-sm"
                            title={file.name}
                        />
                    ) : (
                        <div className="text-center">
                            <div className="w-24 h-24 bg-slate-200 rounded-3xl flex items-center justify-center text-slate-400 mx-auto mb-6">
                                <FileIcon size={48} />
                            </div>
                            <h4 className="text-2xl font-black text-slate-800">No Preview Available</h4>
                            <p className="text-slate-500 mt-2 font-medium">Download the file to view its content.</p>
                            <a
                                href={downloadUrl}
                                className="inline-block mt-8 px-8 py-3 bg-primary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all"
                            >
                                Download File
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilePreviewModal;
