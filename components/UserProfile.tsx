import React, { useState, useEffect, useMemo } from 'react';
import { User, Task, TaskStatus, Project } from '../types';
import { Mail, Briefcase, LogOut, Shield, Bell, Edit3, MapPin, Link as LinkIcon, CheckCircle2, Clock, Activity, Save, X, Check, Loader2, User as UserIcon, Calendar, Award, TrendingUp, Zap, Crown, Settings, Camera, Upload, Eye, EyeOff, Key, Fingerprint, Wifi, Cloud, Database, BarChart3, Target, Star, Globe, Hash, CalendarClock, Monitor, Smartphone, Cpu, Laptop } from 'lucide-react';
import { format, parseISO, isSameDay, subDays, startOfDay } from 'date-fns';
import apiService from '../services/apiService';

interface UserProfileProps {
  user: User;
  tasks: Task[];
  projects: Project[];
  onLogout: () => void;
  onUpdateUser: (updates: Partial<User>) => void;
}

interface ProfileFormData {
  name: string;
  role: string;
  location: string;
  bio: string;
  website: string;
  avatar: string;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
}

interface SubscriptionPlan {
  name: string;
  status: 'active' | 'trial' | 'expired';
  renewalDate: string;
  features: string[];
  usage: {
    tasks: number;
    projects: number;
    storage: string;
  };
}

