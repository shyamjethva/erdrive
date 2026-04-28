import React from 'react';
import { ChevronRightIcon, HomeIcon } from 'lucide-react';

const Breadcrumbs = ({ path, onNavigate }) => {
    return (
        <nav className="flex items-center gap-2 text-slate-500 mb-8 overflow-x-auto no-scrollbar py-2">
            <button
                onClick={() => onNavigate('root')}
                className="flex items-center gap-1 hover:text-primary-600 transition-colors whitespace-nowrap"
            >
                <HomeIcon size={18} />
                <span className="font-medium">My Drive</span>
            </button>

            {path.map((folder, index) => (
                <React.Fragment key={folder._id}>
                    <ChevronRightIcon size={16} className="text-slate-300" />
                    <button
                        onClick={() => onNavigate(folder._id)}
                        className={`font-medium hover:text-primary-600 transition-colors whitespace-nowrap ${index === path.length - 1 ? 'text-slate-800 pointer-events-none' : ''
                            }`}
                    >
                        {folder.name}
                    </button>
                </React.Fragment>
            ))}
        </nav>
    );
};

export default Breadcrumbs;
