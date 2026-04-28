import React, { useState, useEffect } from 'react';
import { XIcon, SearchIcon, Share2Icon, Loader2Icon, UserIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';
import api from '../../api/axios';

const ShareModal = ({ isOpen, onClose, item, type }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sharing, setSharing] = useState(false);
    const [sharedWith, setSharedWith] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            setSharedWith(null);
            setSearchQuery('');
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        console.log('Fetching users from /api/auth/list...');
        try {
            const res = await api.get('/auth/list');
            console.log('Users received:', res.data);
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError(err.response?.data?.error || 'Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async (user) => {
        setSharing(true);
        try {
            await api.post(`${type === 'folder' ? '/folders' : '/files'}/${item._id}/share`, {
                username: user.username
            });
            setSharedWith(user.username);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            console.error('Share error:', err);
            alert(err.response?.data?.error || 'Failed to share item.');
        } finally {
            setSharing(false);
        }
    };

    if (!isOpen || !item) return null;

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100">
                <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                                <Share2Icon size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Share Item</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate max-w-[200px]">
                                    {item.name} • {users.length} users
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all shadow-sm">
                            <XIcon size={18} />
                        </button>
                    </div>

                    <div className="relative group">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Select user or search..."
                            className="w-full bg-white border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 rounded-xl pl-12 pr-6 py-3 text-sm font-semibold text-slate-700 outline-none transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="max-h-[350px] overflow-y-auto p-2 bg-white">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                            <Loader2Icon size={28} className="text-primary-600 animate-spin" />
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Users...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3 px-4 text-center">
                            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                                <AlertCircleIcon size={24} />
                            </div>
                            <p className="text-red-500 font-bold text-sm">{error}</p>
                            <button
                                onClick={fetchUsers}
                                className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-primary-600 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : sharedWith ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in slide-in-from-bottom-4">
                            <div className="w-14 h-14 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
                                <CheckCircleIcon size={32} />
                            </div>
                            <h4 className="text-md font-bold text-slate-800">Shared Successfully!</h4>
                            <p className="text-sm text-slate-500">Shared with <span className="text-primary-600 font-bold">{sharedWith}</span></p>
                        </div>
                    ) : filteredUsers.length > 0 ? (
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2">Select Recipient</p>
                            {filteredUsers.map(user => (
                                <button
                                    key={user._id}
                                    onClick={() => handleShare(user)}
                                    disabled={sharing}
                                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all group border border-transparent hover:border-slate-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <UserIcon size={16} className="text-slate-400" />
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors uppercase tracking-tight text-xs">{user.username}</p>
                                            <p className={`text-[9px] font-black uppercase tracking-widest leading-none ${user.role === 'Admin' ? 'text-indigo-500' : 'text-slate-400'}`}>
                                                {user.role || 'Internal Employee'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-primary-600 group-hover:text-white transition-all transform scale-90 group-hover:scale-100 opacity-0 group-hover:opacity-100">
                                        <Share2Icon size={14} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <SearchIcon size={20} className="text-slate-300" />
                            </div>
                            <p className="text-slate-400 font-bold text-sm">No users found</p>
                            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">Try a different search term</p>
                        </div>
                    )}
                </div>

                {sharing && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
                        <Loader2Icon size={40} className="text-primary-600 animate-spin" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShareModal;
