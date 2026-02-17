import React, { useState } from 'react';
import { User, Sparkles, ArrowRight, Lock } from 'lucide-react';
import { User as UserType } from '../types';

interface AuthProps {
  onLogin: (user: UserType) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    // 1. Validation Phase (Before Loading)
    if (username === 'Dark' && password === 'darkop') {
        // Valid Admin
    } else {
        let storedUsers = JSON.parse(localStorage.getItem('hara_users') || '{}');
        
        // Migration helper
        if (typeof Object.values(storedUsers)[0] === 'string') {
            const newUsers: any = {};
            Object.entries(storedUsers).forEach(([u, p]) => {
                newUsers[u] = { password: p, isAdmin: false, isSuspended: false };
            });
            storedUsers = newUsers;
            localStorage.setItem('hara_users', JSON.stringify(storedUsers));
        }

        if (isRegister) {
            if (storedUsers[username]) {
                setError('Username already exists');
                return;
            }
            if (username.toLowerCase() === 'dark') {
                setError('This username is reserved.');
                return;
            }
        } else {
            const userData = storedUsers[username];
            if (!userData || userData.password !== password) {
                setError('Invalid credentials');
                return;
            }
            if (userData.isSuspended) {
                setError(`Account Suspended: ${userData.suspendedReason || 'Violation of terms.'}`);
                return;
            }
        }
    }

    // 2. Loading Phase
    setIsLoading(true);

    // 3. Execution Phase (After Delay)
    setTimeout(() => {
        if (username === 'Dark' && password === 'darkop') {
            onLogin({ username: 'Dark', isAdmin: true });
            return;
        }

        const storedUsers = JSON.parse(localStorage.getItem('hara_users') || '{}');

        if (isRegister) {
            storedUsers[username] = {
                password: password,
                isAdmin: false,
                isSuspended: false,
                createdAt: Date.now()
            };
            localStorage.setItem('hara_users', JSON.stringify(storedUsers));
            onLogin({ username });
        } else {
            const userData = storedUsers[username];
            onLogin({ 
                username, 
                isAdmin: userData.isAdmin 
            });
        }
    }, 2500); // Slightly longer for effect
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 transition-colors duration-300">
        <div className="relative">
          <div className="absolute inset-0 bg-hara-500 blur-2xl opacity-40 animate-pulse"></div>
          {/* Logo Animation */}
          <div className="relative bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-zinc-800 animate-bounce-slow">
              <Sparkles className="text-hara-500 w-16 h-16 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-12">
            <div className="w-2.5 h-2.5 bg-hara-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2.5 h-2.5 bg-hara-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2.5 h-2.5 bg-hara-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 transition-colors duration-300">
      {/* Ambient background */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-hara-500/10 dark:bg-hara-900/10 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse-slow"></div>

      <div className="w-full max-w-md bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl transition-all duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-hara-500 blur-lg opacity-40"></div>
            <Sparkles className="relative text-hara-500 w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent mb-2">
            Hara <span className="text-hara-500">AI</span>
          </h1>
          <p className="text-zinc-500 text-sm">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase font-medium tracking-wide">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 text-zinc-400" size={16} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-hara-500/50 focus:ring-1 focus:ring-hara-500/20 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-700"
                placeholder="Enter username"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase font-medium tracking-wide">Password</label>
            <div className="relative">
               <Lock className="absolute left-3 top-3.5 text-zinc-400" size={16} />
               <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-hara-500/50 focus:ring-1 focus:ring-hara-500/20 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-700"
                placeholder="Enter password"
               />
            </div>
          </div>

          {error && (
            <div className="text-red-500 dark:text-red-400 text-xs text-center bg-red-50 dark:bg-red-900/10 py-3 rounded-lg border border-red-200 dark:border-red-900/20 animate-in fade-in slide-in-from-top-1 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-hara-600 hover:bg-hara-500 text-white font-medium py-3 rounded-lg shadow-lg shadow-hara-500/20 dark:shadow-hara-900/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 mt-2"
          >
            {isRegister ? 'Create Account' : 'Enter Hara AI'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-zinc-500 text-sm">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-hara-600 dark:text-hara-400 hover:text-hara-500 dark:hover:text-hara-300 font-medium transition-colors"
            >
              {isRegister ? 'Sign In' : 'Register'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};