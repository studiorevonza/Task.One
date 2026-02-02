
import React, { useState } from 'react';
import { View } from '../types';
import { LayoutDashboard, FolderKanban, CheckSquare, Calendar, BarChart3, X, User as UserIcon, LogOut, AlertTriangle } from 'lucide-react';
import Logo from './Logo';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, onClose, onLogout }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const navItems = [
    { view: 'DASHBOARD', label: 'Overview', icon: LayoutDashboard },
    { view: 'TASKS', label: 'My Tasks', icon: CheckSquare },
    { view: 'PROJECTS', label: 'Projects', icon: FolderKanban },
    { view: 'WORKFLOW', label: 'Workflow', icon: BarChart3 },
    { view: 'CALENDAR', label: 'Schedule', icon: Calendar },
  ] as const;

  const handleNavClick = (view: View) => {
    setCurrentView(view);
    onClose(); 
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/10 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col h-full shadow-[0_0_40px_rgba(0,0,0,0.04)] md:shadow-none transition-all duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-slate-100`}>
        
        {/* Subtle decorative background element */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-[0.03]">
          <div className="absolute top-[-5%] right-[-5%] w-64 h-64 bg-indigo-600 rounded-full blur-[80px]" />
        </div>

        {/* Logo Area */}
        <div className="relative py-6 px-7 flex justify-between items-center cursor-default">
          <div className="flex items-center">
             <span className="text-2xl font-black tracking-[0.2em] text-slate-900 font-outfit uppercase">
               Task
             </span>
             <span className="text-2xl font-black text-indigo-600 font-outfit mx-1">.</span>
             <span className="text-2xl font-light tracking-[0.2em] text-slate-400 font-outfit uppercase">
               One
             </span>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="relative flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Main Workspace</p>
          </div>
          {navItems.map((item) => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                className={`group relative w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 font-semibold text-sm ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-[0_10px_20px_-5px_rgba(15,23,42,0.15)] transform scale-[1.02]'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <item.icon size={19} className={`relative z-10 shrink-0 transition-transform duration-300 ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-900 group-hover:scale-110'}`} />
                <span className="relative z-10">{item.label}</span>
                
                {isActive && (
                   <div className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full" />
                )}
              </button>
            );
          })}
        </nav>
        
        {/* Bottom Actions Section */}
        <div className="relative p-6 space-y-2">
           <div className="h-px bg-slate-100 mb-6 mx-2" />
           
           <button
             onClick={() => handleNavClick('PROFILE')}
             className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm ${
               currentView === 'PROFILE'
                 ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                 : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
             }`}
           >
             <UserIcon size={19} className={`shrink-0 ${currentView === 'PROFILE' ? 'text-indigo-400' : 'text-slate-400'}`} />
             <span>My Profile</span>
           </button>
           
           <button
             onClick={handleLogoutClick}
             className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 font-semibold text-sm group"
           >
             <LogOut size={19} className="shrink-0 text-slate-400 group-hover:text-rose-500 transition-colors" />
             <span>Sign Out</span>
           </button>
           <div className="pt-6 mt-4 border-t border-slate-50">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                 <div className="flex gap-1">
                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                 </div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Neural Sync Active</span>
              </div>
           </div>
        </div>
      </div>
      
      {/* Logout Confirmation Modal - Light Theme */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/20 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-slate-100 animate-slide-up">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Sign Out</h3>
              <p className="text-slate-500 mb-8 text-sm leading-relaxed">Are you sure you want to end your session? Make sure your work is saved.</p>
              
              <div className="flex gap-3">
                <button
                  onClick={cancelLogout}
                  className="flex-1 px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-200 transition-all duration-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
