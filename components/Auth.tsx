import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { User } from '../types';
import { Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2, Eye, EyeOff, Chrome } from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API delay
    setTimeout(() => {
      try {
        if (mode === 'FORGOT_PASSWORD') {
          // Validate email exists
          const users: UserData[] = JSON.parse(localStorage.getItem('users') || '[]');
          const userExists = users.some(u => u.email === email);
          
          if (!userExists) {
            setError('No account found with this email address.');
            setLoading(false);
            return;
          }
          
          setResetSent(true);
          setLoading(false);
          return;
        }

        if (mode === 'LOGIN') {
          // Authenticate user
          const users: UserData[] = JSON.parse(localStorage.getItem('users') || '[]');
          const user = users.find(u => u.email === email && u.password === password);
          
          if (!user) {
            setError('Invalid email or password.');
            setLoading(false);
            return;
          }

          // Convert to User type
          const loggedInUser: User = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: 'Product Designer',
            joinDate: user.createdAt
          };
          
          onLogin(loggedInUser);
          return;
        }

        if (mode === 'SIGNUP') {
          // Check if email already exists
          const users: UserData[] = JSON.parse(localStorage.getItem('users') || '[]');
          if (users.some(u => u.email === email)) {
            setError('An account with this email already exists.');
            setLoading(false);
            return;
          }

          // Create new user
          const newUser: UserData = {
            id: 'u' + Date.now(),
            name,
            email,
            password,
            createdAt: new Date().toISOString()
          };

          // Save user
          users.push(newUser);
          localStorage.setItem('users', JSON.stringify(users));

          // Auto-login
          const loggedInUser: User = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: 'Product Designer',
            joinDate: newUser.createdAt
          };
          
          onLogin(loggedInUser);
        }
      } catch (err) {
        setError('Something went wrong. Please try again.');
        setLoading(false);
      }
    }, 1500);
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
        
        // Check if user exists in our system
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
          joinDate: existingUser.createdAt
        };
        
        onLogin(loggedInUser);
      } catch (err) {
        setError('Failed to authenticate with Google. Please try again.');
        console.error('Google login error:', err);
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
        
        {/* Left Column - Logo Only */}
        <div className="hidden lg:flex flex-col items-center justify-center space-y-4">
          <img 
            src="/logo.png" 
            alt="tasq.one logo" 
            className="w-60 h-55 object-contain" 
            onError={(e) => {
              console.error('Logo failed to load:', e);
              e.currentTarget.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'text-5xl font-bold text-slate-900';
              fallback.textContent = 'T';
              e.currentTarget.parentNode?.appendChild(fallback);
            }}
          />
          <div className="text-center">
            <p className="text-slate-600 text-base font-light max-w-xs mt-2">
              Smart task management for focused productivity
            </p>
          </div>
        </div>

        {/* Right Column - Authentication Form */}
        <div className="bg-white rounded-lg p-8 w-full max-w-md mx-auto flex flex-col items-center">
          
          {/* Mobile Header with Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex flex-col items-center space-y-3">
              <img 
                src="/logo.png" 
                alt="tasq.one logo" 
                className="w-25 h-20 object-contain" 
                onError={(e) => {
                  console.error('Logo failed to load:', e);
                  e.currentTarget.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'text-2xl font-bold text-slate-900';
                  fallback.textContent = 'T';
                  e.currentTarget.parentNode?.appendChild(fallback);
                }}
              />
              
            </div>
          </div>
          
          {resetSent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Check your email</h3>
              <p className="text-slate-500 mb-6">We sent a password reset link to <span className="font-semibold text-slate-800">{email}</span></p>
              <button 
                onClick={() => switchMode('LOGIN')}
                className="text-slate-900 font-semibold hover:underline"
              >
                Back to log in
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  {mode === 'LOGIN' && 'Welcome back'}
                  {mode === 'SIGNUP' && 'Create an account'}
                  {mode === 'FORGOT_PASSWORD' && 'Reset password'}
                </h2>
                <p className="text-slate-500 text-sm">
                  {mode === 'LOGIN' && 'Enter your credentials to access your workspace.'}
                  {mode === 'SIGNUP' && 'Start organizing your life in seconds.'}
                  {mode === 'FORGOT_PASSWORD' && 'Enter your email to receive instructions.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm">{error}</span>
                  </div>
                )}
                
                {mode === 'SIGNUP' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        required 
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder-slate-400"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      required 
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder-slate-400"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {mode !== 'FORGOT_PASSWORD' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                       <label className="block text-sm font-medium text-slate-700">Password</label>
                       {mode === 'LOGIN' && (
                         <button 
                           type="button" 
                           onClick={() => switchMode('FORGOT_PASSWORD')} 
                           className="text-sm text-slate-500 hover:text-slate-700"
                         >
                           Forgot password?
                         </button>
                       )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type={showPassword ? "text" : "password"}
                        required 
                        className="w-full pl-10 pr-12 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder-slate-400"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading || !email || (mode !== 'FORGOT_PASSWORD' && !password) || (mode === 'SIGNUP' && !name)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === 'LOGIN' && 'Sign In'}
                      {mode === 'SIGNUP' && 'Create Account'}
                      {mode === 'FORGOT_PASSWORD' && 'Send Reset Link'}
                    </>
                  )}
                </button>

                <div className="my-6 relative">
                  <div className="relative flex items-center py-3">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-4 text-sm text-slate-500 bg-white px-2">or</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>
                </div>
                 
                {/* Google Login Option */}
                <button
                  type="button"
                  onClick={() => handleGoogleLogin()}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {googleLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin"></div>
                  ) : (
                    <Chrome size={20} className="text-slate-600" />
                  )}
                  <span>{googleLoading ? 'Signing in...' : 'Continue with Google'}</span>
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