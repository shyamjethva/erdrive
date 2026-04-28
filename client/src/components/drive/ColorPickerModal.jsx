import React from 'react';
import { XIcon, PaletteIcon } from 'lucide-react';

const colors = [
    { name: 'amber', class: 'bg-amber-400', label: 'Default' },
    { name: 'red', class: 'bg-red-500', label: 'Red' },
    { name: 'green', class: 'bg-emerald-500', label: 'Green' },
    { name: 'blue', class: 'bg-blue-500', label: 'Blue' },
    { name: 'purple', class: 'bg-purple-500', label: 'Purple' },
    { name: 'rose', class: 'bg-rose-500', label: 'Rose' },
    { name: 'indigo', class: 'bg-indigo-500', label: 'Indigo' },
    { name: 'slate', class: 'bg-slate-400', label: 'Slate' },
];

const ColorPickerModal = ({ isOpen, onClose, onSelect, currentColor }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
                        <PaletteIcon size={20} className="text-primary-600" />
                        Folder Color
                    </h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors">
                        <XIcon size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    {colors.map((c) => (
                        <button
                            key={c.name}
                            onClick={() => {
                                onSelect(c.name);
                                onClose();
                            }}
                            className={`group relative flex flex-col items-center gap-2 p-2 rounded-2xl transition-all hover:bg-slate-50 ${currentColor === c.name ? 'bg-slate-50 ring-2 ring-primary-500' : ''}`}
                        >
                            <div className={`w-10 h-10 ${c.class} rounded-xl shadow-sm group-hover:scale-110 transition-transform`} />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{c.label}</span>
                        </button>
                    ))}
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold uppercase tracking-widest hover:bg-slate-200 transition-all text-sm"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default ColorPickerModal;
