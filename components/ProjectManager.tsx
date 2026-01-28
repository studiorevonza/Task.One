
import React, { useState, useMemo, useEffect } from 'react';
import { Project, Category, Task, TaskStatus, Priority, ProjectMilestone } from '../types';
import { Briefcase, User, Plus, Calendar, ArrowLeft, Trash2, Edit2, X, FolderPlus, Tag, AlignLeft, Save, Flag, CheckSquare, ClipboardList, Check, Trophy, Search } from 'lucide-react';
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
  
  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50/50">
        <div className="px-4 md:px-8 py-6 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => setSelectedProjectId(null)}
                className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium text-sm"
              >
                <div className="p-1.5 rounded-full bg-slate-50 group-hover:bg-slate-100 border border-slate-200 transition-colors">
                  <ArrowLeft size={16} />
                </div>
                Back to Projects
              </button>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={openEditModal}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                  title="Edit Project"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={handleDeleteProject}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                  title="Delete Project"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start justify-between">
              <div className="flex-1">
                 <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 ${selectedProject.category === Category.COMPANY ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-cyan-50 text-cyan-700 border-cyan-200'}`}>
                      {selectedProject.category === Category.COMPANY ? <Briefcase size={12} /> : <User size={12} />}
                      {selectedProject.category}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 ${getPriorityColor(selectedProject.priority)}`}>
                      <Flag size={12} fill="currentColor" />
                      {selectedProject.priority} Priority
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-slate-50 text-slate-600 border-slate-200 flex items-center gap-1.5">
                      <Calendar size={12} />
                      Due {selectedProject.dueDate}
                    </span>
                 </div>
                 <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">{selectedProject.name}</h1>
                 <p className="text-slate-500 text-lg leading-relaxed max-w-2xl">{selectedProject.description}</p>
              </div>

              <div className="w-full md:w-64 bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm shrink-0">
                  <div className="flex justify-between items-center mb-3">
                     <span className="text-sm font-bold text-slate-700">Project Progress</span>
                     <span className="text-2xl font-bold text-slate-900">{progress}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden mb-4">
                     <div 
                       className={`h-full transition-all duration-1000 ease-out rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-slate-900'}`} 
                       style={{ width: `${progress}%` }}
                     />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                     <span>{projectTasks.filter(t => t.status === TaskStatus.DONE).length} Completed</span>
                     <span>{projectTasks.length} Total Tasks</span>
                  </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8 pb-32">
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
                  className="bg-slate-900 text-white px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
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
                              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 self-start md:self-auto">Completed</span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
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
                     <div className="p-2 bg-primary/10 rounded-lg text-primary">
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
                    <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-800 font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all placeholder:text-slate-400" value={formName} onChange={(e) => setFormName(e.target.value)} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Category</label>
                        <div className="relative">
                          <select className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl p-3.5 pr-8 text-slate-700 font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all" value={formCategory} onChange={(e) => setFormCategory(e.target.value as Category)}>
                            <option value={Category.COMPANY}>Company</option>
                            <option value={Category.PERSONAL}>Personal</option>
                          </select>
                          <Tag className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Priority</label>
                        <div className="relative">
                          <select className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl p-3.5 pr-8 text-slate-700 font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all" value={formPriority} onChange={(e) => setFormPriority(e.target.value as Priority)}>
                            {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <Flag className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                     </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Deadline</label>
                    <div className="relative">
                      <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pl-10 text-slate-700 font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Description</label>
                    <div className="relative">
                      <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pl-10 text-slate-700 focus:ring-2 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all resize-none min-h-[100px]" rows={3} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
                      <AlignLeft className="absolute left-3.5 top-4 text-slate-400 pointer-events-none" size={18} />
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 mt-auto">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-white hover:shadow-sm hover:text-slate-800 rounded-xl transition-all text-sm border border-transparent hover:border-slate-200">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm flex items-center gap-2"><Save size={18} strokeWidth={2.5} /> Save Changes</button>
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
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Projects</h2>
          <p className="text-slate-500 text-sm md:text-base">Oversee company and personal initiatives.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="w-full md:w-auto bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all"
        >
          <Plus size={20} />
          New Project
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-8 relative max-w-xl">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search projects by name or description..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all shadow-sm"
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
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all p-6 flex flex-col cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${project.category === Category.COMPANY ? 'bg-purple-100 text-purple-600' : 'bg-cyan-100 text-cyan-600'}`}>
                  {project.category === Category.COMPANY ? <Briefcase size={24} /> : <User size={24} />}
                </div>
                <div className="text-right">
                   <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 px-2 py-0.5 rounded border inline-block ${getPriorityColor(project.priority)}`}>
                      {project.priority}
                   </div>
                   <div className="text-xs font-semibold text-slate-400 block">
                     Due {project.dueDate}
                   </div>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-primary transition-colors">{project.name}</h3>
              <p className="text-slate-500 text-sm mb-6 line-clamp-2 flex-1">{project.description}</p>
              
              <div className="mt-auto">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span>
                  <span>{pProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${pProgress === 100 ? 'bg-emerald-500' : 'bg-slate-900'}`}
                    style={{ width: `${pProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
        )})}
        
        {filteredProjects.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
             {searchTerm ? (
                <>
                  <Search size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium text-slate-600">No projects match your search</p>
                  <button onClick={() => setSearchTerm('')} className="text-sm text-primary hover:underline mt-2">Clear search</button>
                </>
             ) : (
                <>
                  <Briefcase size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium text-slate-600">No projects yet</p>
                  <p className="text-sm">Create your first project to get started.</p>
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
                   <div className="p-2 bg-primary/10 rounded-lg text-primary">
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
                  <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-800 font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all placeholder:text-slate-400" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Q4 Marketing Campaign" autoFocus />
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Category</label>
                      <div className="relative">
                        <select className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl p-3.5 pr-8 text-slate-700 font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all" value={formCategory} onChange={(e) => setFormCategory(e.target.value as Category)}>
                          <option value={Category.COMPANY}>Company</option>
                          <option value={Category.PERSONAL}>Personal</option>
                        </select>
                        <Tag className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Priority</label>
                      <div className="relative">
                        <select className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl p-3.5 pr-8 text-slate-700 font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all" value={formPriority} onChange={(e) => setFormPriority(e.target.value as Priority)}>
                          {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <Flag className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      </div>
                   </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Deadline</label>
                   <div className="relative">
                     <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pl-10 text-slate-700 font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
                     <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                   </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Description</label>
                  <div className="relative">
                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pl-10 text-slate-700 focus:ring-2 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all resize-none min-h-[100px]" rows={3} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Describe the main goals and requirements..." />
                    <AlignLeft className="absolute left-3.5 top-4 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 mt-auto">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-white hover:shadow-sm hover:text-slate-800 rounded-xl transition-all text-sm border border-transparent hover:border-slate-200">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm flex items-center gap-2"><Plus size={18} strokeWidth={2.5} /> Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
