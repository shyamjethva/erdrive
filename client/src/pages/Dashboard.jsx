import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import FolderCard from '../components/drive/FolderCard';
import FileCard from '../components/drive/FileCard';
import Breadcrumbs from '../components/drive/Breadcrumbs';
import CreateFolderModal from '../components/drive/CreateFolderModal';
import FileUploadZone from '../components/drive/FileUploadZone';
import FolderPasswordModal from '../components/drive/FolderPasswordModal';
import {
    PlusIcon,
    GridIcon,
    ListIcon,
    UploadIcon,
    FolderPlusIcon,
    FileUpIcon,
    FolderUpIcon,
    FileTextIcon,
    TableIcon,
    PresentationIcon,
    VideoIcon,
    FormInputIcon
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import ContextMenu from '../components/drive/ContextMenu';
import FilePreviewModal from '../components/drive/FilePreviewModal';
import ShareModal from '../components/drive/ShareModal';
import ColorPickerModal from '../components/drive/ColorPickerModal';

const Dashboard = () => {
    const { user } = useAuth();
    const { searchQuery } = useOutletContext();
    const { showToast } = useToast();
    const [currentFolderId, setCurrentFolderId] = useState('root');
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);
    const [path, setPath] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [contextMenu, setContextMenu] = useState(null);
    const [recentFiles, setRecentFiles] = useState([]);
    const [previewFile, setPreviewFile] = useState(null);
    const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [sharingItem, setSharingItem] = useState(null);
    const [colorPickerItem, setColorPickerItem] = useState(null);
    const [lockingFolder, setLockingFolder] = useState(null);
    const [unlockingFolder, setUnlockingFolder] = useState(null);
    const [removingLockFolder, setRemovingLockFolder] = useState(null);
    const [unlockedFolders, setUnlockedFolders] = useState(new Set());

    const fetchData = async (folderId) => {
        setLoading(true);
        try {
            const foldersRes = await api.get(`/folders/parent/${folderId}`);
            const filesRes = await api.get(`/files/folder/${folderId}`);

            setFolders(foldersRes.data);
            setFiles(filesRes.data);

            // Fetch recent files only on root
            if (folderId === 'root') {
                const recentRes = await api.get('/files/recent');
                setRecentFiles(recentRes.data);
            }

            // Fetch folder breadcrumbs/trail
            if (folderId === 'root') {
                setPath([]);
            } else {
                const trailRes = await api.get(`/folders/${folderId}/trail`);
                setPath(trailRes.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData(currentFolderId);
    }, [currentFolderId, user]);

    const handleNavigate = (folderOrId) => {
        const id = typeof folderOrId === 'string' ? folderOrId : folderOrId?._id;
        const folder = typeof folderOrId === 'object' ? folderOrId : folders.find(f => f._id === id);

        if (id) {
            // Check if folder is locked and not yet unlocked in this session
            if (folder?.isLocked && !unlockedFolders.has(id)) {
                setUnlockingFolder(folder);
                return;
            }
            setCurrentFolderId(id);
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
            setCurrentFolderId(unlockingFolder._id);
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
        if (action === 'delete') {
            if (confirm(`Move ${item.name} to trash?`)) {
                try {
                    const endpoint = type === 'folder' ? `/folders/${item._id}/trash` : `/files/${item._id}/trash`;
                    await api.patch(endpoint);
                    if (type === 'folder') {
                        setFolders(folders.filter(f => f._id !== item._id));
                    } else {
                        setFiles(files.filter(f => f._id !== item._id));
                        setRecentFiles(recentFiles.filter(rf => rf._id !== item._id));
                    }
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
                    if (type === 'folder') {
                        setFolders(folders.map(f => f._id === item._id ? res.data : f));
                    } else {
                        setFiles(files.map(f => f._id === item._id ? res.data : f));
                        setRecentFiles(recentFiles.map(f => f._id === item._id ? res.data : f));
                    }
                } catch (err) {
                    console.error('Rename error:', err);
                    alert('Failed to rename item.');
                }
            }
        } else if (action === 'download') {
            try {
                const token = localStorage.getItem('token');
                const response = await api.get(`/files/download/${item._id}?token=${token}`, {
                    responseType: 'blob'
                });

                // Check if the blob is actually a JSON error (happens if auth fails but responseType is blob)
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
        } else if (action === 'change_color') {
            setColorPickerItem(item);
        } else if (action === 'star') {
            try {
                const endpoint = type === 'folder' ? `/folders/${item._id}/star` : `/files/${item._id}/star`;
                const res = await api.patch(endpoint);
                if (type === 'folder') {
                    setFolders(folders.map(f => f._id === item._id ? res.data : f));
                } else {
                    setFiles(files.map(f => f._id === item._id ? res.data : f));
                    if (recentFiles.some(rf => rf._id === item._id)) {
                        setRecentFiles(recentFiles.map(rf => rf._id === item._id ? res.data : rf));
                    }
                }
            } catch (err) {
                console.error('Star error:', err);
            }
        } else if (action === 'pin') {
            try {
                const endpoint = type === 'folder' ? `/folders/${item._id}/pin` : `/files/${item._id}/pin`;
                const res = await api.patch(endpoint);
                if (type === 'folder') {
                    setFolders(prev => {
                        const updated = prev.map(f => f._id === item._id ? res.data : f);
                        return updated.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.updatedAt) - new Date(a.updatedAt));
                    });
                } else {
                    setFiles(prev => {
                        const updated = prev.map(f => f._id === item._id ? res.data : f);
                        return updated.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.updatedAt) - new Date(a.updatedAt));
                    });
                }
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

    const handleFolderCreated = (newFolder) => {
        setFolders([...folders, newFolder]);
    };

    const handleUploadSuccess = () => {
        fetchData(currentFolderId);
    };

    const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="space-y-6" onClick={() => { setContextMenu(null); setIsNewMenuOpen(false); }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">My Drive</h1>

                <div className="flex items-center gap-2">
                    {/* New Button with Dropdown */}
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsNewMenuOpen(!isNewMenuOpen); }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white text-slate-800 border-2 border-slate-200 rounded-2xl font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-[0.98]"
                        >
                            <PlusIcon size={20} className="text-primary-600" />
                            <span>New</span>
                        </button>

                        {isNewMenuOpen && (
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in duration-150 origin-top-right"
                            >
                                <button
                                    onClick={() => { setIsCreateModalOpen(true); setIsNewMenuOpen(false); }}
                                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-slate-700 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <FolderPlusIcon size={18} className="text-slate-500" />
                                        <span className="font-medium">New folder</span>
                                    </div>
                                    <span className="text-[11px] text-slate-400 font-medium">Alt+C then F</span>
                                </button>
                                <div className="h-[1px] bg-slate-100 my-1" />
                                <button
                                    onClick={() => { document.getElementById('manual-upload')?.click(); setIsNewMenuOpen(false); }}
                                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-slate-700 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <FileUpIcon size={18} className="text-slate-500" />
                                        <span className="font-medium">File upload</span>
                                    </div>
                                    <span className="text-[11px] text-slate-400 font-medium">Alt+C then U</span>
                                </button>
                                <button
                                    onClick={() => { document.getElementById('folder-upload')?.click(); setIsNewMenuOpen(false); }}
                                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-slate-700 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <FolderUpIcon size={18} className="text-slate-500" />
                                        <span className="font-medium">Folder upload</span>
                                    </div>
                                    <span className="text-[11px] text-slate-400 font-medium">Alt+C then I</span>
                                </button>
                                <div className="h-[1px] bg-slate-100 my-1" />
                                <a
                                    href="https://docs.google.com/document/create"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-slate-700 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <FileTextIcon size={18} className="text-blue-500" />
                                        <span className="font-medium">Google Docs</span>
                                    </div>
                                    <PlusIcon size={14} className="text-slate-400 opacity-0 group-hover:opacity-100" />
                                </a>
                                <a
                                    href="https://docs.google.com/spreadsheets/create"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-slate-700 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <TableIcon size={18} className="text-green-600" />
                                        <span className="font-medium">Google Sheets</span>
                                    </div>
                                    <PlusIcon size={14} className="text-slate-400 opacity-0 group-hover:opacity-100" />
                                </a>
                                <a
                                    href="https://docs.google.com/presentation/create"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-slate-700 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <PresentationIcon size={18} className="text-amber-500" />
                                        <span className="font-medium">Google Slides</span>
                                    </div>
                                    <PlusIcon size={14} className="text-slate-400 opacity-0 group-hover:opacity-100" />
                                </a>
                                <a
                                    href="https://vids.new"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-slate-700 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <VideoIcon size={18} className="text-purple-500" />
                                        <span className="font-medium">Google Vids</span>
                                    </div>
                                </a>
                                <a
                                    href="https://docs.google.com/forms/create"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-slate-700 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <FormInputIcon size={18} className="text-purple-700" />
                                        <span className="font-medium">Google Forms</span>
                                    </div>
                                    <PlusIcon size={14} className="text-slate-400 opacity-0 group-hover:opacity-100" />
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <GridIcon size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <ListIcon size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <Breadcrumbs path={path} onNavigate={handleNavigate} />

            <FileUploadZone
                folderId={currentFolderId === 'root' ? user.rootFolderId : currentFolderId}
                onUploadSuccess={handleUploadSuccess}
            >
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {currentFolderId === 'root' && recentFiles.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                    Quick Access
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {recentFiles.map(file => (
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

                        <div className="space-y-4">
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Folders</h2>
                            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" : "bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm flex flex-col"}>
                                {filteredFolders.map(folder => (
                                    <FolderCard
                                        key={folder._id}
                                        folder={folder}
                                        onClick={handleNavigate}
                                        onContextMenu={handleContextMenu}
                                        viewMode={viewMode}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Files</h2>
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {filteredFiles.map(file => (
                                        <FileCard
                                            key={file._id}
                                            file={file}
                                            onContextMenu={handleContextMenu}
                                            onClick={() => setPreviewFile(file)}
                                            viewMode={viewMode}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm flex flex-col">
                                    {/* List View Header */}
                                    <div className="flex items-center p-3 gap-4 border-b border-slate-100 bg-slate-50/50">
                                        <div className="w-10 shrink-0" /> {/* Icon column spacer */}
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</span>
                                        </div>
                                        <div className="w-48 hidden md:block shrink-0">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Owner</span>
                                        </div>
                                        <div className="w-40 hidden lg:block shrink-0">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Modified</span>
                                        </div>
                                        <div className="w-24 hidden sm:block shrink-0 text-right">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">File Size</span>
                                        </div>
                                        <div className="w-10 shrink-0" /> {/* Actions column spacer */}
                                    </div>
                                    <div className="flex flex-col">
                                        {filteredFiles.map(file => (
                                            <FileCard
                                                key={file._id}
                                                file={file}
                                                onContextMenu={handleContextMenu}
                                                onClick={() => setPreviewFile(file)}
                                                viewMode="list"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </FileUploadZone>

            <CreateFolderModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                parentId={currentFolderId === 'root' ? user.rootFolderId : currentFolderId}
                onFolderCreated={handleFolderCreated}
            />

            {contextMenu && (
                <ContextMenu
                    {...contextMenu}
                    onClose={() => setContextMenu(null)}
                    onAction={handleAction}
                />
            )}

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

export default Dashboard;
