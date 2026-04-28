import React, { useState } from 'react';
import api from '../../api/axios';
import { XIcon, FolderPlusIcon } from 'lucide-react';

const CreateFolderModal = ({ isOpen, onClose, parentFolderId, space, onFolderCreated }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            const response = await api.post('/folders', {
                name,
                parentFolderId,
                space
            });
            onFolderCreated(response.data);
            setName('');
            onClose();
        } catch (error) {
            console.error('Error creating folder:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FolderPlusIcon className="text-primary-600" size={24} />
                        New Folder
                    </h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                        <XIcon size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Folder Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            className="w-full bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-2xl px-4 py-3 text-slate-800 transition-all outline-none font-medium"
                            placeholder="Untitled folder"
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateFolderModal;
