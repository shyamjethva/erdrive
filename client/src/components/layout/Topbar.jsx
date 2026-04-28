import React from 'react';
import { SearchIcon, BellIcon, FileIcon, FolderIcon, UserIcon, LogOutIcon, SettingsIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';

const Topbar = ({ searchQuery, setSearchQuery }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = React.useState([]);
    const [hasError, setHasError] = React.useState(false);
    const [isNotifOpen, setIsNotifOpen] = React.useState(false);
    const [searchResults, setSearchResults] = React.useState({ files: [], folders: [] });
    const [isSearching, setIsSearching] = React.useState(false);
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);
    const notifRef = React.useRef(null);
    const profileRef = React.useRef(null);
    const navigate = useNavigate();
    const { logout, activeSpace } = useAuth();

    const fetchNotifications = React.useCallback(async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
            setHasError(false);
        } catch (err) {
            setHasError(true);
            // console.error('Failed to fetch notifications:', err);
        }
    }, []);

    React.useEffect(() => {
        if (hasError) return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 5000);
        return () => clearInterval(interval);
    }, [fetchNotifications, hasError]);

    // Click outside to close notification dropdown
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
        };

        if (isNotifOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isNotifOpen]);

    // Click outside to close profile dropdown
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };

        if (isProfileOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfileOpen]);

    // Global Search Logic with Debounce
    React.useEffect(() => {
        if (!searchQuery?.trim()) {
            setSearchResults({ files: [], folders: [] });
            setIsSearchOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const [filesRes, foldersRes] = await Promise.all([
                    api.get(`/files/search?q=${searchQuery}`),
                    api.get(`/folders/search?q=${searchQuery}`)
                ]);
                setSearchResults({ files: filesRes.data, folders: foldersRes.data });
                setIsSearchOpen(true);
            } catch (err) {
                console.error('Search failed:', err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b sticky top-0 z-50">
            <div className="flex-1 max-w-2xl relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
                    <SearchIcon size={18} />
                </div>
                <input
                    type="text"
                    placeholder="Search in Drive..."
                    className="w-full bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-xl pl-10 pr-4 py-2 text-slate-800 transition-all outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery?.length > 1 && setIsSearchOpen(true)}
                />

                {/* Search Results Dropdown */}
                {isSearchOpen && (searchResults.files.length > 0 || searchResults.folders.length > 0 || isSearching) && (
                    <div
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2"
                        onMouseLeave={() => setIsSearchOpen(false)}
                    >
                        <div className="max-h-[70vh] overflow-y-auto py-2">
                            {isSearching ? (
                                <div className="p-4 text-center text-slate-400 text-sm">Searching...</div>
                            ) : (
                                <>
                                    {searchResults.folders.length > 0 && (
                                        <div className="px-2 pb-2">
                                            <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Folders</p>
                                            {searchResults.folders.map(folder => (
                                                <div
                                                    key={folder._id}
                                                    className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer rounded-lg group transition-colors"
                                                    onClick={() => {
                                                        // Implement folder navigation if needed, or just close search
                                                        setIsSearchOpen(false);
                                                        setSearchQuery('');
                                                    }}
                                                >
                                                    <FolderIcon size={18} className="text-amber-400 fill-amber-400/20" />
                                                    <span className="text-sm text-slate-700 font-medium group-hover:text-primary-600 truncate">{folder.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {searchResults.files.length > 0 && (
                                        <div className="px-2">
                                            <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Files</p>
                                            {searchResults.files.map(file => (
                                                <div
                                                    key={file._id}
                                                    className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer rounded-lg group transition-colors"
                                                    onClick={() => {
                                                        setIsSearchOpen(false);
                                                        setSearchQuery('');
                                                    }}
                                                >
                                                    <FileIcon size={18} className="text-blue-500 fill-blue-500/10" />
                                                    <span className="text-sm text-slate-700 font-medium group-hover:text-primary-600 truncate">{file.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4 relative">
                <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative"
                >
                    <BellIcon size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                            {unreadCount}
                        </span>
                    )}
                </button>

                {isNotifOpen && (
                    <div ref={notifRef} className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                            <h4 className="font-bold text-slate-800">Notifications</h4>
                            <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest bg-primary-50 px-2 py-1 rounded-md">New</span>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.map(notif => (
                                    <div
                                        key={notif._id}
                                        onClick={() => markAsRead(notif._id)}
                                        className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors border-l-4 ${notif.isRead ? 'border-transparent opacity-60' : 'border-primary-500 bg-primary-50/20'}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 flex items-center justify-center text-xs font-bold text-slate-500">
                                                {notif.senderId?.username?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-700">
                                                    <span className="font-bold text-slate-900">{notif.senderId?.username}</span> {notif.message}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center">
                                    <p className="text-slate-400 text-sm font-medium">No notifications yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3 pl-4 border-l ml-2 relative" ref={profileRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 hover:bg-slate-50 p-1 rounded-xl transition-colors group"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-slate-800 leading-none group-hover:text-primary-600 transition-colors">
                                {activeSpace === 'second' ? (user?.secondSpaceUsername ?? 'Second Space User') : user?.username}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 capitalize font-bold uppercase tracking-widest">{user?.role}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold ring-2 ring-white shadow-sm ring-offset-2 group-hover:ring-primary-500 transition-all overflow-hidden">
                            {user?.avatar ? (
                                <img src={`${api.defaults.baseURL.replace('/api', '')}${user.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                (activeSpace === 'second' ? (user?.secondSpaceUsername?.[0] ?? user?.username?.[0]) : user?.username?.[0])?.toUpperCase()
                            )}
                        </div>
                    </button>

                    {isProfileOpen && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="px-4 py-3 border-b border-slate-50">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account</p>
                                <p className="text-sm font-black text-slate-800 truncate">
                                    {activeSpace === 'second' ? (user?.secondSpaceUsername ?? 'Second Space User') : user?.username}
                                </p>
                                {activeSpace !== 'second' && (
                                    <p className="text-[10px] text-slate-400 mt-1 capitalize font-bold uppercase">{user?.role}</p>
                                )}
                            </div>
                            <div className="p-1">
                                <Link
                                    to="/profile"
                                    onClick={() => setIsProfileOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-600 rounded-xl transition-colors font-bold"
                                >
                                    <UserIcon size={18} />
                                    My Profile
                                </Link>
                                <div className="h-px bg-slate-50 my-1 mx-2" />
                                <button
                                    onClick={() => {
                                        logout();
                                        navigate('/login');
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-bold"
                                >
                                    <LogOutIcon size={18} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Topbar;
