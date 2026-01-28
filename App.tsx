
import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
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
import { View, Task, Project, TaskStatus, User } from './types';
import { INITIAL_PROJECTS, INITIAL_TASKS } from './constants';
import { Menu, X, Bell } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '436152930223-2p91794cslr6tqks1nlpekvqig2hn3ch.apps.googleusercontent.com';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tasq_user');
    return saved ? JSON.parse(saved) : null;
  });

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

  // App State
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

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

      tasks.forEach(task => {
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

          if (Notification.permission === "granted") {
            new Notification("Task Deadline Approaching", {
              body: msg,
              icon: '/favicon.ico'
            });
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

    return () => clearInterval(interval);
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
    
    // Clear localStorage except users
    const users = localStorage.getItem('users');
    localStorage.clear();
    if (users) {
      localStorage.setItem('users', users);
    }
    
    console.log('User logged out successfully');
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  // Data Handlers
  const addTask = (task: Task) => {
    setTasks(prev => [task, ...prev]);
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addProject = (project: Project) => {
    setProjects(prev => [project, ...prev]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removeProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.map(t => t.projectId === id ? { ...t, projectId: undefined } : t));
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
        return <UserProfile user={user!} tasks={tasks} onLogout={handleLogout} onUpdateUser={updateUser} />;
      default:
        return <Dashboard tasks={tasks} projects={projects} user={user} onViewChange={setCurrentView} onProjectSelect={handleProjectSelectFromDashboard} />;
    }
  };

  if (!user) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Auth onLogin={handleLogin} />
      </GoogleOAuthProvider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="flex h-screen bg-white overflow-hidden relative font-sans text-slate-900">
        <Sidebar 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 w-full md:ml-64 flex flex-col h-full overflow-hidden transition-all duration-300">
          <div className="md:hidden flex items-center p-4 bg-white border-b border-slate-200 shrink-0 justify-between">
            <div className="flex items-center gap-3">
               <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
               >
                  <Menu size={24} />
               </button>
               <span className="font-bold text-slate-900">
                 {currentView.charAt(0) + currentView.slice(1).toLowerCase()}
               </span>
            </div>
            <button onClick={() => setCurrentView('PROFILE')} className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
               {user.name.charAt(0)}
            </button>
          </div>

          <div className="flex-1 overflow-auto bg-white custom-scrollbar">
            {renderContent()}
          </div>

          {deadlineAlerts.length > 0 && (
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 animate-fade-in-up max-w-sm w-full">
               {deadlineAlerts.map((alert, idx) => (
                 <div key={idx} className="bg-white border-l-4 border-amber-500 rounded-xl shadow-2xl p-4 flex items-start gap-3 border border-slate-100 relative group">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-full shrink-0">
                       <Bell size={18} />
                    </div>
                    <div className="flex-1 pr-4">
                       <h4 className="font-bold text-slate-900 text-sm">Deadline Approaching</h4>
                       <p className="text-slate-600 text-xs mt-1 leading-relaxed">{alert}</p>
                    </div>
                    <button 
                      onClick={() => setDeadlineAlerts(prev => prev.filter((_, i) => i !== idx))} 
                      className="absolute top-2 right-2 text-slate-300 hover:text-slate-500 p-1"
                    >
                       <X size={14} />
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
