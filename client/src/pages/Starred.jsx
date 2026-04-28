import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import FolderCard from '../components/drive/FolderCard';
import FileCard from '../components/drive/FileCard';
import { StarIcon, SearchIcon, FilterIcon } from 'lucide-react';
import ContextMenu from '../components/drive/ContextMenu';
import FilePreviewModal from '../components/drive/FilePreviewModal';
import ShareModal from '../components/drive/ShareModal';
import ColorPickerModal from '../components/drive/ColorPickerModal';
import FolderPasswordModal from '../components/drive/FolderPasswordModal';

const Starred = () => {
    const { user, activeSpace } = useAuth();
    const navigate = useNavigate();
    const { searchQuery } = useOutletContext();
    const { showToast } = useToast();
    const [starredFolders, setStarredFolders] = useState([]);
    const [starredFiles, setStarredFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [contextMenu, setContextMenu] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [sharingItem, setSharingItem] = useState(null);
    const [colorPickerItem, setColorPickerItem] = useState(null);
    const [lockingFolder, setLockingFolder] = useState(null);
    const [unlockingFolder, setUnlockingFolder] = useState(null);
    const [removingLockFolder, setRemovingLockFolder] = useState(null);
    const [unlockedFolders, setUnlockedFolders] = useState(new Set());

    const fetchData = async () => {
        setLoading(true);
        try {
            const [foldersRes, filesRes] = await Promise.all([
                api.get(`/folders/starred/all?space=${activeSpace}`),
                api.get(`/files/starred/all?space=${activeSpace}`)
            ]);
            setStarredFolders(foldersRes.data);
            setStarredFiles(filesRes.data);
        } catch (error) {
            console.error('Error fetching starred items:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user, activeSpace]);

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
        if (action === 'star') {
            try {
                const endpoint = type === 'folder' ? `/folders/${item._id}/star?space=${activeSpace}` : `/files/${item._id}/star?space=${activeSpace}`;
                await api.patch(endpoint);
                // Remove from local state since it's no longer starred
                if (type === 'folder') {
                    setStarredFolders(starredFolders.filter(f => f._id !== item._id));
                } else {
                    setStarredFiles(starredFiles.filter(f => f._id !== item._id));
                }
            } catch (err) {
                console.error('Unstar error:', err);
            }
        } else if (action === 'delete') {
            if (confirm(`Move ${item.name} to trash?`)) {
                try {
                    const endpoint = type === 'folder' ? `/folders/${item._id}/trash?space=${activeSpace}` : `/files/${item._id}/trash?space=${activeSpace}`;
                    await api.patch(endpoint);
                    if (type === 'folder') {
                        setStarredFolders(starredFolders.filter(f => f._id !== item._id));
                    } else {
                        setStarredFiles(starredFiles.filter(f => f._id !== item._id));
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        } else if (action === 'rename') {
            const newName = prompt(`Enter new name for ${item.name}:`, item.name);
            if (newName && newName !== item.name) {
                try {
                    const endpoint = type === 'folder' ? `/folders/${item._id}/rename?space=${activeSpace}` : `/files/${item._id}/rename?space=${activeSpace}`;
                    const res = await api.patch(endpoint, { name: newName });
                    if (type === 'folder') {
                        setStarredFolders(starredFolders.map(f => f._id === item._id ? res.data : f));
                    } else {
                        setStarredFiles(starredFiles.map(f => f._id === item._id ? res.data : f));
                    }
                } catch (err) {
                    console.error('Rename error:', err);
                    alert('Failed to rename item.');
                }
            }
        } else if (action === 'download') {
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
        } else if (action === 'share') {
            setSharingItem({ ...item, type });
            setIsShareModalOpen(true);
        } else if (action === 'pin') {
            console.log('Pin Action Debug:', { item, type, id: item._id });
            try {
                const endpoint = type === 'folder' ? `/folders/${item._id}/pin` : `/files/${item._id}/pin`;
                console.log('Request Endpoint:', endpoint);
                const res = await api.patch(endpoint);
                console.log('Response:', res.data);
                if (type === 'folder') {
                    setStarredFolders(starredFolders.map(f => f._id === item._id ? res.data : f));
                } else {
                    setStarredFiles(starredFiles.map(f => f._id === item._id ? res.data : f));
                }
                showToast(res.data.isPinned ? 'Item pinned to top' : 'Item unpinned', 'success');
            } catch (err) {
                console.error('Pin error:', err);
                showToast('Failed to update pin status', 'error');
            }
        } else if (action === 'change_color') {
            setColorPickerItem(item);
        } else if (action === 'lock') {
            setLockingFolder(item);
        } else if (action === 'remove_lock') {
            setRemovingLockFolder(item);
        }
    };

    const handleLockSubmit = async (password) => {
        if (!lockingFolder) return;
        try {
            const res = await api.post(`/folders/${lockingFolder._id}/lock`, { password });
            setStarredFolders(starredFolders.map(f => f._id === lockingFolder._id ? res.data.folder : f));
            showToast('Folder locked successfully', 'success');
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const handleUnlockSubmit = async (password) => {
        if (!unlockingFolder) return;
        try {
            await api.post(`/folders/${unlockingFolder._id}/unlock`, { password });
            setUnlockedFolders(prev => new Set([...prev, unlockingFolder._id]));
            navigate(`/?folder=${unlockingFolder._id}`);
            showToast('Access granted', 'success');
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const handleRemoveLockSubmit = async (password) => {
        if (!removingLockFolder) return;
        try {
            const res = await api.post(`/folders/${removingLockFolder._id}/remove-lock`, { password });
            setStarredFolders(starredFolders.map(f => f._id === removingLockFolder._id ? res.data.folder : f));
            setUnlockedFolders(prev => {
                const updated = new Set(prev);
                updated.delete(removingLockFolder._id);
                return updated;
            });
            showToast('Lock removed successfully', 'success');
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const handleFolderClick = (folder) => {
        if (folder.isLocked && !unlockedFolders.has(folder._id)) {
            setUnlockingFolder(folder);
            return;
        }
        navigate(`/?folder=${folder._id}`);
    };

    const handleColorSelect = async (color) => {
        if (!colorPickerItem) return;
        try {
            const res = await api.patch(`/folders/${colorPickerItem._id}/color`, { color });
            setStarredFolders(starredFolders.map(f => f._id === colorPickerItem._id ? res.data : f));
            setColorPickerItem(null);
        } catch (err) {
            console.error('Color update error:', err);
            alert('Failed to update folder color.');
        }
    };

    const filteredFolders = starredFolders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredFiles = starredFiles.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="space-y-8" onClick={() => setContextMenu(null)}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-2xl border border-amber-100">
                            <StarIcon className="text-amber-500 fill-amber-500" size={28} />
                        </div>
                        Starred
                    </h1>
                    <p className="text-slate-500 font-bold mt-1 ml-14">Your favorite files and folders for quick access</p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-96 gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-primary-600"></div>
                    <p className="text-slate-400 font-bold animate-pulse">Loading favorites...</p>
                </div>
            ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[3rem] p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 relative">
                        <StarIcon size={40} className="text-slate-200" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full animate-ping" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800">No starred items yet</h3>
                    <p className="text-slate-400 font-bold mt-2 max-w-sm">
                        Items you star will appear here for easy access. Right-click any file or folder to star it.
                    </p>
                </div>
            ) : (
                <div className="space-y-10">
                    {filteredFolders.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="w-8 h-[2px] bg-slate-100" />
                                Folders ({filteredFolders.length})
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {filteredFolders.map(folder => (
                                    <FolderCard
                                        key={folder._id}
                                        folder={folder}
                                        onClick={() => handleFolderClick(folder)}
                                        onContextMenu={handleContextMenu}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {filteredFiles.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="w-8 h-[2px] bg-slate-100" />
                                Files ({filteredFiles.length})
                            </h2>
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
                        </div>
                    )}
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
            <ColorPickerModal
                isOpen={!!colorPickerItem}
                onClose={() => setColorPickerItem(null)}
                onSelect={handleColorSelect}
                currentColor={colorPickerItem?.color}
            />

            <FolderPasswordModal
                isOpen={!!lockingFolder}
                onClose={() => setLockingFolder(null)}
                onSubmit={handleLockSubmit}
                folder={lockingFolder}
                mode="lock"
            />

            <FolderPasswordModal
                isOpen={!!unlockingFolder}
                onClose={() => setUnlockingFolder(null)}
                onSubmit={handleUnlockSubmit}
                folder={unlockingFolder}
                mode="unlock"
            />

            <FolderPasswordModal
                isOpen={!!removingLockFolder}
                onClose={() => setRemovingLockFolder(null)}
                onSubmit={handleRemoveLockSubmit}
                folder={removingLockFolder}
                mode="unlock"
            />
        </div>
    );
};

export default Starred;
