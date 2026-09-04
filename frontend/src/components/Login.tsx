import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { loginWithGoogle, loginWithEmail, registerWithEmail, updateUserProfile } from '@/lib/firebase';
import { useState } from 'react';

export function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !fullName)) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      if (isSignUp) {
        const userCredential = await registerWithEmail(email, password);
        await updateUserProfile(userCredential.user, fullName);
      } else {
        await loginWithEmail(email, password);
      }
      
      navigate('/');
    } catch (err: any) {
      // Generic error messages to prevent user enumeration
      if (isSignUp) {
        // For registration, show specific errors (weak password, email already in use)
        const msg = err.message.replace('Firebase: ', '').replace(/\(auth.*\)/, '').trim();
        setError(msg || 'Registration failed. Please try again.');
      } else {
        // For login, always show generic message to prevent user enumeration
        setError('Invalid email or password. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#121318] flex items-center justify-center p-6 font-body-md">
      <div className="w-full max-w-[1000px] flex flex-col md:flex-row items-center justify-between gap-16 md:gap-8">
        
        {/* Left Side: Typography */}
        <div className="flex-1 flex flex-col items-start w-full max-w-[400px]">
          {isSignUp ? (
            <>
              <div className="mb-4">
                <span className="text-[#d6c4b0] tracking-[0.2em] text-[10px] uppercase font-bold border-l-2 border-[#e8a33d] pl-3 py-1">Join the Elite</span>
              </div>
              <div className="font-headline-xl text-5xl md:text-[56px] leading-[1.1] tracking-tight mb-4">
                <div className="text-[#e3e1e9]">Begin your</div>
                <div className="text-[#e8a33d] italic">journey.</div>
              </div>
              <p className="text-[#d6c4b0] text-sm leading-relaxed max-w-[280px]">
                Join a community of professionals mastering the art of the interview.
              </p>
              <div className="mt-8 flex items-center text-[#d6c4b0] text-xs">
                <svg className="w-4 h-4 text-[#e8a33d] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                No credit card required to start.
              </div>
            </>
          ) : (
            <>
              <div className="font-headline-xl text-5xl md:text-[64px] leading-[1.1] tracking-tight mb-8">
                <div className="text-[#e3e1e9]">Focus.</div>
                <div className="text-[#e3e1e9]">Clarity.</div>
                <div className="text-[#e8a33d]">Insight.</div>
              </div>
              <p className="text-[#d6c4b0] text-sm leading-relaxed max-w-[280px]">
                Elevate your interview preparation with intelligent coaching that adapts to your unique communication style.
              </p>
            </>
          )}
        </div>

        {/* Right Side: Card */}
        <div className="w-full max-w-[420px] bg-[#1a1b20] rounded-2xl p-10 shadow-2xl border border-white/5 relative">
          
          <h2 className="font-headline-lg text-[32px] text-[#e3e1e9] mb-1 leading-tight">
            {isSignUp ? 'Create Account' : 'Welcome back.'}
          </h2>
          <p className="text-[#d6c4b0] text-sm mb-8">
            {isSignUp ? 'Enter your details to get started.' : 'Your next breakthrough is one session away.'}
          </p>

          {error && (
            <div className="w-full p-3 mb-6 rounded bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="block text-[10px] font-bold tracking-[0.15em] text-[#d6c4b0] uppercase mb-2">
                  Full Name
                </label>
                <div className="flex items-center bg-[#121318] border border-white/5 rounded-lg px-4 py-3.5 focus-within:border-[#e8a33d]/50 transition-colors">
                  <input 
                    type="text" 
                    placeholder="Jane Doe" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm w-full text-[#e3e1e9] placeholder:text-[#d6c4b0]/30"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold tracking-[0.15em] text-[#d6c4b0] uppercase mb-2">
                Email Address
              </label>
              <div className="flex items-center bg-[#121318] border border-white/5 rounded-lg px-4 py-3.5 focus-within:border-[#e8a33d]/50 transition-colors">
                <input 
                  type="email" 
                  placeholder="coach@outlook.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-full text-[#e3e1e9] placeholder:text-[#d6c4b0]/30"
                  required 
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-bold tracking-[0.15em] text-[#d6c4b0] uppercase">
                  Password
                </label>
                {!isSignUp && (
                  <a href="#" className="text-[10px] font-bold text-[#d6c4b0] hover:text-[#e8a33d] transition-colors">
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="flex items-center bg-[#121318] border border-white/5 rounded-lg px-4 py-3.5 focus-within:border-[#e8a33d]/50 transition-colors">
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-full text-[#e3e1e9] placeholder:text-[#d6c4b0]/30 tracking-widest"
                  required 
                  minLength={6}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#ffb956] hover:bg-[#e8a33d] text-[#121318] font-medium text-sm py-3.5 rounded-lg mt-2 flex items-center justify-center transition-colors disabled:opacity-70"
            >
              {loading ? 'Processing...' : (
                <>{isSignUp ? 'Create Account' : 'Sign In'} <span className="ml-2">→</span></>
              )}
            </button>
          </form>

          <div className="relative flex items-center py-6 mt-2">
            <div className="flex-grow border-t border-outline/10"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-label-caps text-outline">OR</span>
            <div className="flex-grow border-t border-outline/10"></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-[#121318] border border-white/10 hover:border-[#e8a33d]/50 text-[#e3e1e9] font-medium text-sm py-3.5 rounded-lg flex items-center justify-center transition-colors disabled:opacity-70"
          >
            <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="mt-8 text-center text-xs text-[#d6c4b0]">
            {isSignUp ? (
              <>Already have an account? <button onClick={() => setIsSignUp(false)} type="button" className="text-[#ffb956] font-medium ml-1 hover:text-[#e8a33d] transition-colors">Sign In</button></>
            ) : (
              <>Don't have an account? <button onClick={() => setIsSignUp(true)} type="button" className="text-[#ffb956] font-medium ml-1 hover:text-[#e8a33d] transition-colors">Create an account</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
