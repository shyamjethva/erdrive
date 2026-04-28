import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import FolderCard from '../components/drive/FolderCard';
import FileCard from '../components/drive/FileCard';
import { RefreshCcwIcon, Share2Icon, SearchIcon } from 'lucide-react';
import ContextMenu from '../components/drive/ContextMenu';
import FilePreviewModal from '../components/drive/FilePreviewModal';
import ShareModal from '../components/drive/ShareModal';
import ColorPickerModal from '../components/drive/ColorPickerModal';
import FolderPasswordModal from '../components/drive/FolderPasswordModal';
import { useAuth } from '../context/AuthContext';

const Shared = () => {
    const { user, activeSpace } = useAuth();
    const navigate = useNavigate();
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [sharingItem, setSharingItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [colorPickerItem, setColorPickerItem] = useState(null);
    const [lockingFolder, setLockingFolder] = useState(null);
    const [unlockingFolder, setUnlockingFolder] = useState(null);
    const [removingLockFolder, setRemovingLockFolder] = useState(null);
    const [unlockedFolders, setUnlockedFolders] = useState(new Set());
    const { showToast } = useToast();

    const fetchShared = async () => {
        try {
            setLoading(true);
            const [folderRes, fileRes] = await Promise.all([
                api.get(`/folders/shared/all?space=${activeSpace}`),
                api.get(`/files/shared/all?space=${activeSpace}`)
            ]);
            setFolders(folderRes.data);
            setFiles(fileRes.data);
        } catch (err) {
            console.error('Fetch shared failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShared();
    }, [activeSpace]);

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
                const response = await api.get(`/files/download/${item._id}?token=${token}&space=${activeSpace}`, {
                    responseType: 'blob'
                });

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
                alert('Download failed.');
            }
        } else if (action === 'share') {
            setSharingItem({ ...item, type });
            setIsShareModalOpen(true);
        } else if (action === 'change_color') {
            setColorPickerItem(item);
        } else if (action === 'star') {
            try {
                const endpoint = type === 'folder' ? `/folders/${item._id}/star?space=${activeSpace}` : `/files/${item._id}/star?space=${activeSpace}`;
                await api.patch(endpoint);
                fetchShared();
            } catch (err) {
                console.error('Star error:', err);
            }
        } else if (action === 'pin') {
            try {
                const endpoint = type === 'folder' ? `/folders/${item._id}/pin?space=${activeSpace}` : `/files/${item._id}/pin?space=${activeSpace}`;
                const res = await api.patch(endpoint);
                fetchShared();
                showToast(res.data.isPinned ? 'Item pinned to top' : 'Item unpinned', 'success');
            } catch (err) {
                console.error('Pin error:', err);
                showToast('Failed to update pin status', 'error');
            }
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
            setFolders(folders.map(f => f._id === lockingFolder._id ? res.data.folder : f));
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
            setFolders(folders.map(f => f._id === removingLockFolder._id ? res.data.folder : f));
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
            setFolders(folders.map(f => f._id === colorPickerItem._id ? res.data : f));
            setColorPickerItem(null);
        } catch (err) {
            console.error('Color update error:', err);
            alert('Failed to update folder color.');
        }
    };

    const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const hasItems = filteredFolders.length > 0 || filteredFiles.length > 0;

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50" onClick={() => setContextMenu(null)}>
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Share2Icon size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Shared with Me</h1>
                            <p className="text-sm text-slate-500">Items shared by other users</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search shared items..."
                                className="bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl pl-12 pr-6 py-2.5 text-sm font-bold text-slate-700 outline-none w-full md:w-64 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={fetchShared}
                            className="p-2.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all border-2 border-transparent"
                        >
                            <RefreshCcwIcon size={22} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
                {!hasItems && !loading ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Share2Icon size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-600">No shared items</h3>
                        <p className="text-sm">Items shared with you will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-8 pb-10">
                        {/* Shared Folders */}
                        {filteredFolders.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-1">Folders</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {filteredFolders.map(folder => (
                                        <FolderCard key={folder._id} folder={folder} onContextMenu={handleContextMenu} onClick={() => handleFolderClick(folder)} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Shared Files */}
                        {filteredFiles.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-1">Files</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                                    {filteredFiles.map(file => (
                                        <FileCard key={file._id} file={file} onContextMenu={handleContextMenu} onClick={() => setPreviewFile(file)} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>

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

export default Shared;
