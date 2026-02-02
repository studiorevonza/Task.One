
import React, { useState, useMemo, useEffect } from 'react';
import { Project, Category, Task, TaskStatus, Priority, ProjectMilestone } from '../types';
import { Briefcase, User, Plus, Calendar, ArrowLeft, Trash2, Edit2, X, FolderPlus, Tag, AlignLeft, Save, Flag, CheckSquare, ClipboardList, Check, Trophy, Search, Clock } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

interface ProjectManagerProps {
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  initialSelectedId?: string | null;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ 
  projects, 
  addProject, 
  updateProject, 
  removeProject, 
  tasks,
  addTask,
  updateTask,
  removeTask,
  updateTaskStatus,
  initialSelectedId
}) => {
  // Views: 'LIST' | 'DETAIL'
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialSelectedId || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Synchronize state if initialSelectedId changes
  useEffect(() => {
    if (initialSelectedId) {
      setSelectedProjectId(initialSelectedId);
    }
  }, [initialSelectedId]);

  // Form State for Project
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<Category>(Category.COMPANY);
  const [formPriority, setFormPriority] = useState<Priority>(Priority.MEDIUM);
  const [formDueDate, setFormDueDate] = useState('');

  // Inline Task Add State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // Criteria State
  const [newCriterion, setNewCriterion] = useState('');

  // Milestone State
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');

  // Derived Data
  const selectedProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId), 
  [projects, selectedProjectId]);

  const projectTasks = useMemo(() => 
    tasks.filter(t => t.projectId === selectedProjectId),
  [tasks, selectedProjectId]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  const progress = useMemo(() => {
    if (projectTasks.length === 0) return selectedProject?.progress || 0;
    const completed = projectTasks.filter(t => t.status === TaskStatus.DONE).length;
    return Math.round((completed / projectTasks.length) * 100);
  }, [projectTasks, selectedProject]);

  // Handlers
  const openCreateModal = () => {
    setFormName('');
    setFormDesc('');
    setFormCategory(Category.COMPANY);
    setFormPriority(Priority.MEDIUM);
    setFormDueDate('');
    setIsCreateModalOpen(true);
  };

  const openEditModal = () => {
    if (!selectedProject) return;
    setFormName(selectedProject.name);
    setFormDesc(selectedProject.description);
    setFormCategory(selectedProject.category);
    setFormPriority(selectedProject.priority);
    setFormDueDate(selectedProject.dueDate);
    setIsEditModalOpen(true);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    const newProject: Project = {
      id: Date.now().toString(),
      name: formName,
      description: formDesc,
      category: formCategory,
      priority: formPriority,
      dueDate: formDueDate || new Date().toISOString().split('T')[0],
      progress: 0,
      milestones: []
    };

    addProject(newProject);
    setIsCreateModalOpen(false);
  };

  const handleUpdateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    updateProject(selectedProject.id, {
      name: formName,
      description: formDesc,
      category: formCategory,
      priority: formPriority,
      dueDate: formDueDate
    });
    setIsEditModalOpen(false);
  };

  const handleDeleteProject = () => {
    if (!selectedProject) return;
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      removeProject(selectedProject.id);
      setSelectedProjectId(null);
    }
  };

  const handleAddTaskToProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedProject) return;

    addTask({
      id: Date.now().toString(),
      projectId: selectedProject.id,
      title: newTaskTitle,
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      category: selectedProject.category,
      dueDate: selectedProject.dueDate, // Default to project due date
    } as Task);
    setNewTaskTitle('');
  };
  
  const handleAddCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCriterion.trim() || !selectedProject) return;

    const criterion = {
        id: Date.now().toString(),
        text: newCriterion,
        completed: false
    };

    const updatedCriteria = [...(selectedProject.completionCriteria || []), criterion];
    updateProject(selectedProject.id, { completionCriteria: updatedCriteria });
    setNewCriterion('');
  };

  const toggleCriterion = (criterionId: string) => {
    if (!selectedProject) return;
    const updatedCriteria = (selectedProject.completionCriteria || []).map(c => 
        c.id === criterionId ? { ...c, completed: !c.completed } : c
    );
    updateProject(selectedProject.id, { completionCriteria: updatedCriteria });
  };

  const deleteCriterion = (criterionId: string) => {
    if (!selectedProject) return;
    const updatedCriteria = (selectedProject.completionCriteria || []).filter(c => c.id !== criterionId);
    updateProject(selectedProject.id, { completionCriteria: updatedCriteria });
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneText.trim() || !newMilestoneDate || !selectedProject) return;

    const milestone: ProjectMilestone = {
      id: Date.now().toString(),
      text: newMilestoneText,
      dueDate: newMilestoneDate,
      completed: false
    };

    const updatedMilestones = [...(selectedProject.milestones || []), milestone].sort((a, b) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    
    updateProject(selectedProject.id, { milestones: updatedMilestones });
    setNewMilestoneText('');
    setNewMilestoneDate('');
  };

  const toggleMilestone = (milestoneId: string) => {
    if (!selectedProject) return;
    const updatedMilestones = (selectedProject.milestones || []).map(m => 
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    updateProject(selectedProject.id, { milestones: updatedMilestones });
  };

  const deleteMilestone = (milestoneId: string) => {
    if (!selectedProject) return;
    const updatedMilestones = (selectedProject.milestones || []).filter(m => m.id !== milestoneId);
    updateProject(selectedProject.id, { milestones: updatedMilestones });
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.HIGH: return 'text-red-600 bg-red-50 border-red-100';
      case Priority.MEDIUM: return 'text-amber-600 bg-amber-50 border-amber-100';
      case Priority.LOW: return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'No Date';
    try {
      const date = new Date(dateStr + 'T00:00:00');
      if (isToday(date)) return 'Today';
      return format(date, 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  if (selectedProject) {
    const overdueMilestones = (selectedProject.milestones || []).filter(m => !m.completed && isPast(new Date(m.dueDate)) && !isToday(new Date(m.dueDate))).length;
    const pendingTasks = projectTasks.filter(t => t.status !== TaskStatus.DONE).length;

    return (
      <div className="flex-1 overflow-y-auto bg-slate-50/50 custom-scrollbar">
        {/* Real-time Project Command Header */}
        <div className="px-4 md:px-8 py-8 border-b border-slate-200 bg-white sticky top-0 z-20 backdrop-blur-md bg-white/90">
          <div className="max-w-6xl mx-auto w-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedProjectId(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all active:scale-95"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                <div className="hidden md:flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mission Start</span>
                  <span className="text-xs font-bold text-slate-700">{format(currentTime, 'HH:mm:ss')} · LIVE SYNC</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center gap-6 mr-4">
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Health</p>
                      <p className={`text-xs font-black uppercase ${overdueMilestones > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{overdueMilestones > 0 ? 'Critical' : 'Optimal'}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Load</p>
                      <p className="text-xs font-black text-slate-700 uppercase">{pendingTasks} Active Units</p>
                   </div>
                </div>
                <button 
                  onClick={openEditModal}
                  className="p-2.5 bg-slate-50 text-slate-600 hover:bg-white hover:shadow-md border border-slate-200 rounded-xl transition-all active:scale-95"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={handleDeleteProject}
                  className="p-2.5 bg-red-50 text-red-600 hover:bg-white hover:shadow-md border border-red-100 rounded-xl transition-all active:scale-95"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-end">
              <div className="flex-1 min-w-0">
                 <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5 ${selectedProject.category === Category.COMPANY ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                      {selectedProject.category === Category.COMPANY ? <Briefcase size={12} /> : <User size={12} />}
                      {selectedProject.category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5 ${getPriorityColor(selectedProject.priority)}`}>
                      <Flag size={12} fill="currentColor" />
                      {selectedProject.priority} Priority
                    </span>
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-slate-200">
                       <Clock size={12} />
                       Due in {Math.max(0, Math.ceil((new Date(selectedProject.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} Days
                    </div>
                 </div>
                 <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4 break-words">{selectedProject.name}</h1>
                 <p className="text-slate-500 text-lg leading-relaxed max-w-3xl font-medium">{selectedProject.description}</p>
              </div>

              <div className="w-full lg:w-80 shrink-0">
                  <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/30 transition-colors"></div>
                     <div className="relative z-10">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Efficiency Score</span>
                           <span className="text-3xl font-bold">{progress}%</span>
                        </div>
                        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden mb-6 shadow-inner">
                           <div 
                             className="h-full bg-indigo-500 transition-all duration-1000 ease-out rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                             style={{ width: `${progress}%` }}
                           />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Finalized</p>
                              <p className="text-lg font-bold">{projectTasks.filter(t => t.status === TaskStatus.DONE).length}</p>
                           </div>
                           <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">In Queue</p>
                              <p className="text-lg font-bold">{pendingTasks}</p>
                           </div>
                        </div>
                     </div>
                  </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                       <Trophy size={22} className="text-amber-500" />
                       Project Milestones
                       <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">{(selectedProject.milestones || []).filter(m => m.completed).length}/{(selectedProject.milestones || []).length}</span>
                   </h3>
                </div>

                <div className="space-y-3 mb-6 flex-1 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                   {(!selectedProject.milestones || selectedProject.milestones.length === 0) && (
                      <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                         <Trophy size={32} className="mx-auto text-slate-300 mb-2 opacity-20" />
                         <p className="text-slate-400 text-sm italic">No milestones defined yet.</p>
                      </div>
                   )}
                   {(selectedProject.milestones || []).map(milestone => {
                      const overdue = !milestone.completed && isPast(new Date(milestone.dueDate)) && !isToday(new Date(milestone.dueDate));
                      return (
                        <div key={milestone.id} className={`group flex items-start gap-3 p-3.5 rounded-xl border transition-all ${milestone.completed ? 'bg-slate-50 border-slate-100' : overdue ? 'bg-red-50 border-red-100 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'}`}>
                          <button 
                            onClick={() => toggleMilestone(milestone.id)}
                            className={`w-5 h-5 mt-0.5 rounded-full border flex items-center justify-center transition-all shrink-0 ${milestone.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300 hover:border-slate-900'}`}
                          >
                             {milestone.completed && <Check size={12} strokeWidth={3} />}
                          </button>
                          <div className="flex-1 min-w-0">
                             <p className={`text-sm font-bold transition-all ${milestone.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                {milestone.text}
                             </p>
                             <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-bold flex items-center gap-1 ${overdue ? 'text-red-600' : 'text-slate-400'}`}>
                                   <Calendar size={10} />
                                   {format(new Date(milestone.dueDate), 'MMM d, yyyy')}
                                </span>
                                {overdue && <span className="text-[10px] font-black uppercase text-red-600 bg-red-100 px-1 rounded animate-pulse">Overdue</span>}
                             </div>
                          </div>
                          <button 
                            onClick={() => deleteMilestone(milestone.id)}
                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                          >
                             <Trash2 size={16} />
                          </button>
                        </div>
                      );
                   })}
                </div>

                <form onSubmit={handleAddMilestone} className="space-y-2 mt-auto pt-4 border-t border-slate-100">
                   <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Milestone title..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
                        value={newMilestoneText}
                        onChange={(e) => setNewMilestoneText(e.target.value)}
                      />
                      <input 
                        type="date" 
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all w-36"
                        value={newMilestoneDate}
                        onChange={(e) => setNewMilestoneDate(e.target.value)}
                      />
                   </div>
                   <button 
                      type="submit"
                      disabled={!newMilestoneText.trim() || !newMilestoneDate}
                      className="w-full bg-slate-900 text-white py-2 rounded-xl text-xs font-bold hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                   >
                      <Plus size={14} strokeWidth={3} /> Add Milestone
                   </button>
                </form>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                       <ClipboardList size={22} className="text-slate-400" />
                       Acceptance Criteria
                       <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">{(selectedProject.completionCriteria || []).filter(c => c.completed).length}/{(selectedProject.completionCriteria || []).length}</span>
                   </h3>
                </div>
                
                <div className="space-y-3 mb-6 flex-1 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                   {(!selectedProject.completionCriteria || selectedProject.completionCriteria.length === 0) && (
                      <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                         <ClipboardList size={32} className="mx-auto text-slate-300 mb-2 opacity-20" />
                         <p className="text-slate-400 text-sm italic">Define acceptance requirements here.</p>
                      </div>
                   )}
                   {(selectedProject.completionCriteria || []).map(criterion => (
                      <div key={criterion.id} className={`group flex items-center gap-3 p-3.5 rounded-xl border transition-all ${criterion.completed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'}`}>
                         <button 
                           onClick={() => toggleCriterion(criterion.id)}
                           className={`w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0 ${criterion.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300 hover:border-indigo-500'}`}
                         >
                            {criterion.completed && <Check size={12} strokeWidth={3} />}
                         </button>
                         <span className={`flex-1 text-sm font-bold transition-colors ${criterion.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                            {criterion.text}
                         </span>
                         <button 
                           onClick={() => deleteCriterion(criterion.id)}
                           className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>
                   ))}
                </div>

                <form onSubmit={handleAddCriterion} className="relative group mt-auto pt-4 border-t border-slate-100">
                   <input 
                      type="text" 
                      placeholder="Add a requirement..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all pr-12"
                      value={newCriterion}
                      onChange={(e) => setNewCriterion(e.target.value)}
                   />
                   <button 
                      type="submit"
                      disabled={!newCriterion.trim()}
                      className="absolute right-2 top-[calc(1rem+4px+50%)] -translate-y-1/2 bg-white p-1 rounded-lg text-slate-400 hover:text-indigo-600 disabled:opacity-0 transition-all shadow-sm border border-slate-100"
                   >
                      <Plus size={18} />
                   </button>
                </form>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare size={24} className="text-slate-400" />
                Project Tasks
                <span className="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{projectTasks.length}</span>
              </h3>
            </div>

            <div className="mb-6 relative group">
              <div className="absolute inset-0 bg-slate-50 rounded-xl border border-slate-200 transition-all group-focus-within:bg-white group-focus-within:ring-2 group-focus-within:ring-slate-900/10 group-focus-within:border-slate-400 pointer-events-none" />
              <form onSubmit={handleAddTaskToProject} className="relative flex items-center p-2">
                <div className="w-10 h-10 flex items-center justify-center text-slate-400">
                  <Plus size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder="Quick add a task to this project..."
                  className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 font-bold h-10 px-2"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!newTaskTitle}
                  className="bg-slate-900 text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  Add Task
                </button>
              </form>
            </div>

            <div className="space-y-3">
              {projectTasks.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <CheckSquare size={40} className="mx-auto text-slate-300 mb-3 opacity-20" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No tasks active</p>
                </div>
              ) : (
                projectTasks.map(task => (
                  <div key={task.id} className="group flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                    <button 
                      onClick={() => updateTaskStatus(task.id, task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE)}
                      className={`mt-1 shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                        task.status === TaskStatus.DONE 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : 'border-slate-300 hover:border-emerald-500 text-transparent hover:text-emerald-100'
                      }`}
                    >
                        <Check size={12} strokeWidth={3} fill="currentColor" className={task.status !== TaskStatus.DONE ? 'opacity-0' : ''} />
                    </button>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                          <p className={`text-base font-bold transition-all ${task.status === TaskStatus.DONE ? 'line-through text-slate-400 decoration-slate-300' : 'text-slate-800'}`}>
                              {task.title}
                          </p>
                          {task.status === TaskStatus.DONE && (
                              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 self-start md:self-auto">Completed</span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">
                          <span className={`px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-50 border border-slate-100">
                              <Calendar size={10} />
                              Due {formatDateDisplay(task.dueDate)}
                          </span>
                        </div>
                    </div>

                    <button 
                      onClick={() => removeTask(task.id)}
                      className="p-2 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all self-center"
                      title="Remove Task"
                    >
                        <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {isEditModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                     <div className="p-2 bg-slate-900/10 rounded-lg text-slate-900">
                        <Edit2 size={20} strokeWidth={2.5} />
                     </div>
                     Edit Project
                  </h3>
                  <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
              </div>

              <form onSubmit={handleUpdateProject} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Project Name</label>
                    <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-800 font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white outline-none transition-all placeholder:text-slate-400" value={formName} onChange={(e) => setFormName(e.target.value)} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Category</label>
                        <div className="relative">
                          <select className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl p-3.5 pr-8 text-slate-700 font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white outline-none transition-all" value={formCategory} onChange={(e) => setFormCategory(e.target.value as Category)}>
                            <option value={Category.COMPANY}>Company</option>
                            <option value={Category.PERSONAL}>Personal</option>
                          </select>
                          <Tag className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Priority</label>
                        <div className="relative">
                          <select className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl p-3.5 pr-8 text-slate-700 font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white outline-none transition-all" value={formPriority} onChange={(e) => setFormPriority(e.target.value as Priority)}>
                            {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <Flag className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                     </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Deadline</label>
                    <div className="relative">
                      <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pl-10 text-slate-700 font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white outline-none transition-all" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Description</label>
                    <div className="relative">
                      <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pl-10 text-slate-700 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white outline-none transition-all resize-none min-h-[100px]" rows={3} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
                      <AlignLeft className="absolute left-3.5 top-4 text-slate-400 pointer-events-none" size={18} />
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 mt-auto">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-white hover:shadow-sm hover:text-slate-800 rounded-xl transition-all text-sm border border-transparent hover:border-slate-200">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-black shadow-lg shadow-slate-900/20 active:scale-95 transition-all text-sm flex items-center gap-2"><Save size={18} strokeWidth={2.5} /> Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900">Projects</h2>
          <p className="text-slate-500 text-sm md:text-base font-medium">Oversee company and personal initiatives.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="w-full md:w-auto bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-slate-200 transition-all active:scale-95"
        >
          <Plus size={20} strokeWidth={3} />
          New Project
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-8 relative max-w-xl group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
        <input 
          type="text" 
          placeholder="Search projects by name or description..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
           const pTasks = tasks.filter(t => t.projectId === project.id);
           const pCompleted = pTasks.filter(t => t.status === TaskStatus.DONE).length;
           const pProgress = pTasks.length > 0 ? Math.round((pCompleted / pTasks.length) * 100) : (project.progress || 0);

           return (
            <div 
              key={project.id} 
              onClick={() => setSelectedProjectId(project.id)}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-400 transition-all p-6 flex flex-col cursor-pointer group relative overflow-hidden active:scale-[0.98]"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${project.category === Category.COMPANY ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {project.category === Category.COMPANY ? <Briefcase size={24} /> : <User size={24} />}
                </div>
                <div className="text-right">
                   <div className={`text-[10px] font-black uppercase tracking-wider mb-1 px-2.5 py-1 rounded-full border inline-block ${getPriorityColor(project.priority)}`}>
                      {project.priority}
                   </div>
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mt-1">
                     Due {project.dueDate}
                   </div>
                </div>
              </div>
              
              <h3 className="text-lg font-black text-slate-900 mb-2 transition-colors group-hover:text-indigo-600">{project.name}</h3>
              <p className="text-slate-500 text-sm mb-6 line-clamp-2 flex-1 font-medium">{project.description}</p>
              
              <div className="mt-auto">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  <span>Progress</span>
                  <span>{pProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${pProgress === 100 ? 'bg-emerald-500' : 'bg-slate-900'}`}
                    style={{ width: `${pProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
        )})}
        
        {filteredProjects.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
             {searchTerm ? (
                <>
                  <Search size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-bold text-slate-600">No projects match your search</p>
                  <button onClick={() => setSearchTerm('')} className="text-sm text-indigo-600 font-bold hover:underline mt-2">Clear search</button>
                </>
             ) : (
                <>
                  <Briefcase size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-bold text-slate-600">No projects yet</p>
                  <p className="text-sm font-medium">Create your first project to get started.</p>
                </>
             )}
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   <div className="p-2 bg-slate-900/10 rounded-lg text-slate-900">
                      <FolderPlus size={20} strokeWidth={2.5} />
                   </div>
                   Create New Project
                </h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateProject} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Project Name</label>
                  <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-800 font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white outline-none transition-all placeholder:text-slate-400" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Q4 Marketing Campaign" autoFocus />
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Category</label>
                      <div className="relative">
                        <select className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl p-3.5 pr-8 text-slate-700 font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white outline-none transition-all" value={formCategory} onChange={(e) => setFormCategory(e.target.value as Category)}>
                          <option value={Category.COMPANY}>Company</option>
                          <option value={Category.PERSONAL}>Personal</option>
                        </select>
                        <Tag className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Priority</label>
                      <div className="relative">
                        <select className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl p-3.5 pr-8 text-slate-700 font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white outline-none transition-all" value={formPriority} onChange={(e) => setFormPriority(e.target.value as Priority)}>
                          {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <Flag className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      </div>
                   </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Deadline</label>
                   <div className="relative">
                     <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pl-10 text-slate-700 font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white outline-none transition-all" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
                     <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                   </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Description</label>
                  <div className="relative">
                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pl-10 text-slate-700 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white outline-none transition-all resize-none min-h-[100px]" rows={3} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Describe the main goals and requirements..." />
                    <AlignLeft className="absolute left-3.5 top-4 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 mt-auto">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-white hover:shadow-sm hover:text-slate-800 rounded-xl transition-all text-sm border border-transparent hover:border-slate-200">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-black shadow-lg shadow-slate-900/20 active:scale-95 transition-all text-sm flex items-center gap-2"><Plus size={18} strokeWidth={2.5} /> Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
