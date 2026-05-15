import React, { useState, useEffect } from 'react';
import { 
    XIcon, 
    FolderIcon, 
    ChevronRightIcon, 
    ChevronLeftIcon,
    ArrowRightIcon,
    HomeIcon
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const MoveModal = ({ isOpen, onClose, onMove, item, type }) => {
    const { activeSpace } = useAuth();
    const [currentPath, setCurrentPath] = useState([]);
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedFolderId, setSelectedFolderId] = useState('root');

    useEffect(() => {
        if (isOpen) {
            fetchFolders('root');
            setCurrentPath([]);
            setSelectedFolderId('root');
        }
    }, [isOpen, activeSpace]);

    const fetchFolders = async (parentId) => {
        setLoading(true);
        try {
            const res = await api.get(`/folders/parent/${parentId}?space=${activeSpace}`);
            // Filter out the folder being moved (if it's a folder) to prevent moving into itself
            const filteredFolders = res.data.filter(f => f._id !== item?._id);
            setFolders(filteredFolders);
        } catch (error) {
            console.error('Error fetching folders for move:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFolderClick = (folder) => {
        setSelectedFolderId(folder._id);
        setCurrentPath([...currentPath, folder]);
        fetchFolders(folder._id);
    };

    const handleBackClick = () => {
        const newPath = [...currentPath];
        newPath.pop();
        setCurrentPath(newPath);
        const parentId = newPath.length > 0 ? newPath[newPath.length - 1]._id : 'root';
        setSelectedFolderId(parentId);
        fetchFolders(parentId);
    };

    const handleMove = () => {
        onMove(selectedFolderId, item, type);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            Move to...
                        </h2>
                        <p className="text-xs font-bold text-slate-400 mt-0.5 truncate max-w-[200px]">
                            Moving: {item?.name}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-400 hover:text-slate-600"
                    >
                        <XIcon size={20} />
                    </button>
                </div>

                {/* Path / Breadcrumbs */}
                <div className="px-6 py-3 bg-white border-b flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <button 
                        onClick={() => {
                            setCurrentPath([]);
                            setSelectedFolderId('root');
                            fetchFolders('root');
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${selectedFolderId === 'root' ? 'bg-primary-50 text-primary-600' : 'hover:bg-slate-50 text-slate-400'}`}
                    >
                        <HomeIcon size={16} />
                    </button>
                    
                    {currentPath.map((folder, index) => (
                        <React.Fragment key={folder._id}>
                            <ChevronRightIcon size={14} className="text-slate-300 shrink-0" />
                            <span className="text-sm font-bold text-slate-600 whitespace-nowrap">
                                {folder.name}
                            </span>
                        </React.Fragment>
                    ))}
                </div>

                {/* Folder List */}
                <div className="p-2 max-h-[300px] overflow-y-auto bg-slate-50/30">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-100 border-t-primary-600"></div>
                            <p className="text-xs font-bold text-slate-400">Loading folders...</p>
                        </div>
                    ) : folders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="p-3 bg-white rounded-2xl shadow-sm mb-3">
                                <FolderIcon size={24} className="text-slate-200" />
                            </div>
                            <p className="text-sm font-bold text-slate-400">No subfolders here</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {folders.map(folder => (
                                <button
                                    key={folder._id}
                                    onClick={() => handleFolderClick(folder)}
                                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white hover:shadow-md transition-all group border border-transparent hover:border-slate-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-50 rounded-xl text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                            <FolderIcon size={18} />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 group-hover:text-primary-600">
                                            {folder.name}
                                        </span>
                                    </div>
                                    <ChevronRightIcon size={16} className="text-slate-300 group-hover:text-primary-400 transition-colors" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50/50 border-t flex items-center justify-between gap-4">
                    <button
                        onClick={handleBackClick}
                        disabled={currentPath.length === 0}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm text-slate-500 hover:bg-white hover:shadow-md transition-all disabled:opacity-0"
                    >
                        <ChevronLeftIcon size={18} />
                        Back
                    </button>
                    
                    <button
                        onClick={handleMove}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary-200 hover:bg-primary-700 hover:-translate-y-0.5 transition-all active:translate-y-0"
                    >
                        Move Here
                        <ArrowRightIcon size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MoveModal;