const UserProfile: React.FC<UserProfileProps> = ({ user, tasks, projects, onLogout, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Security settings
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: true,
    biometricEnabled: true,
    notificationsEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true
  });
  
  // Subscription data
  const [subscription, setSubscription] = useState<SubscriptionPlan>({
    name: 'Pro Infinity Plan',
    status: 'active',
    renewalDate: '2026-02-28',
    features: [
      'Unlimited tasks and projects',
      'Advanced analytics dashboard',
      'Priority support',
      'Custom integrations',
      'Team collaboration tools'
    ],
    usage: {
      tasks: 42,
      projects: 8,
      storage: '2.4 GB'
    }
  });

  // Form State
  const [formData, setFormData] = useState<ProfileFormData>({
    name: user.name,
    role: user.role,
    location: 'San Francisco, CA',
    bio: 'Product Designer passionate about creating exceptional digital experiences',
    website: `tasq.one/u/${user.id}`,
    avatar: ''
  });

  // Real-time Analytics Calculations
  const analytics = useMemo(() => {
    const completedTasksList = tasks.filter(t => t.status === TaskStatus.DONE);
    const completed = completedTasksList.length;
    const pending = tasks.length - completed;
    const rate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    
    // Matrix data for last 28 days
    const matrix = Array.from({ length: 28 }).map((_, i) => {
      const date = subDays(startOfDay(new Date()), i);
      const count = completedTasksList.filter(t => {
        try {
          return isSameDay(parseISO(t.dueDate), date);
        } catch {
          return false;
        }
      }).length;
      return { date, count };
    }).reverse();

    // Project saturation
    const projectStats = projects.map(p => {
      const projectTasks = tasks.filter(t => t.projectId === p.id);
      const saturation = tasks.length > 0 ? (projectTasks.length / tasks.length) * 100 : 0;
      return { name: p.name, saturation, count: projectTasks.length };
    }).sort((a,b) => b.saturation - a.saturation).slice(0, 4);

    return {
      completionRate: rate,
      tasksCompleted: completed,
      tasksPending: pending,
      matrix,
      projectStats
    };
  }, [tasks, projects]);

  const loadUserData = async () => {
    try {
      const response = await apiService.getProfile();
      if (response.success && response.data.user) {
        const u = response.data.user;
        const currentData = {
          name: u.name || '',
          role: u.role || 'Product Designer',
          location: u.location || '',
          bio: u.bio || 'Product Designer passionate about creating exceptional digital experiences',
          website: u.website || `tasq.one/u/${u.id}`,
          avatar: u.avatar_url || ''
        };
        setFormData(currentData);
        
        setSecuritySettings({
          twoFactorEnabled: !!u.twoFactorEnabled,
          biometricEnabled: !!u.twoFactorEnabled,
          notificationsEnabled: !!u.notificationsEnabled,
          emailNotifications: !!u.notificationsEnabled,
          smsNotifications: false,
          pushNotifications: !!u.notificationsEnabled
        });

        // Trigger real-time location detection if location is empty or default
        if (!u.location || u.location === 'San Francisco, CA') {
          detectLocation();
        }
      }
    } catch (error) {
      console.log('Error loading user data from API');
    }
  };

  const detectLocation = async () => {
    try {
      const locResponse = await fetch('https://ipapi.co/json/');
      const locData = await locResponse.json();
      if (locData.city && locData.country_name) {
        const detectedLocation = `${locData.city}, ${locData.country_name}`;
        setFormData(prev => ({ ...prev, location: detectedLocation }));
        // Sync with backend
        apiService.updateProfile({ location: detectedLocation });
      }
    } catch (err) {
      console.log('Location auto-detect suspended (Privacy/Network)');
    }
  };

  useEffect(() => {
    loadUserData();
  }, [user.id]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updateData = {
        name: formData.name,
        role: formData.role,
        location: formData.location,
        bio: formData.bio,
        website: formData.website,
        avatar_url: formData.avatar
      };

      const response = await apiService.updateProfile(updateData);
      
      if (response.success) {
        onUpdateUser({
          name: formData.name,
          role: formData.role,
          avatarUrl: formData.avatar
        });
        setIsSaving(false);
        setIsEditing(false);
        showToast({message: 'Profile updated successfully', type: 'success'});
      }
    } catch (error) {
      setIsSaving(false);
      showToast({message: 'Failed to update profile', type: 'error'});
    }
  };

  const showToast = (toastData: {message: string, type: 'success' | 'error' | 'info'}) => {
    setToast(toastData);
    setTimeout(() => setToast(null), 3000);
  };

  const toggleSecuritySetting = (setting: keyof SecuritySettings) => {
    setSecuritySettings(prev => {
      const newValue = !prev[setting];
      const newSettings = {...prev, [setting]: newValue};
      
      apiService.updateProfile({security: newSettings})
        .then(() => {
          showToast({
            message: `${setting.replace(/([A-Z])/g, ' $1')} ${newValue ? 'enabled' : 'disabled'}`, 
            type: 'success'
          });
        })
        .catch(() => {
          showToast({ message: 'Sync failed', type: 'error' });
        });
      
      return newSettings;
    });
  };

  const getSystemInfo = () => {
    const ua = navigator.userAgent;
    let browser = "Unknown Browser";
    if (ua.includes("Chrome")) browser = "Chrome Kernel";
    else if (ua.includes("Firefox")) browser = "Firefox Client";
    else if (ua.includes("Safari")) browser = "Safari Engine";
    
    let platform = "Desktop Instance";
    if (ua.includes("Windows")) platform = "Windows Node";
    else if (ua.includes("Mac")) platform = "MacOS Node";
    else if (ua.includes("Linux")) platform = "Linux Node";
    
    return { browser, platform };
  };

  const { browser, platform } = getSystemInfo();

  return (
    <div className="flex-1 h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-slate-50 custom-scrollbar">
      {toast && (
        <div className="fixed top-6 right-6 z-[60] animate-fade-in-up">
           <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm ${
             toast.type === 'success' ? 'bg-emerald-500 text-white' :
             toast.type === 'error' ? 'bg-red-500 text-white' :
             'bg-slate-900 text-white'
           }`}>
              {toast.type === 'success' && <CheckCircle2 size={18} />}
              {toast.type === 'error' && <X size={18} />}
              {toast.type === 'info' && <Bell size={18} />}
              {toast.message}
           </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-8 pb-24">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 md:p-12 relative overflow-hidden">
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                 <div>
                    <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 animate-pulse">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Active Now</span>
                      </div>
                      <span className="text-slate-300 font-semibold text-xs uppercase tracking-[0.2em]">{format(currentTime, 'HH:mm:ss')}</span>
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                         <input 
                           type="text" 
                           className="text-3xl font-black text-slate-900 bg-slate-50 border-b-2 border-slate-200 outline-none focus:border-indigo-600 py-1 w-full"
                           value={formData.name}
                           onChange={(e) => handleInputChange('name', e.target.value)}
                           autoFocus
                         />
                         <input 
                           type="text" 
                           className="text-lg font-bold text-slate-500 bg-slate-50 border-b-2 border-slate-100 outline-none focus:border-indigo-600 py-1 w-full"
                           value={formData.role}
                           onChange={(e) => handleInputChange('role', e.target.value)}
                         />
                      </div>
                    ) : (
                      <>
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{formData.name}</h1>
                        <p className="text-slate-500 font-semibold flex items-center justify-center md:justify-start gap-2 mt-2 uppercase tracking-widest text-xs">
                           <Briefcase size={16} className="text-indigo-500" />
                           {formData.role}
                        </p>
                      </>
                    )}
                    <p className="text-slate-400 font-medium flex items-center justify-center md:justify-start gap-2 mt-1 text-sm">
                       <MapPin size={14} />
                       {formData.location}
                    </p>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 {isEditing ? (
                   <>
                     <button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all active:scale-95">
                        Cancel
                     </button>
                     <button onClick={handleSave} disabled={isSaving} className="px-6 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center gap-2 active:scale-95 disabled:opacity-50">
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Changes
                     </button>
                   </>
                 ) : (
                   <>
                     <button onClick={() => setIsEditing(true)} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 flex items-center gap-2 shadow-sm active:scale-95">
                        <Edit3 size={16} /> Edit Profile
                     </button>
                     <button onClick={onLogout} className="px-6 py-3 bg-red-50 border border-red-100 text-red-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-red-100 transition-all flex items-center gap-2 shadow-sm active:scale-95">
                        <LogOut size={16} /> Logout
                     </button>
                   </>
                 )}
              </div>
           </div>
        </div>

        {/* Real-time Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           {/* Left Column - Real-time Stats */}
           <div className="lg:col-span-4 space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 group overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-100/50 transition-colors"></div>
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3 relative z-10">
                    <Activity size={18} className="text-indigo-500" />
                    Live Metrics
                 </h3>
                 <div className="space-y-4 relative z-10">
                    <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-white transition-all shadow-sm hover:shadow-md">
                       <div className="flex items-center justify-between mb-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                          <span className="text-emerald-600 font-black bg-emerald-50 px-3 py-1 rounded-full text-[10px] border border-emerald-100">{analytics.completionRate}%</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <p className="text-3xl font-black text-slate-900">{analytics.tasksCompleted}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Finalized</p>
                       </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-white transition-all shadow-sm hover:shadow-md">
                       <div className="flex items-center justify-between mb-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workload</p>
                       </div>
                       <div className="flex items-center justify-between">
                          <p className="text-3xl font-black text-slate-900">{analytics.tasksPending}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Session Intelligence */}
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute bottom-0 right-0 opacity-10 -mb-10 -mr-10 group-hover:scale-110 transition-transform duration-700">
                  <Wifi size={200} />
                </div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 relative z-10">Neural Instance</h3>
                <div className="space-y-5 relative z-10">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
                      <Cpu size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black">{platform}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Node Architecture</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
                      <Globe size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black">{browser}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Data Interface</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-white/5">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Neural Pulse: Stable</p>
                </div>
              </div>
           </div>

           {/* Right Column - Matrix & Ecosystem */}
           <div className="lg:col-span-8 space-y-8">
              {/* Data-Driven Productivity Matrix */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 group">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                    <BarChart3 size={18} className="text-indigo-500" />
                    Neural Execution Matrix
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Sync</span>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-3 mb-8">
                  {analytics.matrix.map((item, i) => {
                    let bgColor = 'bg-slate-50';
                    if (item.count >= 5) bgColor = 'bg-indigo-600';
                    else if (item.count >= 3) bgColor = 'bg-indigo-400';
                    else if (item.count >= 1) bgColor = 'bg-indigo-200';
                    
                    return (
                      <div 
                        key={i} 
                        className={`h-12 rounded-xl ${bgColor} transition-all hover:scale-105 cursor-pointer relative group/item`}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[8px] font-bold rounded opacity-0 group-hover/item:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20 shadow-xl">
                           {format(item.date, 'MMM d')}: {item.count} Tasks
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Last 28 Dynamic Cycles</span>
                  <div className="flex items-center gap-2">
                     <span>Zero</span>
                     <div className="flex gap-1">
                        {[0, 1, 3, 5].map(v => (
                          <div key={v} className={`w-2 h-2 rounded-[2px] ${v === 0 ? 'bg-slate-100' : v === 1 ? 'bg-indigo-200' : v === 3 ? 'bg-indigo-400' : 'bg-indigo-600'}`}></div>
                        ))}
                     </div>
                     <span>Apex</span>
                  </div>
                </div>
              </div>

              {/* Data-Driven Project Ecosystem */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                  <Database size={18} className="text-purple-500" />
                  Workspace Architecture
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {analytics.projectStats.length > 0 ? analytics.projectStats.map((p, i) => (
                     <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm font-black text-slate-700 truncate mr-2">{p.name}</p>
                          <p className="text-[10px] font-black text-indigo-500 uppercase whitespace-nowrap">{p.count} Unit{p.count !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${Math.max(5, p.saturation)}%` }} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-widest text-right">{Math.round(p.saturation)}% Weight</p>
                     </div>
                   )) : (
                     <div className="col-span-full p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        No active project nodes found
                     </div>
                   )}
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;