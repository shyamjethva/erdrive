import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trash2Icon, Edit3Icon, DownloadIcon, LinkIcon, XIcon, RotateCcwIcon, StarIcon, PaletteIcon, PinIcon, LockIcon, UnlockIcon } from 'lucide-react';

const ContextMenu = ({ x, y, item, type, onClose, onAction, isTrashNode }) => {
    const { user } = useAuth();
    if (!item) return null;
    const menuRef = useRef();
    const [position, setPosition] = useState({ top: y, left: x });

    useLayoutEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            let newX = x;
            let newY = y;

            // Horizontal flip if outside viewport
            if (x + rect.width > window.innerWidth) {
                newX = x - rect.width;
            }
            // Vertical flip if outside viewport
            if (y + rect.height > window.innerHeight) {
                newY = y - rect.height;
            }

            // Ensure no negative values
            newX = Math.max(8, newX);
            newY = Math.max(8, newY);

            setPosition({ top: newY, left: newX });
        }
    }, [x, y]);

    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);

    const actions = isTrashNode ? [
        { label: 'Restore', icon: RotateCcwIcon, action: 'restore', color: 'text-indigo-600' },
        { label: 'Delete Permanently', icon: Trash2Icon, action: 'delete_permanently', color: 'text-red-500' },
    ] : [
        { label: 'Rename', icon: Edit3Icon, action: 'rename', color: 'text-slate-600' },
        { label: 'Share Link', icon: LinkIcon, action: 'share', color: 'text-slate-600' },
        { label: 'Change Color', icon: PaletteIcon, action: 'change_color', color: 'text-slate-600', hide: type === 'file' },
        { label: item?.isPinned ? 'Unpin from Top' : 'Pin to Top', icon: PinIcon, action: 'pin', color: item?.isPinned ? 'text-primary-600' : 'text-slate-600' },
        { label: item?.isStarred ? 'Remove from Starred' : 'Add to Starred', icon: StarIcon, action: 'star', color: item?.isStarred ? 'text-amber-500' : 'text-slate-600' },
        { label: 'Download', icon: DownloadIcon, action: 'download', color: 'text-slate-600', hide: type === 'folder' },
        { label: item?.isLocked ? 'Remove Lock' : 'Lock Folder', icon: item?.isLocked ? UnlockIcon : LockIcon, action: item?.isLocked ? 'remove_lock' : 'lock', color: item?.isLocked ? 'text-amber-600' : 'text-indigo-600', hide: type === 'file' || (item.ownerId?._id || item.ownerId) !== user?._id },
        { label: 'Delete', icon: Trash2Icon, action: 'delete', color: 'text-red-500' },
    ];

    return (
        <div
            ref={menuRef}
            className="fixed z-[100] bg-white w-48 shadow-2xl rounded-2xl border p-2 animate-in fade-in zoom-in duration-100"
            style={{ top: position.top, left: position.left }}
        >
            <div className="flex items-center justify-between px-3 py-2 border-b mb-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[120px]">
                    {item?.name || 'Item'}
                </span>
                <button onClick={onClose} className="p-0.5 text-slate-300 hover:text-slate-600 rounded-md">
                    <XIcon size={12} />
                </button>
            </div>

            {item && actions.filter(a => !a.hide).map((a) => (
                <button
                    key={a.label}
                    onClick={() => {
                        onAction(a.action, item, type);
                        onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-all text-sm font-bold ${a.color}`}
                >
                    <a.icon size={16} />
                    {a.label}
                </button>
            ))}
        </div>
    );
};

export default ContextMenu;
