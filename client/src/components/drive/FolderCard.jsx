import { FolderIcon, MoreVerticalIcon, StarIcon, PinIcon, LockIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const colorMap = {
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', hover: 'group-hover:bg-amber-600' },
    red: { bg: 'bg-red-50', text: 'text-red-600', hover: 'group-hover:bg-red-600' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', hover: 'group-hover:bg-emerald-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'group-hover:bg-blue-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', hover: 'group-hover:bg-purple-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', hover: 'group-hover:bg-rose-600' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', hover: 'group-hover:bg-indigo-600' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-600', hover: 'group-hover:bg-slate-600' },
};

const FolderCard = ({ folder, onClick, onContextMenu, viewMode = 'grid' }) => {
    const colorStyle = colorMap[folder.color] || colorMap.amber;

    const handleContextMenu = (e) => {
        e.preventDefault();
        onContextMenu(e, folder, 'folder');
    };

    const handleThreeDotsClick = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const syntheticEvent = {
            clientX: rect.left,
            clientY: rect.bottom + 5,
            preventDefault: () => { }
        };
        onContextMenu(syntheticEvent, folder, 'folder');
    };

    const formatRelativeDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    };

    if (viewMode === 'list') {
        const { user, activeUsername, activeAvatar } = useAuth();
        const apiBase = api.defaults.baseURL.replace('/api', '');
        const ownerName = folder.ownerId?.username || 'Unknown';
        const ownerIdStr = folder.ownerId?._id || folder.ownerId;
        const isMe = user?._id === ownerIdStr;

        return (
            <div
                onClick={() => onClick(folder)}
                onContextMenu={handleContextMenu}
                className="group bg-white hover:bg-slate-50 transition-all cursor-pointer flex items-center p-3 gap-4 border-b border-slate-100 last:border-0"
            >
                {/* Icon Column */}
                <div className={`w-10 h-10 ${colorStyle.bg} rounded-xl flex items-center justify-center ${colorStyle.text} transition-colors ${colorStyle.hover} group-hover:text-white shrink-0 relative`}>
                    <FolderIcon size={20} />
                    {folder.isLocked && (
                        <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                            <LockIcon size={10} className="text-indigo-600" />
                        </div>
                    )}
                </div>

                {/* Name Column */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-800 truncate text-sm flex items-center gap-2" title={folder.name}>
                        {folder.isPinned && <PinIcon size={12} className="text-primary-500 fill-primary-500 shrink-0" />}
                        {folder.name}
                        {folder.isStarred && <StarIcon size={14} className="text-amber-500 fill-amber-500 shrink-0" />}
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
                            folder.ownerId?.avatar ? (
                                <img src={`${apiBase}${folder.ownerId.avatar}`} alt={ownerName} className="w-full h-full object-cover" />
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
                        {formatRelativeDate(folder.updatedAt)} {isMe ? 'me' : ''}
                    </p>
                </div>

                {/* Size Column */}
                <div className="w-24 hidden sm:block shrink-0 text-right">
                    <p className="text-sm text-slate-500 font-medium">—</p>
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
            onClick={() => onClick(folder)}
            onContextMenu={handleContextMenu}
            className="group bg-white rounded-2xl border hover:border-slate-300 hover:shadow-md transition-all cursor-pointer relative shrink-0 p-4"
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`${colorStyle.bg} rounded-xl flex items-center justify-center ${colorStyle.text} transition-colors ${colorStyle.hover} group-hover:text-white w-12 h-12`}>
                    <FolderIcon size={24} />
                </div>
                <div className="flex items-center gap-1">
                    {folder.isLocked && (
                        <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg border border-indigo-400">
                            <LockIcon size={12} className="text-white" />
                        </div>
                    )}
                    {folder.isPinned && (
                        <div className="bg-primary-600 p-1.5 rounded-lg shadow-lg border border-primary-400 animate-in zoom-in-50 duration-300">
                            <PinIcon size={12} className="text-white fill-white" />
                        </div>
                    )}
                    <button onClick={handleThreeDotsClick} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all block cursor-pointer">
                        <MoreVerticalIcon size={18} />
                    </button>
                </div>
            </div>

            <div className="">
                <h3 className="font-semibold text-slate-800 break-words line-clamp-2 flex items-center gap-1.5" title={folder.name}>
                    {folder.isPinned && <PinIcon size={14} className="text-primary-500 fill-primary-500 shrink-0" />}
                    {folder.name}
                    {folder.isStarred && <StarIcon size={14} className="text-amber-500 fill-amber-500 shrink-0" />}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Updated {new Date(folder.updatedAt).toLocaleDateString()}</p>
            </div>
        </div>
    );
};

export default FolderCard;
