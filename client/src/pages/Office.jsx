import React from 'react';
import { 
    Building2Icon, 
    UsersIcon, 
    BriefcaseIcon, 
    CpuIcon, 
    RocketIcon, 
    ShieldCheckIcon,
    TerminalIcon,
    LayoutDashboardIcon,
    Code2Icon,
    WorkflowIcon
} from 'lucide-react';

const Office = () => {
    return (
        <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-200">
                            <Building2Icon size={28} />
                        </div>
                        Office HQ
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium max-w-lg">
                        Manage organization structure, oversee development projects, and monitor infrastructure health.
                    </p>
                </div>
                
                <div className="flex bg-white p-2 rounded-2xl border shadow-sm items-center gap-4">
                    <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-bold text-slate-700">Operational</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Office Structure Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-1 rounded-full bg-primary-500" />
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Office Structure</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all duration-300">
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                            <UsersIcon size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Departments</h3>
                        <p className="text-sm text-slate-500 leading-relaxed mb-4">
                            Organized by Development, Design, QA, and Marketing teams.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {['Engineering', 'Product', 'HR'].map(tag => (
                                <span key={tag} className="px-3 py-1 bg-slate-50 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-tight">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all duration-300">
                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                            <BriefcaseIcon size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Management</h3>
                        <p className="text-sm text-slate-500 leading-relaxed mb-4">
                            Executive leadership and operational managers oversight.
                        </p>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full w-[85%]" />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Efficiency: 85%</p>
                    </div>

                    <div className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all duration-300">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                            <ShieldCheckIcon size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Infrastructure</h3>
                        <p className="text-sm text-slate-500 leading-relaxed mb-4">
                            Secure server rooms and internal network administration.
                        </p>
                        <div className="flex items-center gap-2 text-emerald-600">
                            <CpuIcon size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Active nodes: 12</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Development Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-1 rounded-full bg-indigo-500" />
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Development Activity</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <Code2Icon size={120} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                    <RocketIcon size={20} className="text-indigo-400" />
                                </div>
                                <h3 className="text-xl font-black">Active Projects</h3>
                            </div>
                            
                            <div className="space-y-6">
                                {[
                                    { name: 'ER Drive Cloud', progress: 75, lang: 'React + Node' },
                                    { name: 'CRM Integration', progress: 40, lang: 'Next.js' },
                                    { name: 'Admin Console 2.0', progress: 95, lang: 'TypeScript' }
                                ].map((project, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="font-bold text-sm text-indigo-400">{project.lang}</p>
                                                <p className="font-bold">{project.name}</p>
                                            </div>
                                            <span className="text-xs font-black text-slate-400">{project.progress}%</span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-indigo-500 rounded-full transition-all duration-1000 delay-300"
                                                style={{ width: `${project.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                                    <TerminalIcon size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Deployment Feed</h3>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Updates</span>
                        </div>

                        <div className="space-y-6">
                            {[
                                { action: 'Merged PR #124', time: '12m ago', icon: WorkflowIcon, color: 'text-purple-500' },
                                { action: 'Updated index.html', time: '45m ago', icon: LayoutDashboardIcon, color: 'text-blue-500' },
                                { action: 'Server health check passed', time: '1h ago', icon: ShieldCheckIcon, color: 'text-emerald-500' },
                                { action: 'New team member added', time: '3h ago', icon: UsersIcon, color: 'text-amber-500' }
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between group cursor-default">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 ${item.color} group-hover:scale-110 transition-transform`}>
                                            <item.icon size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">{item.action}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{item.time}</p>
                                        </div>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-primary-500 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Office;
