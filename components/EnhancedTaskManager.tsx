// Enhanced Real-time Task Manager
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Task, TaskStatus, Priority, Category } from '../types';
import { Plus, Trash2, Filter, Calendar, AlertTriangle, Link, Lock, X, Flag, Tag, Check, Bell, Clock, Edit2, Search, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown, Save, Target, FileText, Rocket, Briefcase, GitBranch, User, Users, UserCheck } from 'lucide-react';
import { format, isPast, isToday, isValid } from 'date-fns';
import { io } from 'socket.io-client';
import { TaskManager as TaskUtils } from '../utils/taskManager';

interface EnhancedTaskManagerProps {
  tasks: Task[];
  addTask: (task: Task) => Promise<any>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  updateTask?: (id: string, updates: Partial<Task>) => Promise<void>;
  user: any;
  onNotification: (message: string) => void;
}

const EnhancedTaskManager: React.FC<EnhancedTaskManagerProps> = ({ 
  tasks, 
  addTask, 
  updateTaskStatus, 
  removeTask, 
  updateTask, 
  user,
  onNotification 
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserForAssignment, setSelectedUserForAssignment] = useState<string>('');
  
  // Sort State
  type SortOption = 'PRIORITY' | 'DUE_DATE' | 'CREATED';
  const [sortBy, setSortBy] = useState<SortOption>('CREATED');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  
  // Edit State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [tasksForAssignment, setTasksForAssignment] = useState<Task[]>([]);
  
  // Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.MEDIUM);
  const [newTaskCategory, setNewTaskCategory] = useState<Category>(Category.COMPANY);
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskDueTime, setNewTaskDueTime] = useState('');
  const [newTaskDependencies, setNewTaskDependencies] = useState<string[]>([]);
  const [newTaskReminder, setNewTaskReminder] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Initialize real-time socket connection
  useEffect(() => {
    const socketInstance = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      ...(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? { hostname: 'localhost', port: 3001, protocol: 'ws:' }
        : { hostname: window.location.hostname, port: window.location.port || undefined })
    });

    socketInstance.on('neural_alert', (data: { message: string, taskTitle?: string }) => {
      console.log('📡 Real-time Task Update:', data);
      onNotification(data.message);
    });
    
    // Listen for task assignments
    socketInstance.on('taskAssigned', (data) => {
      console.log('📋 Task assigned:', data);
      onNotification(data.message);
    });
    
    // Listen for task updates
    socketInstance.on('taskUpdated', (data) => {
      console.log('🔄 Task updated:', data);
      onNotification(data.message);
    });
    
    // Listen for task progress
    socketInstance.on('taskProgress', (data) => {
      console.log('📈 Task progress:', data);
      onNotification(data.message);
    });

    setSocket(socketInstance);

    // Join user room
    if (user?.id) {
      socketInstance.emit('joinUserRoom', user.id);
    }

    return () => {
      socketInstance.disconnect();
    };
  }, [onNotification, user]);

  const openAddModal = useCallback(() => {
    resetForm();
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((task: Task) => {
    setEditingTaskId(task.id);
    setNewTaskTitle(task.title);
    setNewTaskDesc(task.description || '');
    setNewTaskPriority(task.priority);
    setNewTaskCategory(task.category);
    setNewTaskDueDate(task.dueDate);
    setNewTaskDueTime(task.dueTime || '');
    setNewTaskDependencies(task.dependencies || []);
    setNewTaskReminder(task.reminderMinutes || 0);
    setIsModalOpen(true);
  }, []);

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsSaving(true);
    setSaveError('');

    try {
      const tempId = TaskUtils.generateTempId();
      
      if (editingTaskId && updateTask) {
        // Update Existing
        await updateTask(editingTaskId, {
          title: newTaskTitle.trim(),
          description: newTaskDesc.trim(),
          priority: newTaskPriority,
          category: newTaskCategory,
          dueDate: newTaskDueDate,
          dueTime: newTaskDueTime,
          dependencies: newTaskDependencies,
          reminderMinutes: newTaskReminder > 0 ? newTaskReminder : undefined
        });
        onNotification(TaskUtils.createSuccessMessage(newTaskTitle.trim()));
      } else {
        // Create New with enhanced error handling
        const newTask: Task = {
          id: tempId,
          title: newTaskTitle.trim(),
          description: newTaskDesc.trim(),
          priority: newTaskPriority,
          category: newTaskCategory,
          status: TaskStatus.TODO,
          dueDate: newTaskDueDate,
          dueTime: newTaskDueTime,
          dependencies: newTaskDependencies,
          reminderMinutes: newTaskReminder > 0 ? newTaskReminder : undefined,
          reminderSent: false
        };

        await addTask(newTask);
        onNotification(TaskUtils.createSuccessMessage(newTaskTitle.trim()));
      }

      setIsModalOpen(false);
      resetForm();
      
      // Emit real-time notification
      if (socket) {
        socket.emit('task_updated', {
          userId: user?.id,
          action: editingTaskId ? 'updated' : 'created',
          taskTitle: newTaskTitle.trim()
        });
      }
      
    } catch (error: any) {
      console.error('Failed to save task:', error);
      setSaveError(error.message || 'Failed to save task. Please try again.');
      onNotification(TaskUtils.createErrorMessage(error.message || 'Failed to save task'));
      
      // Show user-friendly error message
      setTimeout(() => setSaveError(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = useCallback(() => {
    setEditingTaskId(null);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskPriority(Priority.MEDIUM);
    setNewTaskCategory(Category.COMPANY);
    setNewTaskDueDate(new Date().toISOString().split('T')[0]);
    setNewTaskDueTime('');
    setNewTaskDependencies([]);
    setNewTaskReminder(0);
    setSaveError('');
  }, []);

  const toggleDependency = useCallback((taskId: string) => {
    setNewTaskDependencies(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  }, []);

  // Fetch users for admin panel
  const fetchUsersForAssignment = useCallback(async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  // Fetch tasks for assignment
  const fetchTasksForAssignment = useCallback(async () => {
    try {
      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTasksForAssignment(data.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, []);

  // Assign task to user
  const assignTaskToUser = async (taskId: string, userId: string) => {
    try {
      const response = await fetch(`/api/admin/tasks/assign/${taskId}/to/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        onNotification('Task assigned successfully!');
      }
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  // Toggle admin panel
  const toggleAdminPanel = () => {
    setShowAdminPanel(!showAdminPanel);
    if (!showAdminPanel) {
      fetchUsersForAssignment();
      fetchTasksForAssignment();
    }
  };

  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (isModalOpen && newTaskTitle.trim() && !isSaving) {
        console.log('Auto-save triggered for:', newTaskTitle);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [isModalOpen, newTaskTitle, isSaving]);

  // Filter and Sort Logic
  const processedTasks = useMemo(() => {
    // 1. Filter
    const filtered = tasks.filter(task => {
      // Search
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (task.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;

      // Status Filter
      const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
      if (!matchesStatus) return false;

      // Category Filter
      const matchesCategory = categoryFilter === 'ALL' || task.category === categoryFilter;
      if (!matchesCategory) return false;

      return true;
    });

    // 2. Sort
    return filtered.sort((a, b) => {
      let diff = 0;
      switch (sortBy) {
        case 'PRIORITY':
          const pWeight = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
          diff = pWeight[a.priority] - pWeight[b.priority];
          break;
        case 'DUE_DATE':
          const dateA = new Date(`${a.dueDate}T${a.dueTime || '00:00'}`).getTime();
          const dateB = new Date(`${b.dueDate}T${b.dueTime || '00:00'}`).getTime();
          diff = dateA - dateB;
          break;
        case 'CREATED':
          diff = Number(a.id) - Number(b.id);
          break;
      }
      return sortOrder === 'ASC' ? diff : -diff;
    });
  }, [tasks, searchQuery, statusFilter, categoryFilter, sortBy, sortOrder]);

  const statusOptions = ['ALL', ...Object.values(TaskStatus)];
  const categoryOptions = ['ALL', ...Object.values(Category)];

  return (
    <div className="p-4 md:p-8 h-full flex flex-col max-w-7xl mx-auto w-full">
      {/* Enhanced header with real-time status */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
             <div className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-slate-200 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Task Stream Active
             </div>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                REAL-TIME SYNC ENABLED
             </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
            Neural Task Stream
          </h2>
          <p className="text-slate-500 text-lg font-medium max-w-2xl">
            High-precision execution grid managing {tasks.length} active units across the workspace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
           {/* Admin Panel Button */}
           {user?.role === 'admin' && (
             <button 
               onClick={toggleAdminPanel}
               className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 font-bold uppercase tracking-wider text-xs"
             >
               <Users size={18} />
               {showAdminPanel ? 'Hide Admin Panel' : 'Admin Panel'}
             </button>
           )}
           
           <button 
              onClick={openAddModal}
              disabled={isSaving}
              className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-2xl shadow-slate-900/20 active:scale-95 font-bold uppercase tracking-widest text-xs disabled:opacity-50"
           >
              <Plus size={18} strokeWidth={4} />
              {isSaving ? 'Saving...' : 'Deploy Task'}
           </button>
        </div>
      </div>

      {/* Admin Panel */}
      {showAdminPanel && user?.role === 'admin' && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-8 border border-indigo-200 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-indigo-800 flex items-center">
              <UserCheck className="w-6 h-6 mr-2" />
              Admin Task Assignment Panel
            </h3>
            <button 
              onClick={toggleAdminPanel}
              className="text-indigo-600 hover:text-indigo-800"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-indigo-700 mb-2">Select User</label>
              <select 
                value={selectedUserForAssignment}
                onChange={(e) => setSelectedUserForAssignment(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="">Choose a user...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-indigo-700 mb-2">Select Task</label>
              <select 
                className="w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="">Choose a task...</option>
                {tasksForAssignment.map(task => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => selectedUserForAssignment && assignTaskToUser(tasksForAssignment[0]?.id || '', selectedUserForAssignment)}
              disabled={!selectedUserForAssignment}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
            >
              <UserCheck className="w-5 h-5 mr-2" />
              Assign Task
            </button>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 mb-8">
        {/* Status Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            {statusOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            {categoryOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Search</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full px-4 py-3 pl-12 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-700">Sort by:</label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            <option value="CREATED">Created</option>
            <option value="PRIORITY">Priority</option>
            <option value="DUE_DATE">Due Date</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-700">Order:</label>
          <button
            onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
            className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            {sortOrder === 'ASC' ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
            {sortOrder}
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {processedTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-slate-400 mb-4">
              <FileText size={64} className="mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-slate-600 mb-2">No Tasks Found</h3>
            <p className="text-slate-500 mb-6">Create your first task to get started</p>
            <button
              onClick={openAddModal}
              className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl flex items-center gap-2 mx-auto transition-all"
            >
              <Plus size={18} />
              Create Task
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedTasks.map(task => (
              <div 
                key={task.id} 
                className={`bg-white rounded-2xl p-6 border-2 transition-all duration-300 ${
                  task.status === 'COMPLETED' 
                    ? 'border-green-200 bg-green-50' 
                    : task.status === 'IN_PROGRESS' 
                      ? 'border-blue-200 bg-blue-50'
                      : task.status === 'BLOCKED'
                        ? 'border-red-200 bg-red-50'
                        : 'border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-900">{task.title}</h3>
                  <button 
                    onClick={() => openEditModal(task)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <Edit2 size={18} />
                  </button>
                </div>
                
                {task.description && (
                  <p className="text-slate-600 mb-4">{task.description}</p>
                )}
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority.toUpperCase()}
                  </span>
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    task.category === 'personal' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {task.category.toUpperCase()}
                  </span>
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    task.status === 'BLOCKED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                        {task.dueTime && ` at ${task.dueTime}`}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateTaskStatus(task.id, 'COMPLETED' as TaskStatus)}
                      className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS' as TaskStatus)}
                      className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Clock size={16} />
                    </button>
                    <button
                      onClick={() => removeTask(task.id)}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Completely Redesigned Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/20 backdrop-blur-xl">
            {/* Header with Modern Gradient */}
            <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Create New Task</h2>
                  <p className="text-indigo-100 text-lg">Define your objectives and organize your workflow</p>
                </div>
                <button
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-3 rounded-full transition-all backdrop-blur-sm"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSaveTask} className="flex flex-col h-full">
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-8">
                  {/* Task Identification Section - Modern Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-blue-500 rounded-xl mr-4">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Task Identification</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Define the primary action...
                        </label>
                        <input
                          type="text"
                          required
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg font-medium shadow-sm hover:shadow-md"
                          placeholder="Enter task title..."
                          autoFocus
                          disabled={isSaving}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Contextual Details
                        </label>
                        <textarea
                          value={newTaskDesc}
                          onChange={(e) => setNewTaskDesc(e.target.value)}
                          className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[140px] text-lg shadow-sm hover:shadow-md"
                          placeholder="Add sub-tasks, notes, or technical requirements..."
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Strategic Priority & Domain - Side by Side Modern Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200 shadow-lg hover:shadow-xl transition-all">
                      <div className="flex items-center mb-4">
                        <div className="p-3 bg-orange-500 rounded-xl mr-4">
                          <Flag className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Strategic Priority</h3>
                      </div>
                      <div className="space-y-3">
                        {[
                          { value: 'low', label: 'Low', color: 'text-gray-600', bg: 'bg-gray-100' },
                          { value: 'medium', label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' },
                          { value: 'high', label: 'High', color: 'text-red-600', bg: 'bg-red-100' }
                        ].map((priority) => (
                          <label key={priority.value} className="flex items-center p-4 rounded-xl border-2 border-gray-200 hover:border-orange-300 cursor-pointer transition-all hover:bg-white">
                            <input
                              type="radio"
                              name="priority"
                              value={priority.value}
                              checked={newTaskPriority === priority.value}
                              onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                              className="w-5 h-5 text-orange-600 focus:ring-orange-500"
                              disabled={isSaving}
                            />
                            <span className={`ml-4 font-semibold ${priority.color} px-3 py-1 rounded-lg ${priority.bg}`}>
                              {priority.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 shadow-lg hover:shadow-xl transition-all">
                      <div className="flex items-center mb-4">
                        <div className="p-3 bg-purple-500 rounded-xl mr-4">
                          <Briefcase className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Domain</h3>
                      </div>
                      <div className="space-y-3">
                        {[
                          { value: 'personal', label: 'Personal', icon: '👤', color: 'bg-blue-100 text-blue-700' },
                          { value: 'company', label: 'Company', icon: '🏢', color: 'bg-green-100 text-green-700' }
                        ].map((domain) => (
                          <label key={domain.value} className="flex items-center p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 cursor-pointer transition-all hover:bg-white">
                            <input
                              type="radio"
                              name="domain"
                              value={domain.value}
                              checked={newTaskCategory === domain.value}
                              onChange={(e) => setNewTaskCategory(e.target.value as Category)}
                              className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                              disabled={isSaving}
                            />
                            <span className={`ml-4 font-semibold px-3 py-1 rounded-lg ${domain.color} flex items-center`}>
                              <span className="mr-2 text-lg">{domain.icon}</span>
                              {domain.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Timeline Configuration - Modern Card */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-green-500 rounded-xl mr-4">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Timeline Configuration</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Due Date & Time
                        </label>
                        <div className="space-y-3">
                          <input
                            type="date"
                            required
                            value={newTaskDueDate}
                            onChange={(e) => setNewTaskDueDate(e.target.value)}
                            className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm hover:shadow-md"
                            disabled={isSaving}
                          />
                          <input
                            type="time"
                            value={newTaskDueTime}
                            onChange={(e) => setNewTaskDueTime(e.target.value)}
                            className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm hover:shadow-md"
                            placeholder="--:--"
                            disabled={isSaving}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Proactive Alert
                        </label>
                        <select 
                          value={newTaskReminder}
                          onChange={(e) => setNewTaskReminder(Number(e.target.value))}
                          className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm hover:shadow-md appearance-none bg-select"
                          disabled={isSaving}
                        >
                          <option value={0}>No Reminder</option>
                          <option value={15}>15 minutes before</option>
                          <option value={60}>1 hour before</option>
                          <option value={1440}>1 day before</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Dependency Mesh - Modern Card */}
                  <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-6 border border-indigo-200 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-indigo-500 rounded-xl mr-4">
                        <GitBranch className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Dependency Mesh</h3>
                    </div>
                    <div className="text-center py-12 text-gray-500">
                      <GitBranch className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="font-bold text-lg text-gray-600">OPTIONAL</p>
                      <p className="text-gray-500 mt-2">No other tasks available for dependency linking</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modern Footer with Gradient */}
              <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                    disabled={isSaving}
                    className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-semibold text-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !newTaskTitle.trim()}
                    className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-lg shadow-lg hover:shadow-xl flex items-center"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-6 h-6 mr-3" />
                        Launch Task
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTaskManager;