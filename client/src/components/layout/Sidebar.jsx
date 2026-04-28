import React from 'react';
import { NavLink } from 'react-router-dom';
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
    ShieldCheck,
    ShieldOff,
    KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SecondSpaceModal from '../drive/SecondSpaceModal';

const Sidebar = () => {
    const { user, logout } = useAuth();

    const navItems = [
        { name: 'My Files', icon: FolderIcon, path: '/' },
        { name: 'Recents', icon: ClockIcon, path: '/recents' },
        { name: 'Starred', icon: StarIcon, path: '/starred' },
        { name: 'Shared', icon: Share2Icon, path: '/shared' },
        { name: 'Trash', icon: Trash2Icon, path: '/trash' },
        { name: 'Spam', icon: ShieldAlertIcon, path: '/spam' },
        { name: 'Storage', icon: DatabaseIcon, path: '/storage' },
    ];

    const { isSecondSpace, setSecondSpaceMode } = useAuth();
    const [isSpaceModalOpen, setIsSpaceModalOpen] = React.useState(false);

    const handleSpaceToggle = () => {
        if (isSecondSpace) {
            setSecondSpaceMode(false);
            window.location.href = '/'; // Reset to home on exit
        } else {
            setIsSpaceModalOpen(true);
        }
    };

    if (user?.role === 'Admin') {
        navItems.push({ name: 'Admin Panel', icon: ShieldCheckIcon, path: '/admin' });
    }

    return (
        <div className="w-64 h-full glass border-r flex flex-col p-4">
            <div className="flex items-center gap-3 px-2 mb-10">
                <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
                    <HardDriveIcon size={20} strokeWidth={2.5} />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-800">Internal Drive</span>
            </div>

            <nav className="flex-1 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-primary-50 text-primary-600 font-medium'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`
                        }
                    >
                        <item.icon size={20} />
                        {item.name}
                    </NavLink>
                ))}

                <button
                    onClick={handleSpaceToggle}
                    className={`flex items-center gap-3 px-3 py-2 w-full rounded-xl transition-all duration-200 mt-4 ${isSecondSpace
                        ? 'bg-purple-100 text-purple-700 font-bold border border-purple-200'
                        : 'text-slate-600 hover:bg-purple-50 hover:text-purple-600'
                        }`}
                >
                    {isSecondSpace ? <ShieldCheck size={20} /> : <KeyRound size={20} />}
                    {isSecondSpace ? 'Exit Second Space' : 'Second Space'}
                </button>
            </nav>

            <div className="pt-4 border-t space-y-4">
                {/* Storage Usage */}
                <div className="mx-1 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                        <span className="flex items-center gap-1.5"><DatabaseIcon size={14} className="text-primary-500" /> Storage</span>
                        <span className="text-slate-400">{(user?.storageUsed / user?.storageLimit * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                        <div
                            className="h-full bg-primary-500 transition-all duration-1000 shadow-sm"
                            style={{ width: `${(user?.storageUsed / user?.storageLimit) * 100}%` }}
                        />
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium text-center">
                        {isSecondSpace ? 'Isolated Space Storage' : `${Math.round((user?.storageUsed / (1024 ** 3)) * 10) / 10} GB of ${user?.storageLimit / (1024 ** 3)} GB used`}
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

            <SecondSpaceModal
                isOpen={isSpaceModalOpen}
                onClose={() => setIsSpaceModalOpen(false)}
                onSuccess={() => {
                    window.location.href = '/'; // Refresh to load space data
                }}
            />
        </div>
    );
};

export default Sidebar;
