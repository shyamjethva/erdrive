import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShieldIcon, KeyIcon, LockIcon, ArrowLeftIcon } from 'lucide-react';

const SecondSpaceAuth = () => {
    const { verifySpacePassword, toggleSpace } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [useMainPassword, setUseMainPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await verifySpacePassword(password, useMainPassword);
            showToast('Second Space Unlocked!', 'success');
            navigate('/second-space');
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.error || 'Authentication failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-slate-50">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-indigo-100 p-8 space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-100 animate-bounce-slow">
                        <ShieldIcon size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Second Space</h1>
                    <p className="text-slate-500">Enter your credentials to access the isolated space</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                {useMainPassword ? <LockIcon size={20} /> : <KeyIcon size={20} />}
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={useMainPassword ? "Enter Main Account Password" : "Enter Second Space PIN"}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all placeholder:text-slate-400"
                                required
                            />
                        </div>

                        <div className="flex items-center gap-3 px-1">
                            <button
                                type="button"
                                onClick={() => setUseMainPassword(!useMainPassword)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${useMainPassword
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                {useMainPassword ? 'Using Main Password' : 'Use Main Password instead'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Verifying...' : 'Unlock Space'}
                    </button>
                </form>

                <div className="pt-4 text-center">
                    <button
                        onClick={() => navigate('/drive')}
                        className="text-slate-400 hover:text-slate-600 text-sm font-medium flex items-center justify-center gap-2 mx-auto transition-colors"
                    >
                        <ArrowLeftIcon size={16} />
                        Back to Main Drive
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SecondSpaceAuth;
