import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = () => {
    const [searchQuery, setSearchQuery] = React.useState('');

    return (
        <div className="flex h-screen w-full overflow-hidden bg-slate-50">
            <Sidebar />
            <div className="flex-1 flex flex-col relative overflow-hidden">
                <Topbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                <main className="flex-1 overflow-y-auto p-8">
                    <Outlet context={{ searchQuery, setSearchQuery }} />
                </main>
            </div>
        </div>
    );
};

export default Layout;
