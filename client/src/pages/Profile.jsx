import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
    UserIcon,
    MailIcon,
    ShieldIcon,
    DatabaseIcon,
    LogOutIcon,
    SettingsIcon,
    CalendarIcon,
    HardDriveIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Profile = () => {
    const { user, setUser, logout, activeSpace } = useAuth();
    const navigate = useNavigate();

    // Modal States
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);
    const [is2FAModalOpen, setIs2FAModalOpen] = React.useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = React.useState(false);

    // Form States
    const [newUsername, setNewUsername] = React.useState(user?.username || '');
    const [newSecondSpaceUsername, setNewSecondSpaceUsername] = React.useState(user?.secondSpaceUsername || '');
    const [newEmail, setNewEmail] = React.useState(user?.email || '');
    const [passwords, setPasswords] = React.useState({ current: '', new: '', confirm: '' });
    const [loading, setLoading] = React.useState(false);

    // Sync form states when user context changes
    React.useEffect(() => {
        if (user) {
            setNewUsername(user.username || '');
            setNewSecondSpaceUsername(user.secondSpaceUsername || '');
            setNewEmail(user.email || '');
        }
    }, [user]);
    const [message, setMessage] = React.useState({ type: '', text: '' });
    const fileInputRef = React.useRef(null);

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const storagePercentage = (user?.storageUsed / user?.storageLimit * 100) || 0;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        setLoading(true);
        try {
            const res = await api.post('/auth/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const { user: updatedUser } = res.data;
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setMessage({ type: 'success', text: 'Profile picture updated!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Upload failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUsername = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const updateData = { email: newEmail };
            if (activeSpace === 'second') {
                updateData.secondSpaceUsername = newSecondSpaceUsername;
            } else {
                updateData.username = newUsername;
            }

            const res = await api.patch('/auth/update', updateData);
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
            setIsEditModalOpen(false);
            setMessage({
                type: 'success',
                text: `${activeSpace === 'second' ? 'Second Space Name' : 'Username'} updated successfully!`
            });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Update failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                currentPassword: passwords.current,
                newPassword: passwords.new
            });
            setIsPasswordModalOpen(false);
            setPasswords({ current: '', new: '', confirm: '' });
            setMessage({ type: 'success', text: 'Password changed successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    const handleToggle2FA = async () => {
        setLoading(true);
        try {
            const res = await api.patch('/auth/update', { twoFactorEnabled: !user.twoFactorEnabled });
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
            setMessage({ type: 'success', text: `2FA ${res.data.twoFactorEnabled ? 'Enabled' : 'Disabled'}!` });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update 2FA status' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-indigo-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative glass p-10 rounded-[2.5rem] border-2 border-white shadow-2xl flex flex-col md:flex-row items-center gap-8 bg-white/60">
                    <div
                        onClick={handleAvatarClick}
                        className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-primary-200 ring-4 ring-white cursor-pointer overflow-hidden group/avatar relative"
                    >
                        {user?.avatar ? (
                            <img src={`${api.defaults.baseURL.replace('/api', '')}${user.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            user?.username?.[0]?.toUpperCase()
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                            <SettingsIcon className="text-white animate-pulse" size={24} />
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                    <div className="text-center md:text-left flex-1">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                            <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                                {activeSpace === 'second' ? (user?.secondSpaceUsername ?? 'Second Space User') : user?.username}
                            </h1>
                            {activeSpace !== 'second' && (
                                <span className="px-4 py-1.5 bg-primary-100 text-primary-700 text-xs font-black uppercase tracking-widest rounded-full border border-primary-200">
                                    {user?.role}
                                </span>
                            )}
                        </div>
                        <p className="text-slate-500 font-bold flex items-center justify-center md:justify-start gap-2">
                            <MailIcon size={16} />
                            {user?.email}
                        </p>
                        <div className="flex items-center justify-center md:justify-start gap-4 mt-6">
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-200 hover:scale-105 active:scale-95 transition-all"
                            >
                                Edit Profile
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-200"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Storage Card */}
                <div className="glass p-8 rounded-[2.5rem] border-2 border-white shadow-xl bg-white/60 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <HardDriveIcon size={120} className="text-primary-600" />
                    </div>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-primary-100 text-primary-600 rounded-2xl">
                            <DatabaseIcon size={24} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Storage Usage</h3>
                    </div>
                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Occupied Space</p>
                                <h4 className="text-3xl font-black text-slate-800">{formatBytes(user?.storageUsed)}</h4>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Limit</p>
                                <p className="text-lg font-bold text-slate-500">{formatBytes(user?.storageLimit)}</p>
                            </div>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                            <div
                                className={`h-full transition-all duration-1000 ease-out ${storagePercentage > 90 ? 'bg-rose-500' : 'bg-primary-500'}`}
                                style={{ width: `${storagePercentage}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span>{storagePercentage.toFixed(1)}% used</span>
                            <span>{formatBytes(user?.storageLimit - user?.storageUsed)} remaining</span>
                        </div>
                    </div>
                </div>

                {/* Account Settings Card */}
                <div className="glass p-8 rounded-[2.5rem] border-2 border-white shadow-xl bg-white/60 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShieldIcon size={120} className="text-indigo-600" />
                    </div>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                            <ShieldIcon size={24} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Security</h3>
                    </div>
                    <div className="space-y-4">
                        <div
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors cursor-pointer group/item"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-50 rounded-lg group-hover/item:bg-indigo-50 transition-colors">
                                    <SettingsIcon size={16} className="text-slate-400 group-hover/item:text-indigo-600" />
                                </div>
                                <span className="text-sm font-bold text-slate-700">Change Password</span>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-slate-200 group-hover/item:bg-indigo-400"></div>
                        </div>
                        <div
                            onClick={() => setIs2FAModalOpen(true)}
                            className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors cursor-pointer group/item"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-50 rounded-lg group-hover/item:bg-indigo-50 transition-colors">
                                    <ShieldIcon size={16} className="text-slate-400 group-hover/item:text-indigo-600" />
                                </div>
                                <span className="text-sm font-bold text-slate-700">Two-Factor Auth</span>
                            </div>
                            <span className={`text-[10px] font-black uppercase ${user?.twoFactorEnabled ? 'text-green-600' : 'text-slate-400'}`}>
                                {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <div
                            onClick={() => setIsHistoryModalOpen(true)}
                            className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors cursor-pointer group/item"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-50 rounded-lg group-hover/item:bg-indigo-50 transition-colors">
                                    <CalendarIcon size={16} className="text-slate-400 group-hover/item:text-indigo-600" />
                                </div>
                                <span className="text-sm font-bold text-slate-700">Login History</span>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Info List */}
            <div className="glass p-8 rounded-[2.5rem] border-2 border-white shadow-xl bg-white/40 backdrop-blur-md">
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3 italic">
                    <UserIcon size={20} className="text-primary-600" />
                    ACCOUNT SETTINGS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</p>
                        <p className="text-md font-bold text-slate-700">
                            {activeSpace === 'second' ? (user?.secondSpaceUsername ?? 'Second Space User') : user?.username}
                        </p>
                    </div>
                    {activeSpace !== 'second' && (
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</p>
                            <p className="text-md font-bold text-slate-700">{user?.role}</p>
                        </div>
                    )}
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account ID</p>
                        <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-tighter">{user?._id}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Since</p>
                        <p className="text-md font-bold text-slate-700">October 2023</p>
                    </div>
                </div>
            </div>
            {/* Feedback Message */}
            {message.text && (
                <div className={`fixed bottom-8 right-8 px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 duration-500 font-bold text-sm z-[100] ${message.type === 'success' ? 'bg-green-600 text-white' : 'bg-rose-600 text-white'}`}>
                    {message.text}
                    <button onClick={() => setMessage({ type: '', text: '' })} className="ml-4 opacity-50 hover:opacity-100">✕</button>
                </div>
            )}

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
                    <form onSubmit={handleUpdateUsername} className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-black text-slate-800 mb-6 italic uppercase tracking-tighter">Edit Profile</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    {activeSpace === 'second' ? 'Second Space Name' : 'Username'}
                                </label>
                                <input
                                    type="text"
                                    placeholder={activeSpace === 'second' ? 'Enter Second Space Name' : 'Enter Username'}
                                    value={activeSpace === 'second' ? newSecondSpaceUsername : newUsername}
                                    onChange={(e) => activeSpace === 'second' ? setNewSecondSpaceUsername(e.target.value) : setNewUsername(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-primary-500 rounded-2xl px-5 py-3 outline-none transition-all font-bold text-slate-700"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-primary-500 rounded-2xl px-5 py-3 outline-none transition-all font-bold text-slate-700"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Change Password Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsPasswordModalOpen(false)} />
                    <form onSubmit={handleChangePassword} className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-black text-slate-800 mb-6 italic uppercase tracking-tighter">Change Password</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                                <input
                                    type="password"
                                    value={passwords.current}
                                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-primary-500 rounded-2xl px-5 py-3 outline-none transition-all font-bold text-slate-700"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                                <input
                                    type="password"
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-primary-500 rounded-2xl px-5 py-3 outline-none transition-all font-bold text-slate-700"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-primary-500 rounded-2xl px-5 py-3 outline-none transition-all font-bold text-slate-700"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Changing...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
            {/* Two-Factor Auth Modal */}
            {is2FAModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIs2FAModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
                        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <ShieldIcon size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2 italic uppercase tracking-tighter">Two-Factor Authentication</h3>
                        <p className="text-sm text-slate-500 mb-8 font-bold">Secure your account with an extra layer of protection.</p>

                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl mb-8 border-2 border-slate-100">
                            <div className="text-left">
                                <p className="text-sm font-black text-slate-800">Status</p>
                                <p className={`text-xs font-bold ${user?.twoFactorEnabled ? 'text-green-600' : 'text-slate-400'}`}>
                                    {user?.twoFactorEnabled ? 'Currently Active' : 'Currently Disabled'}
                                </p>
                            </div>
                            <button
                                onClick={handleToggle2FA}
                                className={`w-14 h-8 rounded-full transition-all relative ${user?.twoFactorEnabled ? 'bg-green-500' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${user?.twoFactorEnabled ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <button
                            onClick={() => setIs2FAModalOpen(false)}
                            className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-900 transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Login History Modal */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsHistoryModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-black text-slate-800 mb-6 italic uppercase tracking-tighter flex items-center gap-3">
                            <CalendarIcon size={24} className="text-primary-600" />
                            Login History
                        </h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {user?.loginHistory?.length > 0 ? user.loginHistory.map((log, i) => (
                                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-black text-slate-800">{log.device || 'Web Browser'}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.date).toLocaleString()}</p>
                                    </div>
                                    <p className="text-[10px] font-mono font-bold text-slate-400">{log.ip || '127.0.0.1'}</p>
                                </div>
                            )) : (
                                <div className="text-center py-12 text-slate-400">
                                    <CalendarIcon size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="font-bold text-sm italic">No recent logins found</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setIsHistoryModalOpen(false)}
                            className="w-full mt-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
