
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, LogOut, Search, Trash2, LogIn, TrendingUp, ShieldCheck, Server } from 'lucide-react';

interface SuperAdminDashboardProps {
    onLogout: () => void;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onLogout }) => {
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const storedUsers = localStorage.getItem('zbling_users');
        if (storedUsers) {
            setUsers(JSON.parse(storedUsers));
        }
    }, []);

    const handleDeleteUser = (email: string) => {
        if (confirm(`Are you sure you want to delete the salon account: ${email}? This action is irreversible.`)) {
            const updatedUsers = users.filter(u => u.email !== email);
            setUsers(updatedUsers);
            localStorage.setItem('zbling_users', JSON.stringify(updatedUsers));
        }
    };

    const handleImpersonate = (user: any) => {
        if (confirm(`Login as ${user.salonName || user.email}?`)) {
            localStorage.setItem('zbling_current_user', JSON.stringify(user));
            // Reload to trigger app re-render with new user
            window.location.reload();
        }
    };

    const filteredUsers = users.filter(u => 
        u.email.toLowerCase().includes(search.toLowerCase()) || 
        (u.salonName && u.salonName.toLowerCase().includes(search.toLowerCase()))
    );

    const totalRevenue = users.length * 1499; // Mock MRR based on Pro plan

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-10">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <ShieldCheck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl tracking-tight text-white">Z Bling <span className="text-blue-500">Admin</span></h1>
                        <p className="text-xs text-slate-500 font-mono">SUPER_ADMIN</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800 text-blue-400 rounded-xl font-bold transition-colors">
                        <LayoutDashboard size={20} /> Dashboard
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl font-bold transition-colors">
                        <Server size={20} /> System Logs
                    </button>
                </nav>

                <button 
                    onClick={onLogout}
                    className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-950/30 rounded-xl font-bold transition-colors mt-auto"
                >
                    <LogOut size={20} /> Logout
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
                    <h2 className="font-bold text-lg">Platform Overview</h2>
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center font-bold text-sm">SA</div>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto space-y-8">
                    
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><Users size={24}/></div>
                                <span className="text-xs font-bold bg-green-500/10 text-green-400 px-2 py-1 rounded">+12%</span>
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-1">{users.length}</h3>
                            <p className="text-slate-400 text-sm font-medium">Active Salons</p>
                        </div>
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400"><TrendingUp size={24}/></div>
                                <span className="text-xs font-bold bg-green-500/10 text-green-400 px-2 py-1 rounded">+5%</span>
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-1">₹{totalRevenue.toLocaleString()}</h3>
                            <p className="text-slate-400 text-sm font-medium">Monthly Recurring Revenue (Est)</p>
                        </div>
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400"><Server size={24}/></div>
                                <span className="text-xs font-bold bg-green-500/10 text-green-400 px-2 py-1 rounded">Healthy</span>
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-1">99.9%</h3>
                            <p className="text-slate-400 text-sm font-medium">System Uptime</p>
                        </div>
                    </div>

                    {/* Tenant Table */}
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Registered Salons</h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-500" size={16}/>
                                <input 
                                    className="bg-slate-900 border border-slate-600 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                    placeholder="Search email or name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="p-4">Salon Name</th>
                                        <th className="p-4">Owner Email</th>
                                        <th className="p-4">Plan</th>
                                        <th className="p-4">Joined Date</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700 text-sm">
                                    {filteredUsers.map((user, idx) => (
                                        <tr key={idx} className="hover:bg-slate-700/50 transition">
                                            <td className="p-4 font-bold text-white">{user.salonName || 'Unknown Salon'}</td>
                                            <td className="p-4 text-slate-300">{user.email}</td>
                                            <td className="p-4"><span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs font-bold">PRO</span></td>
                                            <td className="p-4 text-slate-400">{user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'N/A'}</td>
                                            <td className="p-4 text-right flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleImpersonate(user)}
                                                    className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition" 
                                                    title="Login as Salon"
                                                >
                                                    <LogIn size={16}/>
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteUser(user.email)}
                                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition" 
                                                    title="Delete Salon"
                                                >
                                                    <Trash2 size={16}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-slate-500">No salons found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SuperAdminDashboard;
