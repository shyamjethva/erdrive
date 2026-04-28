import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    FolderIcon,
    Share2Icon,
    Trash2Icon,
    LogOutIcon,
    ShieldCheckIcon,
    DatabaseIcon,
    ClockIcon,
    StarIcon,
    ShieldAlertIcon,
    HardDriveIcon,
    LayersIcon,
    ShieldIcon,
    PlusIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SpacePasswordModal from '../drive/SpacePasswordModal';

const Sidebar = () => {
    const { user, logout, activeSpace, toggleSpace, initializeSecondSpace } = useAuth();
    const navigate = useNavigate();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);
    const [passwordMode, setPasswordMode] = React.useState('unlock'); // 'init' or 'unlock'

    const handleInitSecondSpace = async (password) => {
        try {
            await initializeSecondSpace(password);
            setIsPasswordModalOpen(false);
            navigate('/second-space');
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const navItems = [
        { name: 'My Files', icon: FolderIcon, path: '/' },
        { name: 'Recents', icon: ClockIcon, path: '/recents' },
        { name: 'Starred', icon: StarIcon, path: '/starred' },
        { name: 'Shared', icon: Share2Icon, path: '/shared' },
        { name: 'Trash', icon: Trash2Icon, path: '/trash' },
        { name: 'Spam', icon: ShieldAlertIcon, path: '/spam' },
        { name: 'Storage', icon: DatabaseIcon, path: '/storage' },
    ];

    if (user?.role === 'Admin' && activeSpace === 'main') {
        navItems.push({ name: 'Admin Panel', icon: ShieldCheckIcon, path: '/admin' });
    }

    const isSecondSpaceActive = activeSpace === 'second';
    const hasSecondSpace = !!user?.secondSpaceRootId;

    return (
        <div className="w-64 h-full glass border-r flex flex-col p-4">
            <div className="flex flex-col gap-1 mb-8 px-2">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg transition-all duration-300 ${isSecondSpaceActive ? 'bg-indigo-600 shadow-indigo-200' : 'bg-primary-600 shadow-primary-200'
                        }`}>
                        {isSecondSpaceActive ? <ShieldIcon size={20} strokeWidth={2.5} /> : <HardDriveIcon size={20} strokeWidth={2.5} />}
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-800 transition-colors duration-300">
                        Internal Drive
                    </span>
                </div>
                {isSecondSpaceActive && (
                    <div className="flex items-center gap-2 mt-2 px-1">
                        <div className="h-4 w-[2px] bg-indigo-500 rounded-full" />
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            Second Space
                        </span>
                    </div>
                )}
            </div>

            <nav className="flex-1 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${isActive
                                ? (isSecondSpaceActive
                                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                                    : 'bg-primary-50 text-primary-600 font-medium')
                                : 'text-slate-600 hover:bg-slate-100'
                            }`
                        }
                    >
                        <item.icon size={20} />
                        {item.name}
                    </NavLink>
                ))}

                {/* Space Switching Button */}
                <button
                    onClick={(e) => {
                        if (!hasSecondSpace) {
                            if (window.confirm('Initialize Second Space?')) {
                                setPasswordMode('init');
                                setIsPasswordModalOpen(true);
                            }
                        } else {
                            // Toggle space
                            if (isSecondSpaceActive) {
                                toggleSpace('main');
                                navigate('/');
                            } else {
                                navigate('/second-space');
                            }
                        }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-300 mt-1 ${isSecondSpaceActive
                        ? 'bg-slate-100 text-slate-600 border border-slate-200'
                        : hasSecondSpace
                            ? 'text-slate-600 hover:bg-slate-50'
                            : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        {isSecondSpaceActive ? (
                            <HardDriveIcon size={20} className="text-slate-500" />
                        ) : hasSecondSpace ? (
                            <LayersIcon size={20} className="text-slate-500" />
                        ) : (
                            <div className="w-5 h-5 border-2 border-dashed border-slate-300 rounded flex items-center justify-center">
                                <PlusIcon size={12} />
                            </div>
                        )}
                        <span className="text-sm font-medium">
                            {isSecondSpaceActive ? 'Switch to Main Drive' : hasSecondSpace ? 'Second Space' : 'Add Second Space'}
                        </span>
                    </div>
                </button>
            </nav>

            <div className="pt-4 border-t space-y-4">
                {/* Space Switching is now handled in the main nav list */}

                <SpacePasswordModal
                    isOpen={isPasswordModalOpen}
                    mode="init"
                    onClose={() => setIsPasswordModalOpen(false)}
                    onSubmit={handleInitSecondSpace}
                />

                {/* Storage Usage */}
                <div className="mx-1 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                        <span className="flex items-center gap-1.5 font-black uppercase tracking-wider">
                            <DatabaseIcon size={14} className={isSecondSpaceActive ? "text-indigo-500" : "text-primary-500"} />
                            {isSecondSpaceActive ? 'Private Storage' : 'Storage'}
                        </span>
                        <span className="text-slate-400">
                            {user?.storageLimit > 0 ? (user?.storageUsed / user?.storageLimit * 100).toFixed(0) : 0}%
                        </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                        <div
                            className={`h-full transition-all duration-1000 shadow-sm ${isSecondSpaceActive ? 'bg-indigo-500' : 'bg-primary-500'}`}
                            style={{ width: `${user?.storageLimit > 0 ? (user?.storageUsed / user?.storageLimit) * 100 : 0}%` }}
                        />
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium text-center">
                        {Math.round((user?.storageUsed / (1024 ** 3)) * 10) / 10} GB of {(user?.storageLimit || 0) / (1024 ** 3)} GB used
                    </p>
                </div>

                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2 w-full text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
                >
                    <LogOutIcon size={20} />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
