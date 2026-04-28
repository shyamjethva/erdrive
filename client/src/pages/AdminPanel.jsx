import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { UserPlusIcon, UsersIcon, DatabaseIcon, ShieldCheckIcon, Trash2Icon, Edit3Icon, XIcon } from 'lucide-react';

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'Employee', storageLimit: 5 });
    const [error, setError] = useState(null);

    const fetchUsers = async () => {
        try {
            setError(null);
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
            if (!err.response) {
                setError('Network Error: Backend server is unreachable.');
            } else {
                setError(err.response.data?.error || 'Failed to fetch users');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            setError(null);
            const res = await api.post('/admin/users', {
                ...newUser,
                storageLimit: newUser.storageLimit * 1024 * 1024 * 1024 // Convert GB to Bytes
            });
            setUsers([...users, res.data.user]);
            setIsModalOpen(false);
            setNewUser({ username: '', email: '', password: '', role: 'Employee', storageLimit: 5 });
        } catch (err) {
            console.error('User creation failed:', err.response?.data || err.message);
            const errorMsg = err.response?.data?.error || (err.response ? 'Failed to create user' : 'Network Error: Server unreachable');
            setError(errorMsg);
            alert(errorMsg);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? All their files may become inaccessible.')) return;

        try {
            await api.delete(`/admin/users/${userId}`);
            setUsers(users.filter(u => u._id !== userId));
        } catch (err) {
            console.error('Delete failed:', err);
            alert(err.response?.data?.error || 'Failed to delete user');
        }
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        try {
            const limit = parseInt(editingUser.storageLimitInGB) || 0;
            const res = await api.patch(`/admin/users/${editingUser._id}`, {
                username: editingUser.username,
                email: editingUser.email,
                role: editingUser.role,
                storageLimit: limit * 1024 * 1024 * 1024
            });
            setUsers(users.map(u => u._id === editingUser._id ? res.data : u));
            setIsEditModalOpen(false);
            setEditingUser(null);
        } catch (err) {
            console.error('Edit failed:', err);
            alert(err.response?.data?.error || 'Failed to update user');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Admin Console</h1>
                    <p className="text-slate-500 mt-1 font-medium">Manage organization employees and system storage.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-[0.98]"
                >
                    <UserPlusIcon size={20} />
                    <span>Add Employee</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border-2 border-red-100 text-red-600 p-4 rounded-2xl font-bold flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                            <Trash2Icon size={20} />
                        </div>
                        <span>{error}</span>
                    </div>
                    <button
                        onClick={() => fetchUsers()}
                        className="px-4 py-2 bg-white border border-red-200 rounded-xl hover:bg-red-100 transition-colors text-sm"
                    >
                        Retry
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
                        <UsersIcon size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
                        <p className="text-2xl font-black text-slate-800">{users.length}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center font-bold">
                        <DatabaseIcon size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Storage Used</p>
                        <p className="text-2xl font-black text-slate-800">
                            {Math.round((users.reduce((acc, u) => acc + (u.storageUsed || 0), 0) / (1024 ** 3)) * 100) / 100} GB
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Username</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Email</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Role</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Storage Used</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {users.map((u) => (
                            <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 uppercase text-xs border">
                                            {u.username[0]}
                                        </div>
                                        <span className="font-bold text-slate-800">{u.username}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-medium text-slate-600">{u.email}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${u.role === 'Admin' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'
                                        }`}>
                                        {u.role === 'Admin' && <ShieldCheckIcon size={12} className="mr-1" />}
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="w-full max-w-[120px]">
                                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-bold">
                                            <span>{Math.round((u.storageUsed / (1024 ** 3)) * 10) / 10} GB</span>
                                            <span>{Math.round(u.storageLimit / (1024 ** 3))} GB</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary-500"
                                                style={{ width: `${u.storageLimit ? ((u.storageUsed || 0) / u.storageLimit) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => {
                                            const limitInGB = Math.round((u.storageLimit || 0) / (1024 ** 3));
                                            setEditingUser({ ...u, storageLimitInGB: limitInGB });
                                            setIsEditModalOpen(true);
                                        }}
                                        className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 rounded-xl transition-all"
                                    >
                                        <Edit3Icon size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(u._id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <Trash2Icon size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-slate-800">Add Employee</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XIcon /></button>
                        </div>
                        <form onSubmit={handleCreateUser} className="space-y-5">
                            <div>
                                <label className="block text-sm font-black text-slate-700 mb-2 ml-1">Username</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border-2 border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 rounded-2xl px-5 py-3 text-slate-800 font-bold outline-none transition-all"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-black text-slate-700 mb-2 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    className="w-full bg-slate-50 border-2 border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 rounded-2xl px-5 py-3 text-slate-800 font-bold outline-none transition-all"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    placeholder="employee@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-black text-slate-700 mb-2 ml-1">Temporary Password</label>
                                <input
                                    type="password"
                                    className="w-full bg-slate-50 border-2 border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 rounded-2xl px-5 py-3 text-slate-800 font-bold outline-none transition-all"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-black text-slate-700 mb-2 ml-1">Role</label>
                                    <select
                                        className="w-full bg-slate-50 border-2 border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 rounded-2xl px-5 py-3 text-slate-800 font-bold outline-none transition-all"
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    >
                                        <option value="Employee">Employee</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-black text-slate-700 mb-2 ml-1">Limit (GB)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border-2 border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 rounded-2xl px-5 py-3 text-slate-800 font-bold outline-none transition-all"
                                        value={newUser.storageLimit}
                                        onChange={(e) => setNewUser({ ...newUser, storageLimit: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-6 px-4 py-4 bg-primary-600 text-white font-extrabold rounded-2xl hover:bg-primary-700 shadow-xl shadow-primary-500/20 transition-all active:scale-95"
                            >
                                Create User
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {isEditModalOpen && editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-slate-800">Edit Employee</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XIcon /></button>
                        </div>
                        <form onSubmit={handleEditUser} className="space-y-5">
                            <div>
                                <label className="block text-sm font-black text-slate-700 mb-2 ml-1">Username</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border-2 border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 rounded-2xl px-5 py-3 text-slate-800 font-bold outline-none transition-all"
                                    value={editingUser.username}
                                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                                    required
                                />
                                <p className="text-[10px] text-slate-400 mt-1 ml-1 font-bold italic opacity-60">Update employee's primary login name</p>
                            </div>
                            <div>
                                <label className="block text-sm font-black text-slate-700 mb-2 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    className="w-full bg-slate-50 border-2 border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 rounded-2xl px-5 py-3 text-slate-800 font-bold outline-none transition-all"
                                    value={editingUser.email}
                                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-black text-slate-700 mb-2 ml-1">Role</label>
                                    <select
                                        className="w-full bg-slate-50 border-2 border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 rounded-2xl px-5 py-3 text-slate-800 font-bold outline-none transition-all"
                                        value={editingUser.role}
                                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                    >
                                        <option value="Employee">Employee</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-black text-slate-700 mb-2 ml-1">Limit (GB)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border-2 border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 rounded-2xl px-5 py-3 text-slate-800 font-bold outline-none transition-all"
                                        value={editingUser.storageLimitInGB}
                                        onChange={(e) => setEditingUser({ ...editingUser, storageLimitInGB: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-6 px-4 py-4 bg-primary-600 text-white font-extrabold rounded-2xl hover:bg-primary-700 shadow-xl shadow-primary-500/20 transition-all active:scale-95"
                            >
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
