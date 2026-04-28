import React from 'react';
import { FileIcon, MoreVerticalIcon, FileTextIcon, ImageIcon, VideoIcon, StarIcon, PinIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const FileCard = ({ file, onContextMenu, onClick, viewMode = 'grid' }) => {
    const handleContextMenu = (e) => {
        const apiBase = api.defaults.baseURL.replace('/api', '');
        console.log('File Preview Debug:', {
            name: file.name,
            type: file.mimetype,
            previewUrl: file.previewUrl,
            fullUrl: `${apiBase}/storage${file.previewUrl.startsWith('/') ? file.previewUrl : `/${file.previewUrl}`}`
        });
        e.preventDefault();
        onContextMenu(e, file, 'file');
    };

    const handleThreeDotsClick = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const syntheticEvent = {
            clientX: rect.left,
            clientY: rect.bottom + 5,
            preventDefault: () => { }
        };
        onContextMenu(syntheticEvent, file, 'file');
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getIcon = () => {
        const type = file.mimetype;
        if (type.startsWith('image/')) return <ImageIcon size={24} />;
        if (type.startsWith('video/')) return <VideoIcon size={24} />;
        if (type.includes('pdf') || type.includes('word') || type.includes('text')) return <FileTextIcon size={24} />;
        return <FileIcon size={24} />;
    };

    const formatRelativeDate = (dateString, owner) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        // If owner name matches current user, we can append "me" like in the image
        // For now, let's just return the date string as requested
        return `${day} ${month} ${year}`;
    };

    if (viewMode === 'list') {
        const { user, activeUsername, activeAvatar } = useAuth();
        const apiBase = api.defaults.baseURL.replace('/api', '');
        const ownerName = file.ownerId?.username || 'Unknown';
        const ownerIdStr = file.ownerId?._id || file.ownerId;
        const isMe = user?._id === ownerIdStr;

        return (
            <div
                onClick={onClick}
                onContextMenu={handleContextMenu}
                className="group bg-white hover:bg-slate-50 transition-all cursor-pointer flex items-center p-3 gap-4 border-b border-slate-100 last:border-0"
            >
                {/* Icon Column */}
                <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 transition-all duration-300 ${file.mimetype === 'application/pdf' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-400'}`}>
                    {file.mimetype === 'application/pdf' ? (
                        <>
                            <FileTextIcon size={18} />
                            <span className="text-[7px] font-black uppercase tracking-tighter -mt-0.5">PDF</span>
                        </>
                    ) : (
                        React.cloneElement(getIcon(), { size: 20 })
                    )}
                </div>

                {/* Name Column */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-800 truncate text-sm flex items-center gap-2" title={file.name}>
                        {file.isPinned && <PinIcon size={12} className="text-primary-500 fill-primary-500 shrink-0" />}
                        {file.name}
                        {file.isStarred && <StarIcon size={12} className="text-amber-500 fill-amber-500 shrink-0" />}
                    </h3>
                </div>

                {/* Owner Column */}
                <div className="w-48 hidden md:flex items-center gap-2 shrink-0">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-white shadow-sm">
                        {isMe ? (
                            activeAvatar ? (
                                <img src={`${apiBase}${activeAvatar}`} alt={activeUsername} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{activeUsername[0]}</span>
                            )
                        ) : (
                            file.ownerId?.avatar ? (
                                <img src={`${apiBase}${file.ownerId.avatar}`} alt={ownerName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{ownerName[0]}</span>
                            )
                        )}
                    </div>
                    <span className="text-sm text-slate-600 font-medium">{isMe ? 'me' : ownerName}</span>
                </div>

                {/* Date Column */}
                <div className="w-40 hidden lg:block shrink-0">
                    <p className="text-sm text-slate-500 font-medium">
                        {formatRelativeDate(file.updatedAt)} {isMe ? 'me' : ''}
                    </p>
                </div>

                {/* Size Column */}
                <div className="w-24 hidden sm:block shrink-0 text-right">
                    <p className="text-sm text-slate-500 font-medium">
                        {formatBytes(file.size)}
                    </p>
                </div>

                {/* Actions Column */}
                <button onClick={handleThreeDotsClick} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-all flex-none">
                    <MoreVerticalIcon size={18} />
                </button>
            </div>
        );
    }

    return (
        <div
            onClick={onClick}
            onContextMenu={handleContextMenu}
            className="group bg-white rounded-2xl border overflow-hidden hover:border-primary-300 hover:shadow-md transition-all cursor-pointer flex flex-col shrink-0"
        >
            <div className="h-32 bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary-400 transition-colors relative overflow-hidden">
                {file.isPinned && (
                    <div className="absolute top-2 right-2 z-10 bg-primary-600 p-1.5 rounded-lg shadow-lg border border-primary-400 animate-in zoom-in-50 duration-300">
                        <PinIcon size={12} className="text-white fill-white" />
                    </div>
                )}
                {file.mimetype.startsWith('image/') && file.previewUrl ? (
                    <img
                        src={`${api.defaults.baseURL.replace('/api', '')}/storage${file.previewUrl.startsWith('/') ? file.previewUrl : `/${file.previewUrl}`}`}
                        alt={file.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                ) : file.mimetype === 'application/pdf' ? (
                    <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center relative group-hover:bg-red-100 transition-colors">
                        <FileTextIcon size={48} className="text-red-500 mb-1 transition-transform group-hover:scale-110" />
                        <div className="absolute top-0 left-0 bg-red-600 text-white text-[10px] px-2 py-0.5 font-bold rounded-br-lg shadow-md">
                            PDF
                        </div>
                        <span className="text-[10px] font-bold text-red-500/60 uppercase tracking-widest">Document</span>
                    </div>
                ) : (
                    getIcon()
                )}
            </div>
            <div className="p-4 border-t relative">
                <div className="flex items-center justify-between gap-2 overflow-hidden">
                    <h3 className="font-semibold text-slate-800 break-words line-clamp-2 text-sm flex-1 flex items-center gap-1.5" title={file.name}>
                        {file.isPinned && <PinIcon size={12} className="text-primary-500 fill-primary-500 shrink-0" />}
                        {file.name}
                        {file.isStarred && <StarIcon size={12} className="text-amber-500 fill-amber-500 shrink-0" />}
                    </h3>
                    <button onClick={handleThreeDotsClick} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all block cursor-pointer">
                        <MoreVerticalIcon size={16} />
                    </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{formatBytes(file.size)} • {new Date(file.updatedAt).toLocaleDateString()}</p>
            </div>
        </div>
    );
};

export default FileCard;
