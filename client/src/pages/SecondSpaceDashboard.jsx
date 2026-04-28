import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Dashboard from './Dashboard';

const SecondSpaceDashboard = () => {
    const { activeSpace, spaceToken, toggleSpace } = useAuth();

    useEffect(() => {
        if (spaceToken && activeSpace !== 'second') {
            toggleSpace('second');
        }
    }, [spaceToken, activeSpace, toggleSpace]);

    if (!spaceToken) {
        return <Navigate to="/second-space/auth" replace />;
    }

    return (
        <div className="second-space-theme relative min-h-full">
            {/* Second Space Badge */}
            <div className="fixed top-20 right-8 z-[100] animate-in slide-in-from-right duration-500">
                <div className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-200 flex items-center gap-2 border-2 border-white/20 backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Second Space
                </div>
            </div>

            {/* Override styles for indigo theme */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .second-space-theme .text-primary-600 { color: #4f46e5 !important; }
                .second-space-theme .bg-primary-600 { background-color: #4f46e5 !important; }
                .second-space-theme .bg-primary-500 { background-color: #4f46e5 !important; }
                .second-space-theme .bg-primary-50 { background-color: #eef2ff !important; }
                .second-space-theme .border-primary-600 { border-color: #4f46e5 !important; }
                .second-space-theme .shadow-primary-200 { shadow-color: rgba(79, 70, 229, 0.2) !important; }
            `}} />

            <Dashboard />
        </div>
    );
};

export default SecondSpaceDashboard;
