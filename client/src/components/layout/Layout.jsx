import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';

const Layout = () => {
    const { activeSpace } = useAuth();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    return (
        <div className={`flex h-screen w-full overflow-hidden bg-slate-50 space-transition active-space-${activeSpace}`}>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className="flex-1 flex flex-col relative overflow-hidden">
                <Topbar 
                    searchQuery={searchQuery} 
                    setSearchQuery={setSearchQuery} 
                    onMenuClick={() => setIsSidebarOpen(true)} 
                />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet context={{ searchQuery, setSearchQuery }} />
                </main>
            </div>
        </div>
    );
};

export default Layout;
