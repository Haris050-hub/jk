import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Database, Trash2, Shield, Activity, Save, RefreshCw, Lock, Unlock, UserPlus, Key, LayoutDashboard, Settings as SettingsIcon } from 'lucide-react';

type Tab = 'dashboard' | 'users' | 'settings';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState({
    userCount: 0,
    sessionCount: 0,
    messageCount: 0,
    storageSize: '0 KB'
  });
  const [users, setUsers] = useState<any[]>([]);
  const [globalKey, setGlobalKey] = useState('');
  
  // Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  // Form State
  const [newUser, setNewUser] = useState({ username: '', password: '', isAdmin: false });
  const [suspendReason, setSuspendReason] = useState('');

  useEffect(() => {
    loadData();
    const key = localStorage.getItem('hara_api_key') || '';
    setGlobalKey(key);
  }, []);

  const loadData = () => {
    let storedUsers = JSON.parse(localStorage.getItem('hara_users') || '{}');
    
    // Migration check (consistency with Auth)
    if (typeof Object.values(storedUsers)[0] === 'string') {
       const newUsers: any = {};
       Object.entries(storedUsers).forEach(([u, p]) => {
           newUsers[u] = { password: p, isAdmin: false, isSuspended: false };
       });
       storedUsers = newUsers;
       localStorage.setItem('hara_users', JSON.stringify(storedUsers));
    }

    const storedSessions = JSON.parse(localStorage.getItem('hara_sessions') || '{}');
    
    // Convert to array for table
    const userList = Object.entries(storedUsers).map(([username, data]: [string, any]) => ({
        username,
        ...data
    }));

    // Calculate Stats
    let totalMessages = 0;
    let totalSessions = 0;
    Object.values(storedSessions).forEach((userSessions: any) => {
      if (Array.isArray(userSessions)) {
        totalSessions += userSessions.length;
        userSessions.forEach((s: any) => {
          if (s.messages) totalMessages += s.messages.length;
        });
      }
    });

    let _lsTotal = 0, _xLen, _x;
    for (_x in localStorage) {
        if (!localStorage.hasOwnProperty(_x)) continue;
        _xLen = ((localStorage[_x].length + _x.length) * 2);
        _lsTotal += _xLen;
    }
    const storageUsed = (_lsTotal / 1024).toFixed(2) + " KB";

    setStats({
      userCount: userList.length,
      sessionCount: totalSessions,
      messageCount: totalMessages,
      storageSize: storageUsed
    });
    setUsers(userList);
  };

  // --- ACTIONS ---

  const handleCreateUser = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newUser.username || !newUser.password) return;

      const storedUsers = JSON.parse(localStorage.getItem('hara_users') || '{}');
      if(storedUsers[newUser.username]) {
          alert("Username exists");
          return;
      }

      storedUsers[newUser.username] = {
          password: newUser.password,
          isAdmin: newUser.isAdmin,
          isSuspended: false,
          createdAt: Date.now()
      };
      localStorage.setItem('hara_users', JSON.stringify(storedUsers));
      setShowUserModal(false);
      setNewUser({ username: '', password: '', isAdmin: false });
      loadData();
  };

  const deleteUser = (username: string) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) {
      const storedUsers = JSON.parse(localStorage.getItem('hara_users') || '{}');
      const storedSessions = JSON.parse(localStorage.getItem('hara_sessions') || '{}');

      delete storedUsers[username];
      delete storedSessions[username];

      localStorage.setItem('hara_users', JSON.stringify(storedUsers));
      localStorage.setItem('hara_sessions', JSON.stringify(storedSessions));
      loadData();
    }
  };

  const openSuspendModal = (username: string) => {
      setSelectedUser(username);
      setSuspendReason('');
      setShowSuspendModal(true);
  };

  const handleSuspend = () => {
      if(!selectedUser) return;
      const storedUsers = JSON.parse(localStorage.getItem('hara_users') || '{}');
      if(storedUsers[selectedUser]) {
          storedUsers[selectedUser].isSuspended = true;
          storedUsers[selectedUser].suspendedReason = suspendReason || "Violation of policies.";
          localStorage.setItem('hara_users', JSON.stringify(storedUsers));
          loadData();
      }
      setShowSuspendModal(false);
  };

  const handleUnsuspend = (username: string) => {
      const storedUsers = JSON.parse(localStorage.getItem('hara_users') || '{}');
      if(storedUsers[username]) {
          storedUsers[username].isSuspended = false;
          storedUsers[username].suspendedReason = null;
          localStorage.setItem('hara_users', JSON.stringify(storedUsers));
          loadData();
      }
  };

  const toggleAdmin = (username: string, currentStatus: boolean) => {
      if(username === 'Dark') return; // Cannot modify Master
      const storedUsers = JSON.parse(localStorage.getItem('hara_users') || '{}');
      if(storedUsers[username]) {
          storedUsers[username].isAdmin = !currentStatus;
          localStorage.setItem('hara_users', JSON.stringify(storedUsers));
          loadData();
      }
  };

  const saveKey = () => {
    localStorage.setItem('hara_api_key', globalKey);
    alert('Global System API Key updated.');
  };

  const clearDatabase = () => {
      if(window.confirm("DANGER: This will delete ALL users and ALL chats. Are you sure?")) {
          if(window.confirm("Really? This is irreversible.")) {
            localStorage.removeItem('hara_users');
            localStorage.removeItem('hara_sessions');
            loadData();
          }
      }
  };

  // --- RENDER HELPERS ---

  const SidebarItem = ({ id, label, icon }: { id: Tab, label: string, icon: any }) => (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex-shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl transition-all font-medium text-xs md:text-sm whitespace-nowrap
            ${activeTab === id 
                ? 'bg-hara-600 text-white shadow-lg shadow-hara-500/20' 
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 md:border-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-400'}
        `}
      >
          {icon}
          <span>{label}</span>
      </button>
  );

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      
      {/* Admin Nav (Horizontal on Mobile, Vertical on Desktop) */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 p-3 md:p-4 flex flex-row md:flex-col gap-2 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm overflow-x-auto shrink-0 scrollbar-hide">
         <div className="hidden md:block px-4 py-4 mb-2">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Admin Panel</h2>
         </div>
         <SidebarItem id="dashboard" label="Dashboard" icon={<LayoutDashboard size={18} />} />
         <SidebarItem id="users" label="Users" icon={<Users size={18} />} />
         <SidebarItem id="settings" label="Settings" icon={<SettingsIcon size={18} />} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
            <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-hara-500/10 rounded-xl border border-hara-500/20">
                        <Activity className="w-8 h-8 text-hara-600 dark:text-hara-500" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={<Users />} label="Total Users" value={stats.userCount.toString()} delay={0} />
                    <StatCard icon={<MessageSquare />} label="Active Chats" value={stats.sessionCount.toString()} delay={100} />
                    <StatCard icon={<Activity />} label="Total Messages" value={stats.messageCount.toString()} delay={200} />
                    <StatCard icon={<Database />} label="Storage Used" value={stats.storageSize} delay={300} />
                </div>
            </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-hara-500/10 rounded-xl border border-hara-500/20">
                            <Users className="w-8 h-8 text-hara-600 dark:text-hara-500" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
                    </div>
                    <button 
                        onClick={() => setShowUserModal(true)}
                        className="w-full md:w-auto bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        <UserPlus size={18} /> <span className="md:hidden">Add User</span><span className="hidden md:inline">Create User</span>
                    </button>
                </div>

                {/* PC VIEW: TABLE */}
                <div className="hidden md:block bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-zinc-500 min-w-[150px]">User</th>
                                    <th className="px-6 py-4 font-semibold text-zinc-500">Role</th>
                                    <th className="px-6 py-4 font-semibold text-zinc-500">Status</th>
                                    <th className="px-6 py-4 font-semibold text-zinc-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {users.map((u) => (
                                    <tr key={u.username} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center text-xs font-bold">
                                                    {u.username.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-medium">{u.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {u.username === 'Dark' ? (
                                                <span className="text-[10px] bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full border border-purple-500/20 font-bold">MASTER</span>
                                            ) : u.isAdmin ? (
                                                <span className="text-[10px] bg-hara-500/10 text-hara-600 px-2 py-0.5 rounded-full border border-hara-500/20 font-bold">ADMIN</span>
                                            ) : (
                                                <span className="text-zinc-500">User</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {u.isSuspended ? (
                                                <div className="flex flex-col">
                                                    <span className="text-red-500 font-medium flex items-center gap-1"><Lock size={12}/> Suspended</span>
                                                    <span className="text-[10px] text-zinc-400 max-w-[150px] truncate" title={u.suspendedReason}>{u.suspendedReason}</span>
                                                </div>
                                            ) : (
                                                <span className="text-green-500 flex items-center gap-1"><Shield size={12}/> Active</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {u.username !== 'Dark' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Promote Toggle */}
                                                    <button 
                                                        onClick={() => toggleAdmin(u.username, u.isAdmin)}
                                                        className={`p-2 rounded-lg transition-colors ${u.isAdmin ? 'text-purple-500 bg-purple-500/10' : 'text-zinc-400 hover:text-purple-500 hover:bg-purple-500/10'}`}
                                                        title={u.isAdmin ? "Demote to User" : "Promote to Admin"}
                                                    >
                                                        <Shield size={16} />
                                                    </button>

                                                    {/* Suspend/Unsuspend */}
                                                    {u.isSuspended ? (
                                                        <button 
                                                            onClick={() => handleUnsuspend(u.username)}
                                                            className="p-2 text-green-500 bg-green-500/10 rounded-lg hover:bg-green-500/20"
                                                            title="Unsuspend User"
                                                        >
                                                            <Unlock size={16} />
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => openSuspendModal(u.username)}
                                                            className="p-2 text-zinc-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg"
                                                            title="Suspend User"
                                                        >
                                                            <Lock size={16} />
                                                        </button>
                                                    )}
                                                    
                                                    {/* Delete */}
                                                    <button 
                                                        onClick={() => deleteUser(u.username)}
                                                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MOBILE VIEW: CARDS */}
                <div className="md:hidden space-y-3">
                   {users.map((u) => (
                      <div key={u.username} className="bg-white dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                          <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800/50 pb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center text-sm font-bold">
                                    {u.username.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-semibold">{u.username}</div>
                                    <div className="text-xs text-zinc-500">
                                      {u.username === 'Dark' ? 'Master' : (u.isAdmin ? 'Admin' : 'User')}
                                    </div>
                                </div>
                              </div>
                               {u.username === 'Dark' ? (
                                    <span className="text-[10px] bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full border border-purple-500/20 font-bold">MASTER</span>
                                ) : u.isAdmin ? (
                                    <span className="text-[10px] bg-hara-500/10 text-hara-600 px-2 py-0.5 rounded-full border border-hara-500/20 font-bold">ADMIN</span>
                                ) : (
                                    <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">USER</span>
                                )}
                          </div>

                          <div className="flex items-center justify-between mb-4">
                              <span className="text-sm text-zinc-500">Status</span>
                                {u.isSuspended ? (
                                    <span className="text-red-500 text-sm font-medium flex items-center gap-1 bg-red-50 dark:bg-red-900/10 px-2 py-1 rounded"><Lock size={12}/> Suspended</span>
                                ) : (
                                    <span className="text-green-500 text-sm font-medium flex items-center gap-1 bg-green-50 dark:bg-green-900/10 px-2 py-1 rounded"><Shield size={12}/> Active</span>
                                )}
                          </div>

                          {u.isSuspended && (
                              <div className="mb-4 text-xs text-red-400 bg-red-50 dark:bg-red-900/10 p-2 rounded">
                                  Reason: {u.suspendedReason}
                              </div>
                          )}

                          {u.username !== 'Dark' && (
                              <div className="grid grid-cols-3 gap-2">
                                  <button 
                                      onClick={() => toggleAdmin(u.username, u.isAdmin)}
                                      className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors border
                                        ${u.isAdmin 
                                            ? 'bg-purple-50 dark:bg-purple-900/10 text-purple-600 border-purple-200 dark:border-purple-800' 
                                            : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'}
                                      `}
                                  >
                                      <Shield size={16} />
                                      {u.isAdmin ? 'Demote' : 'Promote'}
                                  </button>

                                   {u.isSuspended ? (
                                        <button 
                                            onClick={() => handleUnsuspend(u.username)}
                                            className="p-2 rounded-lg flex flex-col items-center justify-center gap-1 text-xs font-medium bg-green-50 dark:bg-green-900/10 text-green-600 border border-green-200 dark:border-green-800"
                                        >
                                            <Unlock size={16} />
                                            Unsuspend
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => openSuspendModal(u.username)}
                                            className="p-2 rounded-lg flex flex-col items-center justify-center gap-1 text-xs font-medium bg-orange-50 dark:bg-orange-900/10 text-orange-600 border border-orange-200 dark:border-orange-800"
                                        >
                                            <Lock size={16} />
                                            Suspend
                                        </button>
                                    )}

                                  <button 
                                      onClick={() => deleteUser(u.username)}
                                      className="p-2 rounded-lg flex flex-col items-center justify-center gap-1 text-xs font-medium bg-red-50 dark:bg-red-900/10 text-red-600 border border-red-200 dark:border-red-800"
                                  >
                                      <Trash2 size={16} />
                                      Delete
                                  </button>
                              </div>
                          )}
                      </div>
                   ))}
                </div>
            </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-hara-500/10 rounded-xl border border-hara-500/20">
                        <SettingsIcon className="w-8 h-8 text-hara-600 dark:text-hara-500" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold">System Settings</h1>
                </div>
                
                 {/* API Key Config */}
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-hara-600 dark:text-hara-500">
                        <Key size={24} />
                        <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">Global API Key</h3>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                        This key will be used for all users who do not provide their own. It is essential for the application to function if individual users are not supplying keys.
                    </p>
                    <div className="space-y-3">
                    <input 
                        type="password" 
                        value={globalKey}
                        onChange={(e) => setGlobalKey(e.target.value)}
                        placeholder="sk-or-... or AIza..."
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-3 text-sm focus:ring-1 focus:ring-hara-500 focus:border-hara-500 outline-none"
                    />
                    <button 
                        onClick={saveKey}
                        className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        <Save size={16} /> Save Configuration
                    </button>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50 dark:bg-red-950/10 rounded-2xl border border-red-200 dark:border-red-900/30 p-6">
                    <h3 className="font-semibold text-lg text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
                    <p className="text-sm text-red-500/80 dark:text-red-400/70 mb-4">
                        Resetting the database will wipe all user accounts, chat history, and settings. This action is irreversible.
                    </p>
                    <button 
                        onClick={clearDatabase}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                        <Trash2 size={16} /> Reset Entire Database
                    </button>
                </div>
            </div>
        )}

      </div>

      {/* --- MODALS --- */}

      {/* Create User Modal */}
      {showUserModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
                  <h3 className="text-xl font-bold mb-4">Create New User</h3>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-zinc-500 uppercase">Username</label>
                          <input 
                            type="text" 
                            className="w-full mt-1 p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                            value={newUser.username}
                            onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                            required
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-zinc-500 uppercase">Password</label>
                          <input 
                            type="password" 
                            className="w-full mt-1 p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                            value={newUser.password}
                            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                            required
                          />
                      </div>
                      <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            id="isAdmin"
                            checked={newUser.isAdmin}
                            onChange={(e) => setNewUser({...newUser, isAdmin: e.target.checked})}
                          />
                          <label htmlFor="isAdmin" className="text-sm">Grant Admin Privileges</label>
                      </div>
                      <div className="flex gap-2 pt-4">
                          <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</button>
                          <button type="submit" className="flex-1 p-2 rounded-lg bg-hara-600 text-white hover:bg-hara-500">Create</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && (
           <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
                  <h3 className="text-xl font-bold mb-2 text-red-500">Suspend User</h3>
                  <p className="text-sm text-zinc-500 mb-4">Why are you suspending {selectedUser}?</p>
                  <textarea 
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm min-h-[100px]"
                    placeholder="Reason for suspension..."
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                  />
                  <div className="flex gap-2 pt-4">
                        <button onClick={() => setShowSuspendModal(false)} className="flex-1 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</button>
                        <button onClick={handleSuspend} className="flex-1 p-2 rounded-lg bg-red-600 text-white hover:bg-red-500">Suspend</button>
                   </div>
              </div>
           </div>
      )}

    </div>
  );
};

const StatCard = ({ icon, label, value, delay }: { icon: any, label: string, value: string, delay: number }) => (
  <div 
    className="bg-white dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center gap-4">
      <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500 dark:text-zinc-400">
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div>
        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</div>
        <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</div>
      </div>
    </div>
  </div>
);
