import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
    DatabaseIcon,
    FileIcon,
    SearchIcon,
    HardDriveIcon,
    AlertCircleIcon,
    FileTextIcon,
    ImageIcon,
    VideoIcon,
    ExternalLinkIcon,
    DownloadIcon,
    Share2Icon
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import FilePreviewModal from '../components/drive/FilePreviewModal';
import ShareModal from '../components/drive/ShareModal';

const Storage = () => {
    const { user, activeSpace } = useAuth();
    const { searchQuery } = useOutletContext();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [sharingItem, setSharingItem] = useState(null);

    const handleAction = async (action, item) => {
        if (action === 'download') {
            try {
                const token = localStorage.getItem('token');
                const response = await api.get(`/files/download/${item._id}?token=${token}&space=${activeSpace}`, {
                    responseType: 'blob'
                });

                if (response.data.type === 'application/json') {
                    const text = await response.data.text();
                    const error = JSON.parse(text);
                    if (error.error === 'Please authenticate.') {
                        alert('Your session has expired. Please log in again.');
                        return;
                    }
                }

                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', item.name);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } catch (err) {
                console.error('Download failed:', err);
                alert('Download failed. You may not have permission or your session expired.');
            }
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/files/storage/all?space=${activeSpace}`);
            setFiles(res.data);
        } catch (error) {
            console.error('Error fetching storage data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user, activeSpace]);

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (mimetype) => {
        if (mimetype.startsWith('image/')) return <ImageIcon size={18} className="text-blue-500" />;
        if (mimetype.startsWith('video/')) return <VideoIcon size={18} className="text-purple-500" />;
        if (mimetype.includes('pdf')) return <FileTextIcon size={18} className="text-red-500" />;
        return <FileIcon size={18} className="text-slate-400" />;
    };

    const filteredFiles = files.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const storagePercentage = user?.storageLimit > 0 ? (user?.storageUsed / user?.storageLimit * 100) : 0;
    const remainingStorage = user?.storageLimit - user?.storageUsed;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-primary-50 rounded-2xl border border-primary-100">
                            <DatabaseIcon className="text-primary-600" size={28} />
                        </div>
                        Storage
                    </h1>
                    <p className="text-slate-500 font-bold mt-1 ml-14">Detailed breakdown of your storage usage</p>
                </div>
            </div>

            {/* Storage Cards */}
            <div className="grid grid-cols-1 gap-8 mb-10">
                {/* Main Progress Card */}
                <div className="glass p-8 rounded-[2.5rem] border-2 border-white shadow-xl bg-white/60 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <HardDriveIcon size={120} className="text-primary-600" />
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-primary-600 rounded-2xl text-white shadow-lg shadow-primary-200">
                            <DatabaseIcon size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Total Usage</p>
                            <h2 className="text-4xl font-black text-slate-800">{formatBytes(user?.storageUsed)} <span className="text-lg font-bold text-slate-400">/ {formatBytes(user?.storageLimit)}</span></h2>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                            <div
                                className={`h-full transition-all duration-1000 ease-out rounded-full ${storagePercentage > 90 ? 'bg-rose-500' :
                                    storagePercentage > 70 ? 'bg-amber-500' : 'bg-primary-600'
                                    }`}
                                style={{ width: `${storagePercentage}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center text-sm font-black italic">
                            <span className={storagePercentage > 90 ? 'text-rose-600' : 'text-primary-600'}>{storagePercentage.toFixed(1)}% used</span>
                            <span className="text-slate-400">{formatBytes(remainingStorage)} free</span>
                        </div>
                    </div>

                    {storagePercentage > 90 && (
                        <div className="mt-6 flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 animate-pulse">
                            <AlertCircleIcon size={20} />
                            <p className="text-sm font-bold">You're almost out of storage! Consider deleting some files.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* List View - Redesigned to match image 2 */}
            <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white shadow-xl overflow-hidden p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h3 className="text-xl font-black text-slate-800">Files by size</h3>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-b-2 border-slate-100/50 mb-2">
                    <span className="text-sm font-bold text-slate-400">Name</span>
                    <div className="flex items-center gap-2 text-primary-600">
                        <span className="text-sm font-bold">Storage used</span>
                        <div className="p-1 bg-primary-100 rounded-md">
                            <SearchIcon size={14} className="rotate-90" />
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {loading ? (
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 animate-pulse">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
                                    <div className="h-4 bg-slate-100 rounded w-48"></div>
                                </div>
                                <div className="h-4 bg-slate-100 rounded w-16"></div>
                            </div>
                        ))
                    ) : filteredFiles.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 font-bold">
                            No files found
                        </div>
                    ) : (
                        filteredFiles.map(file => (
                            <div
                                key={file._id}
                                className="group flex items-center justify-between p-4 hover:bg-white/60 transition-all cursor-pointer rounded-2xl border border-transparent hover:border-white hover:shadow-lg hover:shadow-indigo-500/5"
                                onClick={() => setPreviewFile(file)}
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-50 group-hover:scale-110 transition-transform">
                                        {getFileIcon(file.mimetype)}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base font-bold text-slate-700 group-hover:text-indigo-600 transition-colors truncate">
                                                {file.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <span className="text-base font-black text-slate-600 tabular-nums">
                                        {formatBytes(file.size)}
                                    </span>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleAction('download', file); }}
                                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-white rounded-xl transition-all"
                                            title="Download"
                                        >
                                            <DownloadIcon size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {previewFile && (
                <FilePreviewModal
                    file={previewFile}
                    isOpen={!!previewFile}
                    onClose={() => setPreviewFile(null)}
                    onDownload={() => handleAction('download', previewFile)}
                />
            )}
            {sharingItem && (
                <ShareModal
                    isOpen={isShareModalOpen}
                    onClose={() => {
                        setIsShareModalOpen(false);
                        setSharingItem(null);
                    }}
                    item={sharingItem}
                    type="file"
                />
            )}
        </div>
    );
};

export default Storage;
