import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import apiService from '../services/apiService';
import { User } from '../types';
import { Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2, Eye, EyeOff, Chrome } from 'lucide-react';
import Logo from './Logo';

interface AuthProps {
  onLogin: (user: User) => void;
}

interface GoogleUser {
  email: string;
  name: string;
  picture?: string;
  sub: string;
}

type AuthMode = 'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD';

interface UserData {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'FORGOT_PASSWORD') {
        const response = await apiService.forgotPassword(email);
        if (response.success) {
          setResetSent(true);
        }
        setLoading(false);
        return;
      }

      if (mode === 'LOGIN') {
        const response = await apiService.login(email, password);
        if (response.success) {
          const loggedInUser: User = {
            id: response.data.user.id.toString(),
            name: response.data.user.name,
            email: response.data.user.email,
            role: response.data.user.role || 'Product Designer',
            avatarUrl: response.data.user.avatar_url,
            joinDate: response.data.user.createdAt
          };
          onLogin(loggedInUser);
        }
        return;
      }

      if (mode === 'SIGNUP') {
        const response = await apiService.register(name, email, password);
        if (response.success) {
          const loggedInUser: User = {
            id: response.data.user.id.toString(),
            name: response.data.user.name,
            email: response.data.user.email,
            role: response.data.user.role || 'Product Designer',
            avatarUrl: response.data.user.avatar_url,
            joinDate: response.data.user.createdAt
          };
          onLogin(loggedInUser);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      
      // If it's a server connection error, provide additional guidance
      if (err.message && err.message.includes('connect to server')) {
        setError('Server connection failed. Please ensure the backend is running on port 3001.');
      }
      
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setResetSent(false);
    setError('');
    // Keep email if entered, clear password
    if (newMode !== 'FORGOT_PASSWORD') {
      setPassword('');
    }
  };

  // Google Login Handler
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError('');
      
      try {
        // Get user info from Google
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`
            }
          }
        );
        
        const userData: GoogleUser = await userInfoResponse.json();
        
        // Try to login/register through our API
        try {
          // Try Google login endpoint first
          const googleResponse = await apiService.googleLogin(userData.email, userData.name, userData.sub, userData.picture);
          if (googleResponse.success) {
            const loggedInUser: User = {
              id: googleResponse.data.user.id.toString(),
              name: googleResponse.data.user.name,
              email: googleResponse.data.user.email,
              role: googleResponse.data.user.role || 'Product Designer',
              avatarUrl: googleResponse.data.user.avatar_url,
              joinDate: googleResponse.data.user.createdAt
            };
            onLogin(loggedInUser);
            return;
          }
        } catch (googleError) {
          // If Google login fails, fall back to localStorage (demo mode)
          console.warn('Google login API failed, using localStorage fallback');
        }
        
        // Fallback to localStorage for demo purposes
        const users: UserData[] = JSON.parse(localStorage.getItem('users') || '[]');
        let existingUser = users.find(u => u.email === userData.email);
        
        if (!existingUser) {
          // Create new user
          existingUser = {
            id: 'u' + Date.now(),
            name: userData.name,
            email: userData.email,
            password: '', // Google users don't have passwords
            createdAt: new Date().toISOString()
          };
          users.push(existingUser);
          localStorage.setItem('users', JSON.stringify(users));
        }
        
        // Login the user
        const loggedInUser: User = {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: 'Product Designer',
          avatarUrl: '/logo.svg',
          joinDate: existingUser.createdAt
        };
        
        onLogin(loggedInUser);
      } catch (err) {
        setError('Failed to authenticate with Google. Please try again.');
        console.error('Google login error:', err);
        
        // If it's a server connection error, provide additional guidance
        if (err instanceof Error && err.message.includes('connect to server')) {
          setError('Server connection failed. Please ensure the backend is running on port 3001.');
        }
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setError('Google login failed. Please try again.');
      setGoogleLoading(false);
    }
  });

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-20 items-center">
        
        {/* Left Column - Branding Only */}
        <div className="hidden lg:flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center">
             <span className="text-7xl font-black tracking-[0.25em] text-slate-900 font-outfit uppercase">
               Task
             </span>
             <span className="text-7xl font-black text-indigo-600 font-outfit mx-2">.</span>
             <span className="text-7xl font-light tracking-[0.25em] text-slate-400 font-outfit uppercase">
               One
             </span>
          </div>
          <div className="text-center pt-8">
             <p className="text-slate-400 font-medium tracking-[0.4em] uppercase text-xs font-outfit">Organize Everything. Effortlessly.</p>
          </div>
        </div>

        {/* Right Column - Authentication Form */}
        <div className="bg-white rounded-lg p-8 w-full max-w-md mx-auto flex flex-col items-center">
          
          {/* Mobile Header with Branding */}
          <div className="lg:hidden text-center mb-10">
            <div className="flex items-center justify-center">
               <span className="text-3xl font-black tracking-[0.15em] text-slate-900 font-outfit uppercase">
                 Task
               </span>
               <span className="text-3xl font-black text-indigo-600 font-outfit mx-1">.</span>
               <span className="text-3xl font-light tracking-[0.15em] text-slate-400 font-outfit uppercase">
                 One
               </span>
            </div>
          </div>
          
          {resetSent ? (
            <div className="text-center py-10 w-full animate-fade-in">
              <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce-subtle">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4 font-outfit uppercase tracking-tight">Check Mail</h2>
              <p className="text-slate-500 mb-8 leading-relaxed max-w-[280px] mx-auto">We've sent a secure reset link to <span className="font-bold text-slate-900">{email}</span>. Please check your inbox.</p>
              <button 
                onClick={() => switchMode('LOGIN')}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/10 transform active:scale-[0.98]"
              >
                Back to Login <ArrowRight size={20} />
              </button>
            </div>
          ) : (
            <>
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight">
                  {mode === 'LOGIN' && 'Sign In'}
                  {mode === 'SIGNUP' && 'Join Us'}
                  {mode === 'FORGOT_PASSWORD' && 'Recover'}
                </h2>
                <p className="text-slate-500 text-sm">
                  {mode === 'LOGIN' && 'Enter your credentials to access your workspace.'}
                  {mode === 'SIGNUP' && 'Start organizing your life in seconds.'}
                  {mode === 'FORGOT_PASSWORD' && 'Enter your email to receive reset instructions.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 w-full max-w-sm">
                
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-2xl flex items-center gap-3 animate-shake">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                )}
                
                {mode === 'SIGNUP' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
                      <input 
                        type="text" 
                        required 
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all text-slate-900 placeholder-slate-300 font-medium"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
                    <input 
                      type="email" 
                      required 
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all text-slate-900 placeholder-slate-300 font-medium"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {mode !== 'FORGOT_PASSWORD' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                       <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                       {mode === 'LOGIN' && (
                         <button 
                           type="button" 
                           onClick={() => switchMode('FORGOT_PASSWORD')} 
                           className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
                         >
                           Forgot?
                         </button>
                       )}
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
                      <input 
                        type={showPassword ? "text" : "password"}
                        required 
                        className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all text-slate-900 placeholder-slate-300 font-medium"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading || !email || (mode !== 'FORGOT_PASSWORD' && !password) || (mode === 'SIGNUP' && !name)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 mt-6 shadow-xl shadow-slate-900/10 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === 'LOGIN' && 'Sign In'}
                      {mode === 'SIGNUP' && 'Create Account'}
                      {mode === 'FORGOT_PASSWORD' && 'Send Link'}
                      {!loading && <ArrowRight size={20} />}
                    </>
                  )}
                </button>

                <div className="my-10 relative">
                  <div className="relative flex items-center py-3">
                    <div className="flex-grow border-t border-slate-100"></div>
                    <span className="flex-shrink mx-4 text-xs font-bold text-slate-300 uppercase tracking-widest bg-white px-2">or continue with</span>
                    <div className="flex-grow border-t border-slate-100"></div>
                  </div>
                </div>
                 
                {/* Google Login Option */}
                <button
                  type="button"
                  onClick={() => handleGoogleLogin()}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-4 border-2 border-slate-100 rounded-2xl text-slate-700 bg-white hover:bg-slate-50 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {googleLoading ? (
                    <div className="w-5 h-5 border-3 border-slate-300 border-t-slate-700 rounded-full animate-spin"></div>
                  ) : (
                    <Chrome size={20} className="text-slate-900" />
                  )}
                  <span>Google Account</span>
                </button>
              </form>
            </>
          )}

          {/* Demo Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400">
    
            </p>
          </div>
           {/* Footer Links */}
        <div className="flex justify-end mt-3">
          {mode === 'LOGIN' && (
            <p className="text-slate-500 text-sm">
              Don't have an account?{' '}
              <button 
                onClick={() => switchMode('SIGNUP')} 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Sign up
              </button>
            </p>
          )}
          {mode === 'SIGNUP' && (
            <p className="text-slate-500 text-sm">
              Already have an account?{' '}
              <button 
                onClick={() => switchMode('LOGIN')} 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Log in
              </button>
            </p>
          )}
          {mode === 'FORGOT_PASSWORD' && !resetSent && (
            <button 
              onClick={() => switchMode('LOGIN')} 
              className="text-slate-500 hover:text-slate-700 text-sm"
            >
              Back to log in
            </button>
          )}
        </div>

        </div>

       
      
      </div>
    </div>
  );
};

export default Auth;