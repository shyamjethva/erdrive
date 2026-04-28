import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Trash2Icon, RefreshCcwIcon } from 'lucide-react';
import FolderCard from '../components/drive/FolderCard';
import FileCard from '../components/drive/FileCard';
import ContextMenu from '../components/drive/ContextMenu';

const Trash = () => {
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [contextMenu, setContextMenu] = useState(null);

    const fetchTrash = async () => {
        setLoading(true);
        try {
            const [foldersRes, filesRes] = await Promise.all([
                api.get('/folders/trash'),
                api.get('/files/trash')
            ]);
            setFolders(foldersRes.data);
            setFiles(filesRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrash();
    }, []);

    const handleContextMenu = (e, item, type) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            item,
            type,
            isTrashNode: true
        });
    };

    const handleAction = async (action, item, type) => {
        try {
            if (action === 'restore') {
                const endpoint = type === 'folder' ? `/folders/${item._id}/restore` : `/files/${item._id}/restore`;
                await api.patch(endpoint);
                if (type === 'folder') setFolders(folders.filter(f => f._id !== item._id));
                else setFiles(files.filter(f => f._id !== item._id));
            } else if (action === 'delete_permanently') {
                if (confirm(`Are you sure you want to permanently delete ${item.name}? This cannot be undone.`)) {
                    const endpoint = type === 'folder' ? `/folders/${item._id}` : `/files/${item._id}`;
                    await api.delete(endpoint);
                    if (type === 'folder') setFolders(folders.filter(f => f._id !== item._id));
                    else setFiles(files.filter(f => f._id !== item._id));
                }
            } else {
                alert('To view or share, please restore the item first.');
            }
        } catch (err) {
            console.error('Action failed:', err);
            alert('Operation failed. Please try again.');
        } finally {
            setContextMenu(null);
        }
    };

    const handleEmptyTrash = async () => {
        if (confirm('Are you sure you want to permanently delete all items in the trash?')) {
            try {
                setLoading(true);
                await Promise.all([
                    api.post('/folders/empty-trash'),
                    api.post('/files/empty-trash')
                ]);
                setFolders([]);
                setFiles([]);
            } catch (err) {
                console.error('Empty trash failed:', err);
                alert('Failed to empty trash.');
            } finally {
                setLoading(false);
            }
        }
    };

    const hasItems = folders.length > 0 || files.length > 0;

    return (
        <div className="space-y-6" onClick={() => setContextMenu(null)}>
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Trash</h1>
                <div className="flex gap-2">
                    <button onClick={fetchTrash} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all">
                        <RefreshCcwIcon size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={handleEmptyTrash}
                        className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors bg-white px-4 py-2 border border-red-200 hover:border-red-300 rounded-xl shadow-sm hover:shadow active:scale-95 disabled:opacity-50"
                        disabled={!hasItems || loading}
                    >
                        Empty Trash
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : hasItems ? (
                <div className="space-y-10 min-h-[400px]">
                    {folders.length > 0 && (
                        <section>
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Folders</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                {folders.map(folder => (
                                    <FolderCard
                                        key={folder._id}
                                        folder={folder}
                                        onClick={() => { }} // Disabled in trash
                                        onContextMenu={handleContextMenu}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {files.length > 0 && (
                        <section>
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Files</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {files.map(file => (
                                    <FileCard
                                        key={file._id}
                                        file={file}
                                        onContextMenu={handleContextMenu}
                                        onClick={() => { }} // Disabled in trash
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] border shadow-xl overflow-hidden min-h-[400px] flex flex-col items-center justify-center p-10">
                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mb-6 border-2 border-dashed">
                        <Trash2Icon size={40} />
                    </div>
                    <p className="text-xl font-bold text-slate-400">Trash is empty</p>
                    <p className="text-slate-400 mt-2 text-center max-w-xs">Items moved to trash will appear here for 30 days before being permanently deleted.</p>
                </div>
            )}

            {contextMenu && contextMenu.isTrashNode && (
                <div
                    className="fixed z-[100] bg-white w-48 shadow-2xl rounded-2xl border p-2 animate-in fade-in zoom-in duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => handleAction('restore', contextMenu.item, contextMenu.type)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-all text-sm font-bold text-blue-600"
                    >
                        <RefreshCcwIcon size={16} />
                        Restore
                    </button>
                    <button
                        onClick={() => handleAction('delete_permanently', contextMenu.item, contextMenu.type)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-all text-sm font-bold text-red-600 mt-1"
                    >
                        <Trash2Icon size={16} />
                        Delete Permanently
                    </button>
                </div>
            )}
        </div>
    );
};

export default Trash;
