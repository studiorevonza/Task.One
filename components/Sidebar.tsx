
import React, { useState } from 'react';
import { View } from '../types';
import { LayoutDashboard, FolderKanban, CheckSquare, Calendar, BarChart3, X, User as UserIcon, LogOut, AlertTriangle } from 'lucide-react';

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
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 text-slate-900 flex flex-col h-full shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Logo Area */}
        <div className="p-6 flex justify-between items-center border-b border-slate-100">
          <div className="flex items-center gap-3">
             <img 
               src="/one.png" 
               alt="tasq.one logo" 
               className="w-15 h-13 object-contain" 
               onError={(e) => {
                 console.error('Sidebar logo failed to load:', e);
                 e.currentTarget.style.display = 'none';
                 const fallback = document.createElement('div');
                 fallback.className = 'text-xl font-bold text-slate-900';
                 fallback.textContent = 'T';
                 e.currentTarget.parentNode?.appendChild(fallback);
               }}
             />
          </div>
          <button 
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => handleNavClick(item.view)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm ${
                currentView === item.view
                  ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={18} className={`shrink-0 ${currentView === item.view ? 'text-slate-900' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        
        {/* Profile Section */}
        <div className="p-4 border-t border-slate-100 space-y-2">
           <button
             onClick={() => handleNavClick('PROFILE')}
             className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm ${
               currentView === 'PROFILE'
                 ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200'
                 : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
             }`}
           >
             <UserIcon size={18} className={`shrink-0 ${currentView === 'PROFILE' ? 'text-slate-900' : 'text-slate-400'}`} />
             <span>My Profile</span>
           </button>
           
           <button
             onClick={handleLogoutClick}
             className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 font-medium text-sm group"
           >
             <LogOut size={18} className="shrink-0 text-slate-400 group-hover:text-red-500" />
             <span>Sign Out</span>
           </button>
        </div>
      </div>
      
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200">
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Sign Out?</h3>
              <p className="text-slate-500 mb-6">You will be signed out of your account. Any unsaved changes will be lost.</p>
              
              <div className="flex gap-3">
                <button
                  onClick={cancelLogout}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut size={18} />
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
