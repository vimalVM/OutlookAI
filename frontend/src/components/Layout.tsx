import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Sidebar } from './Sidebar';
import { Loader2, Bell, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Layout() {
  const { user, loading } = useAuth();
  
  // Basic theme toggle (defaults to dark)
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [isDark]);

  if (loading) {
    return (
      <div className={`h-screen w-screen flex items-center justify-center ${isDark ? 'bg-[#121318]' : 'bg-gray-50'}`}>
        <Loader2 className="h-8 w-8 animate-spin text-[#e8a33d]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden font-body-md transition-colors duration-200 ${isDark ? 'bg-[#121318] text-[#e3e1e9]' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar isDark={isDark} />
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Bar (Search moved to Dashboard) */}
        <header className="h-20 w-full flex items-center justify-end px-8 gap-6 shrink-0 z-20">
          <button 
            onClick={() => setIsDark(!isDark)}
            className={`transition-colors ${isDark ? 'text-[#d6c4b0] hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
            title="Toggle theme"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative z-10 px-8 pb-12">
          <div className="max-w-5xl mx-auto w-full">
            <Outlet context={{ isDark }} />
          </div>
        </div>
      </main>
    </div>
  );
}
