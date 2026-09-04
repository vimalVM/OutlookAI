import { useAuth } from '@/lib/AuthContext';
import { User, Mail, Shield, Key } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

export function Settings() {
  const { user } = useAuth();
  const { isDark } = useOutletContext<{ isDark: boolean }>();

  return (
    <div className="w-full pb-10">
      <div className="mb-14">
        <h1 className={`font-headline-xl text-6xl mb-4 ${isDark ? 'text-[#e3e1e9]' : 'text-gray-900'}`}>Settings</h1>
        <p className={`text-sm max-w-xl leading-relaxed ${isDark ? 'text-[#d6c4b0]' : 'text-gray-600'}`}>
          Manage your account details and preferences.
        </p>
      </div>

      <div className="max-w-2xl">
        <div className={`rounded-xl p-8 border mb-8 ${isDark ? 'bg-[#1a1b20] border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h2 className={`font-headline-md text-2xl mb-6 ${isDark ? 'text-[#e3e1e9]' : 'text-gray-900'}`}>Profile Information</h2>
          
          <div className="flex items-center gap-6 mb-8">
            <div className={`h-24 w-24 rounded-full flex items-center justify-center text-[#e8a33d] font-bold text-3xl overflow-hidden border shrink-0 ${isDark ? 'bg-[#2a2b30] border-white/10' : 'bg-gray-100 border-gray-200'}`}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div>
              <button className={`text-sm px-4 py-2 rounded-lg transition-colors border ${isDark ? 'bg-white/5 hover:bg-white/10 text-[#e3e1e9] border-white/10' : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-200'}`}>
                Change Avatar
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className={`flex items-center text-[10px] font-bold tracking-[0.15em] uppercase mb-2 ${isDark ? 'text-[#d6c4b0]' : 'text-gray-500'}`}>
                <User className="h-3 w-3 mr-2" /> Full Name
              </label>
              <input 
                type="text" 
                defaultValue={user?.displayName || ''}
                className={`border rounded-lg px-4 py-3 text-sm w-full outline-none transition-colors ${
                  isDark ? 'bg-[#121318] border-white/5 text-[#e3e1e9] focus:border-[#e8a33d]/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-[#e8a33d]'
                }`}
                readOnly
              />
            </div>

            <div>
              <label className={`flex items-center text-[10px] font-bold tracking-[0.15em] uppercase mb-2 ${isDark ? 'text-[#d6c4b0]' : 'text-gray-500'}`}>
                <Mail className="h-3 w-3 mr-2" /> Email Address
              </label>
              <input 
                type="email" 
                defaultValue={user?.email || ''}
                className={`border rounded-lg px-4 py-3 text-sm w-full outline-none opacity-70 ${
                  isDark ? 'bg-[#121318] border-white/5 text-[#e3e1e9]' : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
                readOnly
              />
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-8 border ${isDark ? 'bg-[#1a1b20] border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h2 className={`font-headline-md text-2xl mb-6 ${isDark ? 'text-[#e3e1e9]' : 'text-gray-900'}`}>Security</h2>
          
          <div className="space-y-4">
            <div className={`flex items-center justify-between p-4 border rounded-lg ${isDark ? 'bg-[#121318] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-[#2f8c6d]" />
                <div>
                  <h4 className={`text-sm font-medium ${isDark ? 'text-[#e3e1e9]' : 'text-gray-900'}`}>Authentication Provider</h4>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-[#d6c4b0]/70' : 'text-gray-500'}`}>You are signed in via {user?.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email/Password'}</p>
                </div>
              </div>
            </div>

            <div className={`flex items-center justify-between p-4 border rounded-lg ${isDark ? 'bg-[#121318] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <Key className={`h-5 w-5 ${isDark ? 'text-[#d6c4b0]' : 'text-gray-400'}`} />
                <div>
                  <h4 className={`text-sm font-medium ${isDark ? 'text-[#e3e1e9]' : 'text-gray-900'}`}>Password</h4>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-[#d6c4b0]/70' : 'text-gray-500'}`}>Change your account password</p>
                </div>
              </div>
              <button className="text-[#e8a33d] text-sm font-medium hover:text-[#ffb956] transition-colors">
                Update
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
