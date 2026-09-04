import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { logoutUser } from '@/lib/firebase';
import { LayoutDashboard, Globe, ClipboardList, Settings, LogOut } from 'lucide-react';

export function Sidebar({ isDark = true }: { isDark?: boolean }) {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, path: '/dashboard' },
    { name: 'Domain Selection', icon: <Globe className="h-4 w-4" />, path: '/' },
    { name: 'Past Reports', icon: <ClipboardList className="h-4 w-4" />, path: '/history' },
    { name: 'Settings', icon: <Settings className="h-4 w-4" />, path: '/settings' },
  ];

  return (
    <aside className={`w-[260px] h-full flex flex-col font-body-md shrink-0 border-r transition-colors ${isDark ? 'bg-[#16171a] border-white/5' : 'bg-white border-gray-200'}`}>
      
      {/* Top Logo Area */}
      <div className="p-8 pb-10">
        <Link to="/" className="flex items-center gap-3">
          <div className={`w-8 h-6 rounded flex items-center justify-center overflow-hidden ${isDark ? 'bg-[#d6c4b0]/10' : 'bg-transparent'}`}>
            <img 
              src="/logo.jpg" 
              alt="Outlook Logo" 
              className={`w-full h-full object-cover ${isDark ? 'mix-blend-screen' : 'filter invert grayscale mix-blend-multiply'}`} 
            />
          </div>
          <span className={`font-headline-md text-xl tracking-wide font-bold leading-none mt-1 ${isDark ? 'text-[#e3e1e9]' : 'text-gray-900'}`}>Outlook</span>
        </Link>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 px-4 py-2 space-y-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '');
          
          return (
            <Link 
              key={item.name}
              to={item.path} 
              className={`flex items-center gap-3 px-4 py-3.5 rounded-lg text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-[#0b5c46] text-white shadow-sm' 
                  : isDark 
                    ? 'text-[#d6c4b0] hover:text-[#e3e1e9] hover:bg-white/5' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {item.icon}
              <span className={isActive ? '' : 'opacity-90'}>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* User Profile */}
      <div className="p-4 mb-4">
        <div className={`flex items-center justify-between px-2 py-3 rounded-xl transition-colors cursor-pointer group ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-[#e8a33d] font-bold overflow-hidden border shrink-0 ${isDark ? 'bg-[#2a2b30] border-white/10' : 'bg-gray-100 border-gray-200'}`}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div className="flex-1 overflow-hidden min-w-0">
              <p className={`text-sm font-bold truncate ${isDark ? 'text-[#e3e1e9]' : 'text-gray-900'}`}>{user?.displayName || 'Profile'}</p>
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.preventDefault();
              logoutUser();
            }}
            className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${isDark ? 'text-[#d6c4b0] hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
            title="Sign Out"
          >
            <LogOut className="h-4 w-4 shrink-0" />
          </button>
        </div>
      </div>
    </aside>
  );
}
