import React, { useState } from 'react';
import { ShieldCheck, Lock, Unlock, X, ShieldAlert, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const SecondSpaceModal = ({ isOpen, onClose, onSuccess }) => {
    const { user, setSecondSpaceMode, setUser } = useAuth();
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const isSetup = !user?.hasSecondSpace;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isSetup) {
                if (pin !== confirmPin) {
                    throw new Error('PINs do not match');
                }
                const res = await api.post('/users/second-space/setup', { pin });
                // Update local user state
                const updatedUser = { ...user, hasSecondSpace: true, secondSpaceRootFolderId: res.data.rootFolderId };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                onSuccess?.();
                onClose();
            } else {
                const res = await api.post('/users/second-space/unlock', { pin });
                setSecondSpaceMode(true);
                onSuccess?.(res.data.secondSpaceRootFolderId);
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Operation failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                >
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSetup ? 'bg-primary-100 text-primary-600' : 'bg-purple-100 text-purple-600'}`}>
                                    {isSetup ? <ShieldCheck size={24} /> : <KeyRound size={24} />}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        {isSetup ? 'Setup Second Space' : 'Unlock Second Space'}
                                    </h2>
                                    <p className="text-slate-500 text-sm">
                                        {isSetup ? 'Secure your private partition with a PIN' : 'Enter PIN to access your private files'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    {isSetup ? 'Enter 4-digit PIN' : 'Your Second Space PIN'}
                                </label>
                                <input
                                    autoFocus
                                    type="password"
                                    maxLength="6"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    placeholder="••••"
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary-500 focus:outline-none transition-all font-mono text-center text-2xl tracking-widest"
                                    required
                                />
                            </div>

                            {isSetup && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Confirm PIN
                                    </label>
                                    <input
                                        type="password"
                                        maxLength="6"
                                        value={confirmPin}
                                        onChange={(e) => setConfirmPin(e.target.value)}
                                        placeholder="••••"
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary-500 focus:outline-none transition-all font-mono text-center text-2xl tracking-widest"
                                        required
                                    />
                                </div>
                            )}

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100"
                                >
                                    <ShieldAlert size={18} />
                                    {error}
                                </motion.div>
                            )}

                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`flex-1 px-6 py-4 rounded-2xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${isSetup ? 'bg-primary-600 hover:bg-primary-700 shadow-primary-200' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'} disabled:opacity-50`}
                                >
                                    {isLoading ? 'Processing...' : isSetup ? 'Initialize' : 'Enter Space'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default SecondSpaceModal;
