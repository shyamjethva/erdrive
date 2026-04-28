import React, { useState } from 'react';
import { Lock, Unlock, X, ShieldAlert, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SpacePasswordModal = ({ isOpen, onClose, onSubmit, mode = 'unlock' }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (mode === 'init' && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            await onSubmit(password);
            setPassword('');
            setConfirmPassword('');
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid password or verification failed');
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
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${mode === 'init' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
                                    }`}>
                                    {mode === 'init' ? <Layers size={24} /> : <Lock size={24} />}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        {mode === 'init' ? 'Setup Second Space' : 'Enter Second Space'}
                                    </h2>
                                    <p className="text-slate-500 text-sm">
                                        {mode === 'init' ? 'Create a secure password' : 'Enter your security password'}
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
                                    {mode === 'init' ? 'Set Space Password' : 'Password'}
                                </label>
                                <div className="relative">
                                    <input
                                        autoFocus
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:outline-none transition-all font-mono"
                                        required
                                    />
                                </div>
                                {mode === 'init' && (
                                    <>
                                        <label className="block text-sm font-bold text-slate-700 mt-6 mb-2">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:outline-none transition-all font-mono"
                                                required
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-slate-400">
                                            Note: This password is required to switch to your isolated secondary environment.
                                        </p>
                                    </>
                                )}
                            </div>

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
                                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all border-2 border-transparent"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`flex-1 px-6 py-4 rounded-2xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${mode === 'init'
                                        ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                                        : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                                        } disabled:opacity-50`}
                                >
                                    {isLoading ? 'Processing...' : mode === 'init' ? 'Initialize Space' : 'Verify & Enter'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default SpacePasswordModal;
