import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LayersIcon, ShieldCheckIcon, LogOutIcon } from 'lucide-react';

const SpaceTransitionOverlay = () => {
    const { activeSpace } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState('entering'); // 'entering' or 'leaving'
    const prevSpaceRef = useRef(activeSpace);

    useEffect(() => {
        if (prevSpaceRef.current !== activeSpace) {
            const isEntering = activeSpace === 'second';
            setType(isEntering ? 'entering' : 'leaving');
            setMessage(isEntering ? 'Entering Second Space...' : 'Returning to Main Drive...');
            setIsVisible(true);

            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 1500);

            prevSpaceRef.current = activeSpace;
            return () => clearTimeout(timer);
        }
    }, [activeSpace]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-6 animate-in zoom-in slide-in-from-bottom-10 duration-500">
                <div className={`p-6 rounded-[2rem] shadow-2xl ${type === 'entering' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-white'}`}>
                    {type === 'entering' ? (
                        <ShieldCheckIcon size={48} className="animate-pulse" />
                    ) : (
                        <LogOutIcon size={48} />
                    )}
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        {message}
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">
                        Please wait while we switch environments
                    </p>
                </div>

                {/* Progress bar simulation */}
                <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-4">
                    <div className={`h-full transition-all duration-[1500ms] ease-out w-full ${type === 'entering' ? 'bg-indigo-500' : 'bg-slate-500'}`} />
                </div>
            </div>
        </div>
    );
};

export default SpaceTransitionOverlay;
