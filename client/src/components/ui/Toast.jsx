import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, InfoIcon, AlertCircleIcon } from 'lucide-react';

const Toast = ({ message, type }) => {
    const icons = {
        success: <CheckCircleIcon className="text-emerald-500" size={18} />,
        error: <XCircleIcon className="text-rose-500" size={18} />,
        info: <InfoIcon className="text-blue-500" size={18} />,
        warning: <AlertCircleIcon className="text-amber-500" size={18} />,
    };

    const bgColors = {
        success: 'bg-emerald-50 border-emerald-100',
        error: 'bg-rose-50 border-rose-100',
        info: 'bg-blue-50 border-blue-100',
        warning: 'bg-amber-50 border-amber-100',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg ${bgColors[type] || bgColors.info} min-w-[200px] pointer-events-auto`}
        >
            {icons[type] || icons.info}
            <span className="text-sm font-bold text-slate-700">{message}</span>
        </motion.div>
    );
};

export default Toast;
