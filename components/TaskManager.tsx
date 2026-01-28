
import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, Priority, Category } from '../types';
// Added Save to the list of imports from lucide-react
import { Plus, Trash2, Filter, Calendar, AlertTriangle, Link, Lock, X, Flag, Tag, Check, Bell, Clock, Edit2, Search, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown, Save } from 'lucide-react';
import { format, isPast, isToday, isValid } from 'date-fns';

interface TaskManagerProps {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  removeTask: (id: string) => void;
  updateTask?: (id: string, updates: Partial<Task>) => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({ tasks, addTask, updateTaskStatus, removeTask, updateTask }) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Sort State
  type SortOption = 'PRIORITY' | 'DUE_DATE' | 'CREATED';
  const [sortBy, setSortBy] = useState<SortOption>('CREATED');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  
  // Edit State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  
  // Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.MEDIUM);
  const [newTaskCategory, setNewTaskCategory] = useState<Category>(Category.COMPANY);
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskDueTime, setNewTaskDueTime] = useState('');
  const [newTaskDependencies, setNewTaskDependencies] = useState<string[]>([]);
  const [newTaskReminder, setNewTaskReminder] = useState<number>(0);

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
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
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;

    if (editingTaskId && updateTask) {
      // Update Existing
      updateTask(editingTaskId, {
        title: newTaskTitle,
        description: newTaskDesc,
        priority: newTaskPriority,
        category: newTaskCategory,
        dueDate: newTaskDueDate,
        dueTime: newTaskDueTime,
        dependencies: newTaskDependencies,
        reminderMinutes: newTaskReminder > 0 ? newTaskReminder : undefined
      });
    } else {
      // Create New
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle,
        description: newTaskDesc,
        priority: newTaskPriority,
        category: newTaskCategory,
        status: TaskStatus.TODO,
        dueDate: newTaskDueDate,
        dueTime: newTaskDueTime,
        dependencies: newTaskDependencies,
        reminderMinutes: newTaskReminder > 0 ? newTaskReminder : undefined,
        reminderSent: false
      };
      addTask(newTask);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingTaskId(null);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskPriority(Priority.MEDIUM);
    setNewTaskCategory(Category.COMPANY);
    setNewTaskDueDate(new Date().toISOString().split('T')[0]);
    setNewTaskDueTime('');
    setNewTaskDependencies([]);
    setNewTaskReminder(0);
  };

  const toggleDependency = (taskId: string) => {
    setNewTaskDependencies(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

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

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.HIGH: return 'text-red-700 bg-red-100 border-red-300';
      case Priority.MEDIUM: return 'text-amber-800 bg-amber-100 border-amber-300';
      case Priority.LOW: return 'text-emerald-800 bg-emerald-100 border-emerald-300';
      default: return 'text-slate-700 bg-slate-100 border-slate-300';
    }
  };

  const getPriorityBorder = (p: Priority) => {
    switch (p) {
      case Priority.HIGH: return 'border-l-red-600 shadow-[inset_4px_0_0_0_rgba(220,38,38,0.1)]';
      case Priority.MEDIUM: return 'border-l-amber-500 shadow-[inset_4px_0_0_0_rgba(245,158,11,0.1)]';
      case Priority.LOW: return 'border-l-emerald-500 shadow-[inset_4px_0_0_0_rgba(16,185,129,0.1)]';
      default: return 'border-l-slate-200';
    }
  };

  const formatDateDisplay = (dateStr: string, timeStr?: string) => {
    try {
      const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
      if (!isValid(date)) return dateStr;
      const base = isToday(date) ? 'Today' : format(date, 'MMM d');
      return timeStr ? `${base}, ${timeStr}` : base;
    } catch {
      return dateStr;
    }
  };

  const getDateStatusColor = (task: Task) => {
    if (task.status === TaskStatus.DONE) return 'text-slate-400';
    try {
      const date = new Date(task.dueDate + 'T00:00:00');
      if (isPast(date) && !isToday(date)) return 'text-red-600 font-semibold';
      if (isToday(date)) return 'text-amber-600 font-semibold';
      return 'text-slate-500';
    } catch {
      return 'text-slate-500';
    }
  };

  const getDependencyStatus = (task: Task) => {
    if (!task.dependencies || task.dependencies.length === 0) return { isBlocked: false, blockingTasks: [] };
    
    const blockingTasks = task.dependencies
      .map(id => tasks.find(t => t.id === id))
      .filter(t => t && t.status !== TaskStatus.DONE) as Task[];
      
    return {
      isBlocked: blockingTasks.length > 0,
      blockingTasks
    };
  };

  const getReminderLabel = (minutes?: number) => {
    if (!minutes) return 'No reminder';
    if (minutes === 15) return '15m before';
    if (minutes === 60) return '1h before';
    if (minutes === 1440) return '1d before';
    return `${minutes}m before`;
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col max-w-7xl mx-auto w-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">My Tasks</h2>
          <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">Stay organized and track your progress across personal and company categories.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="w-full md:w-auto bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-95 font-bold"
        >
          <Plus size={20} strokeWidth={3} />
          New Task
        </button>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col gap-5 mb-8">
         {/* Search & Sort Row */}
         <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Filter by title, description..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 transition-all shadow-sm font-medium"
                />
            </div>
            
            {/* Sort Controls */}
            <div className="flex items-center gap-2 shrink-0">
                <div className="relative">
                   <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="appearance-none bg-white border border-slate-200 rounded-2xl pl-4 pr-10 py-3 text-sm font-bold text-slate-700 outline-none focus:border-slate-400 transition-all hover:bg-slate-50 cursor-pointer shadow-sm"
                   >
                      <option value="CREATED">Created</option>
                      <option value="DUE_DATE">Due Date</option>
                      <option value="PRIORITY">Priority</option>
                   </select>
                   <ArrowUpDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                
                <button 
                  onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm"
                  title={sortOrder === 'ASC' ? 'Ascending' : 'Descending'}
                >
                   {sortOrder === 'ASC' ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                </button>
             </div>
         </div>
         
         {/* Advanced Filters Panel */}
         <div className="flex flex-col gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-200 shadow-inner">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">Status</span>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {statusOptions.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => setStatusFilter(opt)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                                statusFilter === opt 
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="hidden md:block w-px h-8 bg-slate-200 mx-2" />

                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">Category</span>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {categoryOptions.map((opt) => {
                            const isActive = categoryFilter === opt;
                            let colorClasses = isActive 
                                ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300';
                            
                            if (isActive && opt === Category.COMPANY) colorClasses = 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/10';
                            if (isActive && opt === Category.PERSONAL) colorClasses = 'bg-cyan-600 text-white border-cyan-600 shadow-lg shadow-cyan-600/10';

                            return (
                                <button
                                    key={opt}
                                    onClick={() => setCategoryFilter(opt)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${colorClasses}`}
                                >
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
         </div>
      </div>

      {/* Task List Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-24 pr-1 custom-scrollbar">
        {processedTasks.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-32 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
             <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 mb-6 shadow-sm border border-slate-100">
                <Check size={40} strokeWidth={3} />
             </div>
             <p className="text-slate-900 font-black text-xl tracking-tight">Workspace clear</p>
             <p className="text-slate-400 text-sm mt-2 font-medium">No tasks match your current configuration.</p>
           </div>
        ) : (
          processedTasks.map(task => {
            const dateColorClass = getDateStatusColor(task);
            const isOverdue = task.status !== TaskStatus.DONE && isPast(new Date(task.dueDate + 'T00:00:00')) && !isToday(new Date(task.dueDate + 'T00:00:00'));
            const { isBlocked, blockingTasks } = getDependencyStatus(task);
            
            return (
            <div key={task.id} className={`group bg-white p-6 rounded-[2rem] border border-slate-200 border-l-[8px] ${getPriorityBorder(task.priority)} shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 relative overflow-hidden`}>
               <div className="flex items-start gap-5 relative z-10">
                  {/* Status Checkbox */}
                  <button 
                    onClick={() => updateTaskStatus(task.id, task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE)}
                    className={`mt-1.5 shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                         task.status === TaskStatus.DONE 
                           ? 'bg-emerald-500 border-emerald-500 text-white' 
                           : 'border-slate-300 hover:border-emerald-500 text-transparent hover:text-emerald-100'
                       }`}
                  >
                     <Check size={14} strokeWidth={4} fill="currentColor" className={task.status !== TaskStatus.DONE ? 'opacity-0 scale-75' : 'scale-100 opacity-100'} />
                  </button>

                  <div className="flex-1 min-w-0 pt-0.5">
                     {/* Title & Description */}
                     <div className="mb-4">
                        <h4 className={`text-lg font-black text-slate-900 leading-tight tracking-tight ${task.status === TaskStatus.DONE ? 'line-through text-slate-300 decoration-slate-200' : ''}`}>
                           {task.title}
                        </h4>
                        {task.description && <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed font-medium">{task.description}</p>}
                     </div>

                     {/* Distinct Priority & Info Badges */}
                     <div className="flex flex-wrap items-center gap-3">
                        {/* High Contrast Priority Badge */}
                        <span className={`px-3 py-1 text-[10px] uppercase tracking-[0.1em] font-black rounded-full border shadow-sm flex items-center gap-1.5 ${getPriorityColor(task.priority)}`}>
                           <Flag size={10} fill="currentColor" />
                           {task.priority}
                        </span>
                        
                        {/* Category Badge */}
                        <span className={`px-3 py-1 text-[10px] uppercase tracking-[0.1em] font-black rounded-full border shadow-sm ${task.category === Category.COMPANY ? 'text-purple-700 bg-purple-50 border-purple-200' : 'text-cyan-700 bg-cyan-50 border-cyan-200'}`}>
                           {task.category}
                        </span>

                        {task.reminderMinutes && (
                           <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100" title={`Reminder set: ${getReminderLabel(task.reminderMinutes)}`}>
                                 <Bell size={10} /> {getReminderLabel(task.reminderMinutes)}
                           </span>
                        )}
                        
                        {isOverdue && (
                           <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200 animate-pulse">
                                 <AlertTriangle size={10} /> Overdue
                           </span>
                        )}
                        
                        {isBlocked && (
                           <div className="group/tooltip relative">
                                 <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 cursor-help">
                                    <Lock size={10} /> Blocked
                                 </span>
                                 <div className="absolute bottom-full left-0 mb-3 w-64 p-4 bg-slate-900 text-white text-xs rounded-2xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-20 pointer-events-none border border-slate-800">
                                    <p className="font-black mb-2 text-slate-400 uppercase tracking-widest text-[9px]">Dependency Block:</p>
                                    <ul className="space-y-2">
                                       {blockingTasks.map(bt => (
                                          <li key={bt.id} className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                            <span className="font-bold truncate">{bt.title}</span>
                                          </li>
                                       ))}
                                    </ul>
                                 </div>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Actions & Meta Info */}
                  <div className="flex flex-col items-end gap-4 shrink-0 pl-2">
                     <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-tight ${dateColorClass}`}>
                        <Calendar size={14} className="opacity-75" />
                        <span>{formatDateDisplay(task.dueDate, task.dueTime)}</span>
                     </div>
                     
                     {/* Floating Action Buttons */}
                     <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                        <button 
                           onClick={() => openEditModal(task)}
                           className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 bg-slate-50 rounded-xl transition-all border border-transparent hover:border-indigo-100 shadow-sm"
                           title="Edit Task"
                        >
                           <Edit2 size={16} strokeWidth={3} />
                        </button>
                        <button 
                           onClick={() => removeTask(task.id)}
                           className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 bg-slate-50 rounded-xl transition-all border border-transparent hover:border-red-100 shadow-sm"
                           title="Delete Task"
                        >
                           <Trash2 size={16} strokeWidth={3} />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
            )
          })
        )}
      </div>

      {/* Add/Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all">
            <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl animate-fade-in overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${editingTaskId ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-900 text-white shadow-lg shadow-slate-200'}`}>
                    {editingTaskId ? <Edit2 size={24} strokeWidth={3} /> : <Plus size={24} strokeWidth={3} />}
                </div>
                {editingTaskId ? 'Edit Objective' : 'New Objective'}
                </h3>
                <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-full transition-all"
                >
                <X size={24} strokeWidth={3} />
                </button>
            </div>

            <form onSubmit={handleSaveTask} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
                    {/* Title Input */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Task Identification</label>
                        <input 
                        type="text" 
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 focus:bg-white transition-all outline-none placeholder:text-slate-300 text-lg"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Define the primary action..."
                        autoFocus
                        />
                    </div>

                    {/* Grid for Priority & Category */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Strategic Priority</label>
                            <div className="relative">
                                <select 
                                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl p-4 pr-10 text-slate-700 font-bold focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 outline-none transition-all"
                                    value={newTaskPriority}
                                    onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                                >
                                    {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <Flag className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Domain</label>
                            <div className="relative">
                                <select 
                                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl p-4 pr-10 text-slate-700 font-bold focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 outline-none transition-all"
                                    value={newTaskCategory}
                                    onChange={(e) => setNewTaskCategory(e.target.value as Category)}
                                >
                                    {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <Tag className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Deadline & Reminder Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Due Date & Time</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input 
                                    type="date" 
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-slate-700 font-bold focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 outline-none transition-all"
                                    value={newTaskDueDate}
                                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                                    />
                                    <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                                <div className="relative w-32">
                                    <input 
                                    type="time" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-bold focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 outline-none transition-all"
                                    value={newTaskDueTime}
                                    onChange={(e) => setNewTaskDueTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Proactive Alert</label>
                            <div className="relative">
                                <select 
                                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl p-4 pr-10 text-slate-700 font-bold focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 outline-none transition-all"
                                    value={newTaskReminder}
                                    onChange={(e) => setNewTaskReminder(parseInt(e.target.value))}
                                >
                                    <option value={0}>No Reminder</option>
                                    <option value={15}>15m Before</option>
                                    <option value={60}>1h Before</option>
                                    <option value={1440}>24h Before</option>
                                </select>
                                <Bell className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contextual Details</label>
                        <textarea 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-medium focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 focus:bg-white outline-none transition-all resize-none min-h-[100px] placeholder:text-slate-300"
                        value={newTaskDesc}
                        onChange={(e) => setNewTaskDesc(e.target.value)}
                        placeholder="Add sub-tasks, notes, or technical requirements..."
                        />
                    </div>

                    {/* Dependencies */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 flex justify-between items-center">
                            <span>Dependency Mesh</span>
                            <span className="bg-slate-100 text-slate-500 text-[8px] px-2 py-0.5 rounded-full font-black border border-slate-200">OPTIONAL</span>
                        </label>
                        
                        <div className="border border-slate-200 rounded-[2rem] overflow-hidden bg-slate-50/30">
                            <div className="max-h-40 overflow-y-auto p-2 custom-scrollbar">
                                {tasks.filter(t => t.id !== editingTaskId).length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-xs italic font-medium">Zero alternative nodes detected.</div>
                                ) : (
                                    tasks.filter(t => t.id !== editingTaskId).map(t => (
                                        <label key={t.id} className={`flex items-center gap-4 p-3.5 rounded-2xl cursor-pointer transition-all border border-transparent group mb-1 last:mb-0 ${newTaskDependencies.includes(t.id) ? 'bg-indigo-50/50 border-indigo-100 shadow-sm' : 'hover:bg-white hover:shadow-sm'}`}>
                                            <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 ${newTaskDependencies.includes(t.id) ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'border-slate-200 bg-white group-hover:border-slate-400'}`}>
                                                {newTaskDependencies.includes(t.id) && <Check size={14} strokeWidth={4} />}
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                className="hidden"
                                                checked={newTaskDependencies.includes(t.id)}
                                                onChange={() => toggleDependency(t.id)}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-sm font-bold truncate ${newTaskDependencies.includes(t.id) ? 'text-indigo-900' : 'text-slate-700'}`}>{t.title}</div>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-end gap-3 px-8">
                    <button 
                        type="button" 
                        onClick={() => { setIsModalOpen(false); resetForm(); }}
                        className="px-6 py-3 text-slate-600 font-bold hover:bg-white hover:shadow-sm hover:text-slate-900 rounded-2xl transition-all text-sm uppercase tracking-widest border border-transparent hover:border-slate-200"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black shadow-xl shadow-slate-900/10 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center gap-2"
                    >
                        {editingTaskId ? <Save size={18} /> : <Plus size={18} strokeWidth={3} />}
                        {editingTaskId ? 'Commit Changes' : 'Initialize Task'}
                    </button>
                </div>
            </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;
