import React from 'react';
import { ShieldAlertIcon } from 'lucide-react';

const Spam = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[70vh] bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[3rem] p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6">
                <ShieldAlertIcon size={40} className="text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-800">Spam folder is empty</h3>
            <p className="text-slate-400 font-bold mt-2 max-w-sm">
                Files detected as spam will appear here. Currently, your drive is clean!
            </p>
        </div>
    );
};

export default Spam;
