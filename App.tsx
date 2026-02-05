
import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import apiService from './services/apiService';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TaskManager from './components/TaskManager';
import ProjectManager from './components/ProjectManager';
import CalendarView from './components/CalendarView';
import WorkflowView from './components/WorkflowView';
import WorkspaceIntelligence from './components/WorkspaceIntelligence';
import BrainstormView from './components/BrainstormView';
import Auth from './components/Auth';
import UserProfile from './components/UserProfile';
import Logo from './components/Logo';
import ResetPassword from './components/ResetPassword';
import { View, Task, Project, TaskStatus, User, Priority } from './types';
import NotificationCenter from './components/NotificationCenter';
import { io } from 'socket.io-client';
import { Menu, X, Bell } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '436152930223-2p91794cslr6tqks1nlpekvqig2hn3ch.apps.googleusercontent.com'  // Local dev client ID
    : '436152930223-2p91794cslr6tqks1nlpekvqig2hn3ch.apps.googleusercontent.com'); // Production client ID

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tasq_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Check for existing authentication token
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token && !user) {
      // Try to get user profile
      apiService.getProfile()
        .then(response => {
          if (response.success) {
            const authenticatedUser: User = {
              id: response.data.user.id.toString(),
              name: response.data.user.name,
              email: response.data.user.email,
              role: response.data.user.role || 'Product Designer',
              avatarUrl: response.data.user.avatar_url,
              joinDate: response.data.user.created_at
            };
            setUser(authenticatedUser);
          }
        })
        .catch(() => {
          // Token invalid, remove it
          localStorage.removeItem('authToken');
        });
    }
  }, []);

  // Initialize demo user if none exists
  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.length === 0) {
      // Create demo user
      const demoUser = {
        id: 'u_demo',
        name: 'Demo User',
        email: 'test@example.com',
        password: 'password123',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('users', JSON.stringify([demoUser]));
    }
  }, []);

  // App State - Start with empty arrays, data will be fetched from database
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Check for reset token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setResetToken(token);
    }
  }, []);

  // Alerts
  const [deadlineAlerts, setDeadlineAlerts] = useState<string[]>([]);

  // Persist User
  useEffect(() => {
    if (user) {
      localStorage.setItem('tasq_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('tasq_user');
    }
  }, [user]);

  // Request Notification Permission on Mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Poll for Reminders and Upcoming Deadlines (4 days window)
  useEffect(() => {
    if (!user) return; // Only poll if logged in

    const checkNotifications = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      // 1. Check Standard Reminders
      setTasks(prevTasks => {
        let hasUpdates = false;
        const updatedTasks = prevTasks.map(task => {
          if (task.reminderMinutes && !task.reminderSent && task.status !== TaskStatus.DONE) {
            const timeStr = task.dueTime || '09:00';
            const dueDateTimeStr = `${task.dueDate}T${timeStr}`;
            const dueDate = new Date(dueDateTimeStr);
            const reminderTime = new Date(dueDate.getTime() - task.reminderMinutes * 60000);

            if (now >= reminderTime && now < dueDate) {
              if (Notification.permission === "granted") {
                new Notification(`Reminder: ${task.title}`, {
                  body: `Due today at ${timeStr}.`,
                  icon: '/favicon.ico'
                });
              }
              hasUpdates = true;
              return { ...task, reminderSent: true };
            }
          }
          return task;
        });
        return hasUpdates ? updatedTasks : prevTasks;
      });

      // 2. Check 4-Day Deadline Window
      const storageKey = `notified_upcoming_${user.id}_${todayStr}`;
      const notifiedIds: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
      let newAlerts: string[] = [];
      let updatedNotifiedIds = [...notifiedIds];
      let hasNewNotifications = false;

      tasks.forEach(async (task) => {
        if (task.status === TaskStatus.DONE) return;
        if (updatedNotifiedIds.includes(task.id)) return;

        const due = new Date(task.dueDate + 'T00:00:00');
        const daysUntilDue = differenceInCalendarDays(due, now);

        if (daysUntilDue <= 4 && daysUntilDue >= 0) {
          const dayDisplay = daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`;
          const msg = `Upcoming Deadline: "${task.title}" is due on ${format(due, 'MMM d')} (${dayDisplay}).`;
          
          newAlerts.push(msg);
          updatedNotifiedIds.push(task.id);
          hasNewNotifications = true;

          // Browser Notification
          if (Notification.permission === "granted") {
            new Notification("Task Deadline Approaching", {
              body: msg,
              icon: '/favicon.ico'
            });
          }

          // Email Notification
          try {
            await apiService.sendEmailNotification(
              user.email,
              `NEURAL ALERT: ${task.title} Deadline Approaching`,
              `Attention ${user.name}, the neural engine has detected that "${task.title}" is reaching its target deadline (${dayDisplay}). Immediate execution is recommended to maintain workspace stability.`,
              task.title
            );
            console.log(`Email notification dispatched for task: ${task.title}`);
          } catch (err) {
            console.error('Failed to dispatch email notification:', err);
          }
        }
      });

      if (hasNewNotifications) {
        setDeadlineAlerts(prev => [...prev, ...newAlerts]);
        localStorage.setItem(storageKey, JSON.stringify(updatedNotifiedIds));
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 60000);

    // Neural Real-time Sync
    const socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      // Use environment-appropriate URL
      ...(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? { hostname: 'localhost', port: 3001, protocol: 'ws:' }
        : { hostname: window.location.hostname, port: window.location.port || undefined })
    });
    
    socket.on('neural_alert', (data: { message: string, taskTitle?: string }) => {
      console.log('📡 Real-time Neural Alert Received:', data);
      setDeadlineAlerts(prev => [data.message, ...prev]);
      
      if (Notification.permission === "granted") {
        new Notification(data.taskTitle || "Neural System Update", {
          body: data.message,
          icon: '/logo.png'
        });
      }
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [user, tasks]);

  // Auth Handlers
  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    // Clear user data
    setUser(null);
    setCurrentView('DASHBOARD');
    setSelectedProjectId(null);
    
    // Clear localStorage and API token
    const users = localStorage.getItem('users');
    localStorage.clear();
    if (users) {
      localStorage.setItem('users', users);
    }
    localStorage.removeItem('authToken');
    apiService.logout();
    
    console.log('User logged out successfully');
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  // Data Handlers
  const fetchAllData = async () => {
      try {
        const [tasksRes, projectsRes] = await Promise.all([
          apiService.getTasks(),
          apiService.getProjects()
        ]);

        if (tasksRes.success) {
          const mappedTasks = tasksRes.data.tasks.map((t: any) => ({
            id: t.id.toString(),
            projectId: t.project_id?.toString(),
            title: t.title,
            description: t.description,
            status: mapBackendStatus(t.status),
            priority: mapBackendPriority(t.priority),
            dueDate: t.due_date ? t.due_date.split('T')[0] : new Date().toISOString().split('T')[0],
            category: t.project_id ? (t.project_name?.includes('Personal') ? 'Personal' : 'Company') : 'Company', // simplified logic
            reminderMinutes: 0
          }));
          setTasks(mappedTasks);
        }

        if (projectsRes.success) {
          const mappedProjects = projectsRes.data.map((p: any) => ({
             id: p.id.toString(),
             name: p.name,
             description: p.description,
             category: p.category === 'personal' ? 'Personal' : 'Company',
             priority: mapBackendPriority(p.priority),
             dueDate: p.due_date ? p.due_date.split('T')[0] : '',
             progress: p.progress || 0,
             milestones: []
          }));
          setProjects(mappedProjects);
        }

      } catch (error) {
        console.error('Failed to sync workspace:', error);
      }
  };

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const mapBackendStatus = (status: string): TaskStatus => {
     const map: Record<string, TaskStatus> = {
       'todo': TaskStatus.TODO,
       'in_progress': TaskStatus.IN_PROGRESS,
       'completed': TaskStatus.DONE,
       'cancelled': TaskStatus.DONE 
     };
     return map[status] || TaskStatus.TODO;
  };

  const mapBackendPriority = (priority: string): Priority => {
     const map: Record<string, Priority> = {
       'low': Priority.LOW,
       'medium': Priority.MEDIUM,
       'high': Priority.HIGH
     };
     return map[priority] || Priority.MEDIUM;
  };

  const addTask = async (task: Task) => {
    // Optimistic Update
    const tempId = Date.now().toString();
    const optimisticTask = { ...task, id: tempId };
    setTasks(prev => [optimisticTask, ...prev]);

    console.log('🚀 Creating task:', task.title);
    console.log('📦 Task payload:', task);

    try {
       const payload = {
         title: task.title,
         description: task.description,
         status: task.status === TaskStatus.TODO ? 'todo' : task.status === TaskStatus.IN_PROGRESS ? 'in_progress' : 'completed',
         priority: task.priority.toLowerCase(),
         due_date: task.dueDate,
         project_id: task.projectId ? task.projectId : undefined
       };
       
       console.log('📤 Sending to API:', payload);
       
       const response = await apiService.createTask(payload);
       
       console.log('📥 API Response:', response);
       
       if (response.success) {
          const newTask = response.data.task;
          console.log('✅ Task created successfully:', newTask);
          setTasks(prev => prev.map(t => t.id === tempId ? { ...t, id: newTask.id.toString() } : t));
       } else {
          console.error('❌ API returned success:false', response);
          // Revert optimistic update
          setTasks(prev => prev.filter(t => t.id !== tempId));
       }
    } catch (e: any) {
       console.error('❌ Failed to commit task:', e);
       console.error('Error details:', {
         message: e.message,
         response: e.response?.data,
         status: e.response?.status
       });
       // Revert optimistic
       setTasks(prev => prev.filter(t => t.id !== tempId));
    }
  };

  const removeTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await apiService.deleteTask(id);
    } catch (e) {
      console.error("Failed to delete task:", e);
      fetchAllData(); // Revert on sync
    }
  };

  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    try {
      const backendStatus = status === TaskStatus.DONE ? 'completed' : status === TaskStatus.IN_PROGRESS ? 'in_progress' : 'todo';
      await apiService.updateTask(id, { status: backendStatus });
    } catch(e) {
      console.error("Failed to update status", e);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    try {
       const payload: any = {};
       if (updates.title) payload.title = updates.title;
       if (updates.priority) payload.priority = updates.priority.toLowerCase();
       if (updates.dueDate) payload.due_date = updates.dueDate;
       
       if (Object.keys(payload).length > 0) {
         await apiService.updateTask(id, payload);
       }
    } catch (e) {
      console.error("Failed to update task", e);
    }
  };

  const addProject = async (project: Project) => {
    // Optimistic
    const tempId = Date.now().toString();
    const optimisticProject = { ...project, id: tempId };
    setProjects(prev => [optimisticProject, ...prev]);

    try {
      const payload = {
        name: project.name,
        description: project.description,
        category: project.category === 'Personal' ? 'personal' : 'company',
        priority: project.priority.toLowerCase(),
        due_date: project.dueDate
      };
      
      const response = await apiService.createProject(payload);
      if (response.success) {
         const newProject = response.data.project;
         setProjects(prev => prev.map(p => p.id === tempId ? { ...p, id: newProject.id.toString() } : p));
      }
    } catch (e) {
      console.error("Failed to create project:", e);
      setProjects(prev => prev.filter(p => p.id !== tempId));
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    try {
       const payload: any = {};
       if (updates.name) payload.name = updates.name;
       if (updates.description) payload.description = updates.description;
       if (updates.category) payload.category = updates.category === 'Personal' ? 'personal' : 'company';
       if (updates.priority) payload.priority = updates.priority.toLowerCase();
       if (updates.dueDate) payload.due_date = updates.dueDate;
       if (updates.progress !== undefined) payload.progress = updates.progress;

       if (Object.keys(payload).length > 0) {
         await apiService.updateProject(id, payload);
       }
    } catch (e) {
      console.error("Failed to update project:", e);
    }
  };

  const removeProject = async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.map(t => t.projectId === id ? { ...t, projectId: undefined } : t));
    
    try {
      await apiService.deleteProject(id);
    } catch (e) {
      console.error("Failed to delete project:", e);
      fetchAllData();
    }
  };

  const handleProjectSelectFromDashboard = (id: string) => {
    setSelectedProjectId(id);
    setCurrentView('PROJECTS');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return (
          <Dashboard 
            tasks={tasks} 
            projects={projects} 
            user={user} 
            onViewChange={setCurrentView}
            onProjectSelect={handleProjectSelectFromDashboard}
          />
        );
      case 'TASKS':
        return <TaskManager tasks={tasks} addTask={addTask} updateTaskStatus={updateTaskStatus} removeTask={removeTask} updateTask={updateTask} />;
      case 'PROJECTS':
        return (
          <ProjectManager 
            projects={projects} 
            addProject={addProject} 
            updateProject={updateProject}
            removeProject={removeProject}
            tasks={tasks}
            addTask={addTask}
            updateTask={updateTask}
            removeTask={removeTask}
            updateTaskStatus={updateTaskStatus}
            initialSelectedId={selectedProjectId}
          />
        );
      case 'CALENDAR':
        return <CalendarView tasks={tasks} updateTask={updateTask} />;
      case 'WORKFLOW':
        return <WorkflowView tasks={tasks} updateTaskStatus={updateTaskStatus} />;
      case 'INTELLIGENCE':
        return <WorkspaceIntelligence tasks={tasks} projects={projects} addTask={addTask} />;
      case 'BRAINSTORM':
        return <BrainstormView tasks={tasks} projects={projects} addTask={addTask} />;
      case 'PROFILE':
        return <UserProfile user={user!} tasks={tasks} projects={projects} onLogout={handleLogout} onUpdateUser={updateUser} />;
      default:
        return <Dashboard tasks={tasks} projects={projects} user={user} onViewChange={setCurrentView} onProjectSelect={handleProjectSelectFromDashboard} />;
    }
  };

  if (!user) {
    if (resetToken) {
      return (
        <ResetPassword 
          token={resetToken} 
          onSuccess={() => {
            setResetToken(null);
            window.history.replaceState({}, document.title, window.location.pathname);
          }} 
        />
      );
    }
    
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Auth onLogin={handleLogin} />
      </GoogleOAuthProvider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="flex h-screen bg-slate-50 overflow-hidden relative font-sans text-slate-900">
        <Sidebar 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 w-full md:ml-72 flex flex-col h-full overflow-hidden transition-all duration-300 relative">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center p-4 bg-white/80 backdrop-blur-md border-b border-slate-200 shrink-0 justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
               <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
               >
                  <Menu size={24} />
               </button>
               <span className="font-bold text-slate-900 tracking-tight">
                 {currentView.charAt(0) + currentView.slice(1).toLowerCase()}
               </span>
            </div>
            <div className="flex items-center gap-3">
               <NotificationCenter 
                  notifications={deadlineAlerts} 
                  onClear={(idx) => setDeadlineAlerts(prev => prev.filter((_, i) => i !== idx))} 
               />
               <button 
                onClick={() => setCurrentView('PROFILE')} 
                className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-slate-900/20 transform active:scale-95 transition-all"
               >
                 {user.name.charAt(0)}
               </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50 custom-scrollbar relative">
            {/* Desktop Global Header */}
            <div className="hidden md:flex absolute top-8 right-8 z-40 items-center gap-4">
                <NotificationCenter 
                    notifications={deadlineAlerts} 
                    onClear={(idx) => setDeadlineAlerts(prev => prev.filter((_, i) => i !== idx))} 
                />
            </div>
            {renderContent()}
          </div>

          {deadlineAlerts.length > 0 && (
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 animate-fade-in-up max-w-sm w-full">
               {deadlineAlerts.map((alert, idx) => (
                 <div key={idx} className="bg-white/90 backdrop-blur-xl border-l-4 border-amber-500 rounded-2xl shadow-2xl p-5 flex items-start gap-4 border border-white/50 relative group animate-float">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0 shadow-inner">
                       <Bell size={20} />
                    </div>
                    <div className="flex-1 pr-6">
                       <h4 className="font-bold text-slate-900 text-sm">Deadline Approaching</h4>
                       <p className="text-slate-600 text-[13px] mt-1.5 leading-relaxed">{alert}</p>
                    </div>
                    <button 
                      onClick={() => setDeadlineAlerts(prev => prev.filter((_, i) => i !== idx))} 
                      className="absolute top-3 right-3 text-slate-300 hover:text-slate-500 p-1.5 rounded-lg hover:bg-slate-100 transition-all"
                    >
                       <X size={16} />
                    </button>
                 </div>
               ))}
            </div>
          )}
        </main>
      </div>
    </GoogleOAuthProvider>
  );
};

export default App;
