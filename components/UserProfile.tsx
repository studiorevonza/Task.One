import React, { useState, useEffect } from 'react';
import { User, Task, TaskStatus } from '../types';
import { Mail, Briefcase, LogOut, Shield, Bell, Edit3, MapPin, Link as LinkIcon, CheckCircle2, Clock, Activity, Save, X, Check, Loader2, User as UserIcon, Calendar, Award, TrendingUp, Zap, Crown, Settings, Camera, Upload, Eye, EyeOff, Key, Fingerprint, Wifi, Cloud, Database, BarChart3, Target, Star, Globe, Hash, CalendarClock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import apiService from '../services/apiService';

interface UserProfileProps {
  user: User;
  tasks: Task[];
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

const UserProfile: React.FC<UserProfileProps> = ({ user, tasks, onLogout, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
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

  // Analytics data
  const [analytics, setAnalytics] = useState({
    completionRate: 0,
    tasksCompleted: 0,
    tasksPending: 0,
    streak: 12,
    productivityScore: 87
  });

  // Load user data on mount
  useEffect(() => {
    loadUserData();
    
    // Also load analytics from tasks
    const completed = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const pending = tasks.filter(t => t.status !== TaskStatus.DONE).length;
    const rate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    
    setAnalytics({
      completionRate: rate,
      tasksCompleted: completed,
      tasksPending: pending,
      streak: 12, // This would come from API in real implementation
      productivityScore: 87 // This would come from API in real implementation
    });
  }, [user.id, tasks]);

  const loadUserData = async () => {
    try {
      // Try to load profile data from API
      const profileData = await apiService.getProfile();
      if (profileData) {
        setFormData(prev => ({
          ...prev,
          ...profileData
        }));
      }
      
      // Try to load from localStorage as fallback
      const localProfile = localStorage.getItem(`user_${user.id}_profile`);
      if (localProfile) {
        const localData = JSON.parse(localProfile);
        setFormData(prev => ({
          ...prev,
          ...localData
        }));
      }
      
      // Load security settings from localStorage
      const localSecurity = localStorage.getItem(`user_${user.id}_security`);
      if (localSecurity) {
        const securityData = JSON.parse(localSecurity);
        setSecuritySettings(securityData);
      }
      
    } catch (error) {
      console.log('Using default/fallback data');
      
      // Load any existing local data
      const localProfile = localStorage.getItem(`user_${user.id}_profile`);
      if (localProfile) {
        const localData = JSON.parse(localProfile);
        setFormData(prev => ({
          ...prev,
          ...localData
        }));
      }
      
      const localSecurity = localStorage.getItem(`user_${user.id}_security`);
      if (localSecurity) {
        const securityData = JSON.parse(localSecurity);
        setSecuritySettings(securityData);
      }
    }
  };

  const completedTasks = analytics.tasksCompleted || tasks.filter(t => t.status === TaskStatus.DONE).length;
  const pendingTasks = analytics.tasksPending || tasks.filter(t => t.status !== TaskStatus.DONE).length;
  const completionRate = analytics.completionRate || (tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        setFormData(prev => ({
          ...prev,
          avatar: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Try to save to API first
      await apiService.updateProfile(formData);
      
      // Update local user state
      onUpdateUser({
        name: formData.name,
        role: formData.role,
      });
      
      setIsSaving(false);
      setIsEditing(false);
      showToast({message: 'Profile updated successfully', type: 'success'});
    } catch (error) {
      // Fallback to localStorage if API fails
      try {
        const userData = {
          ...user,
          name: formData.name,
          role: formData.role,
          ...formData
        };
        
        // Save to localStorage as backup
        localStorage.setItem(`user_${user.id}_profile`, JSON.stringify(userData));
        
        // Update local user state
        onUpdateUser({
          name: formData.name,
          role: formData.role,
        });
        
        setIsSaving(false);
        setIsEditing(false);
        showToast({message: 'Profile saved locally (offline mode)', type: 'info'});
      } catch (fallbackError) {
        setIsSaving(false);
        showToast({message: 'Failed to update profile', type: 'error'});
      }
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
      
      // Try to save to API
      apiService.updateProfile({security: newSettings})
        .then(() => {
          showToast({
            message: `${setting.replace(/([A-Z])/g, ' $1')} ${newValue ? 'enabled' : 'disabled'}`, 
            type: 'success'
          });
        })
        .catch(() => {
          // Fallback to localStorage
          localStorage.setItem(`user_${user.id}_security`, JSON.stringify(newSettings));
          showToast({
            message: `${setting.replace(/([A-Z])/g, ' $1')} ${newValue ? 'enabled locally' : 'disabled locally'}`, 
            type: 'info'
          });
        });
      
      return newSettings;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'trial': return 'bg-amber-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'trial': return 'Trial';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[60] animate-fade-in-up">
           <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm ${
             toast.type === 'success' ? 'bg-emerald-500 text-white' :
             toast.type === 'error' ? 'bg-red-500 text-white' :
             'bg-slate-900 text-white'
           }`}>
              {toast.type === 'success' && <CheckCircle2 size={18} className="text-white" />}
              {toast.type === 'error' && <X size={18} className="text-white" />}
              {toast.type === 'info' && <Bell size={18} className="text-white" />}
              {toast.message}
           </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-8 pb-24">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 md:p-12 relative overflow-hidden group">
           <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-50 rounded-full group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>
           
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              
              <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                 {/* Avatar with upload capability */}
                 <div className="relative group">
                   <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-4xl font-black shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                     {avatarPreview ? (
                       <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                     ) : formData.avatar ? (
                       <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                       formData.name.charAt(0)
                     )}
                     {isEditing && (
                       <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-[2rem]">
                         <Camera size={24} className="text-white" />
                         <input 
                           type="file" 
                           accept="image/*" 
                           className="hidden" 
                           onChange={handleAvatarUpload}
                         />
                       </label>
                     )}
                   </div>
                 </div>
                 
                 <div>
                    {isEditing ? (
                      <div className="space-y-3">
                         <input 
                           type="text" 
                           className="text-3xl font-black text-slate-900 bg-slate-50 border-b-2 border-slate-200 outline-none focus:border-indigo-600 transition-colors py-1 w-full"
                           value={formData.name}
                           onChange={(e) => handleInputChange('name', e.target.value)}
                           autoFocus
                         />
                         <input 
                           type="text" 
                           className="text-lg font-bold text-slate-500 bg-slate-50 border-b-2 border-slate-100 outline-none focus:border-indigo-600 transition-colors py-1 w-full"
                           value={formData.role}
                           onChange={(e) => handleInputChange('role', e.target.value)}
                         />
                      </div>
                    ) : (
                      <>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">{formData.name}</h1>
                        <p className="text-slate-500 font-bold flex items-center justify-center md:justify-start gap-2 mt-2 uppercase tracking-widest text-xs">
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
                     <button 
                       onClick={() => setIsEditing(false)}
                       className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
                     >
                        Cancel
                     </button>
                     <button 
                       onClick={handleSave}
                       disabled={isSaving}
                       className="px-6 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 active:scale-95 disabled:opacity-50"
                     >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Profile
                     </button>
                   </>
                 ) : (
                   <>
                     <button 
                       onClick={() => setIsEditing(true)}
                       className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                     >
                        <Edit3 size={16} />
                        Edit Profile
                     </button>
                     <button 
                       onClick={onLogout}
                       className="px-6 py-3 bg-red-50 border border-red-100 text-red-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-red-100 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                     >
                        <LogOut size={16} />
                        Logout
                     </button>
                   </>
                 )}
              </div>
           </div>
        </div>

        {/* Grid Stats & Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Activity & Contact */}
           <div className="space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 group">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                    <Activity size={18} className="text-indigo-500" />
                    Activity Radar
                 </h3>
                 <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-all">
                       <div className="flex items-center justify-between mb-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Velocity</p>
                          <span className="text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded-lg text-[10px] border border-emerald-100">{completionRate}%</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <p className="text-2xl font-black text-slate-900">{completedTasks}</p>
                          <p className="text-xs font-bold text-slate-400">Tasks Completed</p>
                       </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-all">
                       <div className="flex items-center justify-between mb-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Pipeline</p>
                       </div>
                       <div className="flex items-center justify-between">
                          <p className="text-2xl font-black text-slate-900">{pendingTasks}</p>
                          <p className="text-xs font-bold text-slate-400">Tasks Pending</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Intelligence Cloud</h3>
                 <div className="space-y-6">
                    <div className="flex items-start gap-4 p-2 rounded-2xl hover:bg-slate-50 transition-colors group">
                       <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-white group-hover:text-indigo-500 transition-all border border-transparent group-hover:border-indigo-50">
                          <Mail size={18} />
                       </div>
                       <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Primary Alias</p>
                          <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4 p-2 rounded-2xl hover:bg-slate-50 transition-colors group">
                       <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-white group-hover:text-indigo-500 transition-all border border-transparent group-hover:border-indigo-50">
                          <LinkIcon size={18} />
                       </div>
                       <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Workspace Endpoint</p>
                          <p className="text-sm font-bold text-indigo-600 truncate">{formData.website}</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Settings */}
           <div className="lg:col-span-2 space-y-8">
              
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10">
                 <div className="flex items-center justify-between mb-10">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Ecosystem Control</h3>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div 
                      onClick={() => toggleSecuritySetting('twoFactorEnabled')}
                      className={`p-8 rounded-[2rem] border transition-all group cursor-pointer relative overflow-hidden ${securitySettings.twoFactorEnabled ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                    >
                       <div className="flex items-start justify-between mb-6">
                          <div className={`p-4 rounded-2xl ${securitySettings.twoFactorEnabled ? 'bg-white/10' : 'bg-white shadow-sm'}`}>
                             <Shield size={24} className={securitySettings.twoFactorEnabled ? 'text-indigo-400' : 'text-slate-400'} />
                          </div>
                          <div className={`w-12 h-6 rounded-full p-1 transition-colors ${securitySettings.twoFactorEnabled ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                             <div className={`w-4 h-4 bg-white rounded-full transition-transform ${securitySettings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                          </div>
                       </div>
                       <h4 className="font-black text-lg mb-2">Multi-Factor Auth</h4>
                       <p className={`text-xs font-medium leading-relaxed ${securitySettings.twoFactorEnabled ? 'text-slate-400' : 'text-slate-500'}`}>
                          Biometric & Device security layers are currently {securitySettings.twoFactorEnabled ? 'active' : 'suspended'}.
                       </p>
                    </div>

                    <div 
                      onClick={() => toggleSecuritySetting('notificationsEnabled')}
                      className={`p-8 rounded-[2rem] border transition-all group cursor-pointer relative overflow-hidden ${securitySettings.notificationsEnabled ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                    >
                       <div className="flex items-start justify-between mb-6">
                          <div className={`p-4 rounded-2xl ${securitySettings.notificationsEnabled ? 'bg-white/10' : 'bg-white shadow-sm'}`}>
                             <Bell size={24} className={securitySettings.notificationsEnabled ? 'text-white' : 'text-slate-400'} />
                          </div>
                          <div className={`w-12 h-6 rounded-full p-1 transition-colors ${securitySettings.notificationsEnabled ? 'bg-white/30' : 'bg-slate-200'}`}>
                             <div className={`w-4 h-4 bg-white rounded-full transition-transform ${securitySettings.notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                          </div>
                       </div>
                       <h4 className="font-black text-lg mb-2">Neural Alerts</h4>
                       <p className={`text-xs font-medium leading-relaxed ${securitySettings.notificationsEnabled ? 'text-indigo-100' : 'text-slate-500'}`}>
                          Real-time workspace sync and reminders are {securitySettings.notificationsEnabled ? 'enabled' : 'off'}.
                       </p>
                    </div>
                 </div>

                 <div className="mt-10 pt-10 border-t border-slate-100">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Service Level</h4>
                     <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                           <Activity size={180} />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                           <div>
                              <div className="flex items-center gap-3 mb-2">
                                 <p className="font-black text-2xl tracking-tight">{subscription.name}</p>
                                 <span className={`${getStatusColor(subscription.status)} text-white text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest`}>
                                   {getStatusText(subscription.status)}
                                 </span>
                              </div>
                              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                                Cycle renewal: {format(parseISO(subscription.renewalDate), 'MMMM d, yyyy')}
                              </p>
                           </div>
                           <button className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl transition-all border border-white/10 active:scale-95">
                              Modify Tier
                           </button>
                        </div>
                     </div>
                 </div>
              </div>

              <div className="text-center">
                 <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                   Node ID: {user.id} <span className="text-slate-200">•</span> Established: {format(parseISO(user.joinDate), 'MMMM yyyy')}
                 </p>
              </div>

           </div>
        </div>

      </div>
    </div>
  );
};

export default UserProfile;