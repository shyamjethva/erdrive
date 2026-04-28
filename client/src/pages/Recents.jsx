import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import FileCard from '../components/drive/FileCard';
import { ClockIcon, SearchIcon } from 'lucide-react';
import ContextMenu from '../components/drive/ContextMenu';
import FilePreviewModal from '../components/drive/FilePreviewModal';
import ShareModal from '../components/drive/ShareModal';
import { useOutletContext } from 'react-router-dom';

const Recents = () => {
    const { searchQuery } = useOutletContext();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [recentFiles, setRecentFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [contextMenu, setContextMenu] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [sharingItem, setSharingItem] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/files/recent');
            // Backend /files/recent returns 10 files
            setRecentFiles(res.data);
        } catch (error) {
            console.error('Error fetching recent files:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const handleContextMenu = (e, item, type) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            item,
            type
        });
    };

    const handleAction = async (action, item, type) => {
        if (action === 'download') {
            try {
                const token = localStorage.getItem('token');
                const response = await api.get(`/files/download/${item._id}?token=${token}`, {
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
        } else if (action === 'share') {
            setSharingItem({ ...item, type });
            setIsShareModalOpen(true);
        } else if (action === 'star') {
            try {
                const endpoint = type === 'folder' ? `/folders/${item._id}/star` : `/files/${item._id}/star`;
                const res = await api.patch(endpoint);
                setRecentFiles(recentFiles.map(f => f._id === item._id ? { ...f, isStarred: res.data.isStarred } : f));
            } catch (err) {
                console.error('Star error:', err);
            }
        } else if (action === 'delete') {
            if (confirm(`Move ${item.name} to trash?`)) {
                try {
                    const endpoint = type === 'folder' ? `/folders/${item._id}/trash` : `/files/${item._id}/trash`;
                    await api.patch(endpoint);
                    setRecentFiles(recentFiles.filter(f => f._id !== item._id));
                } catch (err) {
                    console.error(err);
                }
            }
        } else if (action === 'rename') {
            const newName = prompt(`Enter new name for ${item.name}:`, item.name);
            if (newName && newName !== item.name) {
                try {
                    const endpoint = type === 'folder' ? `/folders/${item._id}/rename` : `/files/${item._id}/rename`;
                    const res = await api.patch(endpoint, { name: newName });
                    setRecentFiles(recentFiles.map(f => f._id === item._id ? { ...f, name: res.data.name } : f));
                } catch (err) {
                    console.error('Rename error:', err);
                    alert('Failed to rename item.');
                }
            }
        } else if (action === 'pin') {
            try {
                const endpoint = type === 'folder' ? `/folders/${item._id}/pin` : `/files/${item._id}/pin`;
                const res = await api.patch(endpoint);
                setRecentFiles(recentFiles.map(f => f._id === item._id ? { ...f, isPinned: res.data.isPinned } : f));
                showToast(res.data.isPinned ? 'Item pinned to top' : 'Item unpinned', 'success');
            } catch (err) {
                console.error('Pin error:', err);
                showToast('Failed to update pin status', 'error');
            }
        }
    };

    const filteredFiles = recentFiles.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="space-y-8" onClick={() => setContextMenu(null)}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-2xl border border-blue-100">
                            <ClockIcon className="text-blue-500" size={28} />
                        </div>
                        Recents
                    </h1>
                    <p className="text-slate-500 font-bold mt-1 ml-14">Files you've worked on recently</p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-primary-600"></div>
                </div>
            ) : filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[3rem] text-center">
                    <ClockIcon size={40} className="text-slate-200 mb-4" />
                    <h3 className="text-xl font-black text-slate-800">No recent files</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredFiles.map(file => (
                        <FileCard
                            key={file._id}
                            file={file}
                            onContextMenu={handleContextMenu}
                            onClick={() => setPreviewFile(file)}
                        />
                    ))}
                </div>
            )}

            <ContextMenu
                {...contextMenu}
                onClose={() => setContextMenu(null)}
                onAction={handleAction}
            />

            {previewFile && (
                <FilePreviewModal
                    file={previewFile}
                    isOpen={!!previewFile}
                    onClose={() => setPreviewFile(null)}
                    onDownload={() => handleAction('download', previewFile, 'file')}
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
                    type={sharingItem.type}
                />
            )}
        </div>
    );
};

export default Recents;
