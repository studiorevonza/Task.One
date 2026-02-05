import React, { useState, useMemo, useEffect } from 'react';
import { Task, Category, Priority, TaskStatus } from '../types';
import { format, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, isToday as isTodayDate } from 'date-fns';
import { ChevronLeft, ChevronRight, Bell, Calendar as CalendarIcon, Clock, ArrowRight, MoreHorizontal, Plus, Zap, Activity, Globe, X, Flag, Tag, AlignLeft } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  updateTask?: (id: string, updates: Partial<Task>) => void;
  addTask?: (task: Task) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, updateTask, addTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.MEDIUM);
  const [newTaskCategory, setNewTaskCategory] = useState<Category>(Category.COMPANY);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = endOfMonth(currentDate);
  
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(monthStart.getDate() - monthStart.getDay());
  calendarStart.setHours(0, 0, 0, 0);

  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));
  calendarEnd.setHours(23, 59, 59, 999);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [calendarStart, calendarEnd]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(addMonths(currentDate, -1));
  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => isSameDay(new Date(task.dueDate + 'T00:00:00'), day));
  };

  const selectedDayTasks = useMemo(() => getTasksForDay(selectedDate), [selectedDate, tasks]);

  // Neural Stats for the month
  const monthlyStats = useMemo(() => {
    const monthTasks = tasks.filter(t => isSameMonth(new Date(t.dueDate + 'T00:00:00'), currentDate));
    const completed = monthTasks.filter(t => t.status === TaskStatus.DONE).length;
    const total = monthTasks.length;
    const efficiency = total > 0 ? Math.round((completed / total) * 100) : 100;
    const highPriority = monthTasks.filter(t => t.priority === Priority.HIGH && t.status !== TaskStatus.DONE).length;
    
    return { total, completed, efficiency, highPriority };
  }, [tasks, currentDate]);

  const toggleReminder = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!updateTask) return;
    
    let newMinutes = 0;
    if (!task.reminderMinutes) newMinutes = 15;
    else if (task.reminderMinutes === 15) newMinutes = 60;
    else if (task.reminderMinutes === 60) newMinutes = 1440;
    else newMinutes = 0;

    updateTask(task.id, { 
      reminderMinutes: newMinutes,
      reminderSent: false 
    });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !addTask) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: newTaskDescription,
      status: TaskStatus.TODO,
      priority: newTaskPriority,
      category: newTaskCategory,
      dueDate: format(selectedDate, 'yyyy-MM-dd'),
      dueTime: '09:00',
      reminderMinutes: 0
    };

    addTask(newTask);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority(Priority.MEDIUM);
    setNewTaskCategory(Category.COMPANY);
    setIsCreateModalOpen(false);
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    if (updateTask) {
      updateTask(taskId, { status });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/10 animate-fade-in relative">
      {/* Real-time Header Card */}
      <div className="px-6 py-10 md:px-10 bg-white border-b border-slate-200 sticky top-0 z-30 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-slate-200 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Chronos Engine Active
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            UTC_STAMP: {format(currentTime, 'HH:mm:ss')} · LIVE
                        </div>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tighter leading-none mb-3">Temporal Grid</h2>
                    <p className="text-slate-500 text-lg font-medium max-w-2xl">Visualizing {monthlyStats.total} operational phases across this temporal cycle.</p>
                </div>

                <div className="flex flex-wrap items-center gap-6 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Grid Load</span>
                        <span className="text-2xl font-bold text-slate-900">{monthlyStats.total} Units</span>
                    </div>
                    <div className="h-10 w-px bg-slate-100"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Momentum</span>
                        <span className="text-2xl font-bold text-emerald-500">{monthlyStats.efficiency}%</span>
                    </div>
                    <div className="h-10 w-px bg-slate-100"></div>
                    <div className="flex flex-col text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Period</span>
                        <div className="flex items-center gap-3">
                           <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-all"><ChevronLeft size={16} /></button>
                           <span className="text-sm font-bold text-slate-900 uppercase tracking-tighter min-w-[120px]">{format(currentDate, 'MMMM yyyy')}</span>
                           <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-all"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 md:p-8 gap-8">
        
        {/* Calendar Grid Container */}
        <div className="flex-1 bg-white/70 backdrop-blur-sm rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px] group/grid">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/30">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-r border-slate-50 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 flex-1 auto-rows-fr">
            {days.map((day, idx) => {
              const dayTasks = getTasksForDay(day);
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isTodayDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const hasHighPriority = dayTasks.some(t => t.priority === Priority.HIGH && t.status !== TaskStatus.DONE);

              return (
                <div 
                  key={day.toISOString()} 
                  onClick={() => setSelectedDate(day)}
                  className={`relative min-h-[100px] p-3 transition-all cursor-pointer border-b border-r border-slate-50 last:border-r-0 flex flex-col ${
                    !isCurrentMonth ? 'bg-slate-50/20 opacity-40' : 'bg-white'
                  } ${isSelected ? 'bg-slate-50/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.02)]' : 'hover:bg-slate-50/50'}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[11px] font-bold w-7 h-7 flex items-center justify-center rounded-xl transition-all ${
                      isToday ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 ring-4 ring-slate-900/10' : 
                      isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 group-hover/grid:text-slate-900'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {hasHighPriority && (
                       <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 overflow-hidden">
                    {dayTasks.slice(0, 3).map(task => (
                      <div 
                        key={task.id} 
                        className={`text-[8px] px-2 py-1 rounded-lg truncate font-bold uppercase tracking-tight border transition-all hover:scale-105 active:scale-95 ${
                          task.status === TaskStatus.DONE ? 'bg-slate-50 text-slate-300 border-slate-100 line-through decoration-slate-200' :
                          task.priority === Priority.HIGH 
                            ? 'bg-red-50 text-red-700 border-red-100 shadow-sm' 
                            : task.category === Category.COMPANY 
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm'
                        }`}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-[8px] font-bold text-slate-300 pl-1 uppercase tracking-widest mt-1">
                        + {dayTasks.length - 3} Units
                      </div>
                    )}
                  </div>
                  
                  {isSelected && (
                     <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Side Tactical Agenda */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6 animate-fade-in-up">
           <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-8 flex-1 flex flex-col min-h-[500px] relative overflow-hidden group/agenda">
              {/* Subtle background glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-50/50 rounded-full blur-3xl group-hover/agenda:bg-indigo-100/50 transition-colors" />
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                 <div>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{format(selectedDate, 'EEEE')}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{format(selectedDate, 'MMMM do, yyyy')}</p>
                 </div>
                 <div className={`p-4 rounded-[1.5rem] transition-all duration-500 ${isTodayDate(selectedDate) ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20 rotate-12 scale-110' : 'bg-slate-50 text-slate-300 border border-slate-200 shadow-inner'}`}>
                    <Zap size={24} className={isTodayDate(selectedDate) ? 'animate-pulse text-yellow-400 fill-yellow-400' : ''} />
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar relative z-10">
                 {selectedDayTasks.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-16">
                      <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-100 shadow-inner group-hover/agenda:rotate-6 transition-transform">
                         <Activity size={32} className="text-slate-200" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Deployment Grid Clear</p>
                      <p className="text-[9px] text-slate-300 mt-2 font-medium">No units scheduled for this temporal coordinate.</p>
                   </div>
                 ) : (
                   selectedDayTasks.map(task => (
                     <div key={task.id} className="group/item bg-slate-50 border border-slate-100 rounded-[2rem] p-6 hover:bg-white hover:border-slate-300 hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex gap-2">
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                                    task.priority === Priority.HIGH ? 'bg-red-50 text-red-600 border-red-100 shadow-sm' : 'bg-white text-slate-500 border-slate-200'
                                }`}>
                                    {task.priority}
                                </span>
                                <span className="bg-white text-slate-400 text-[9px] font-bold px-2.5 py-1 rounded-full border border-slate-100 shadow-sm uppercase tracking-widest leading-none">
                                    {task.category}
                                </span>
                           </div>
                           <button onClick={(e) => toggleReminder(task, e)} className={`p-2.5 rounded-xl transition-all active:scale-95 ${task.reminderMinutes ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-300 hover:text-indigo-600'}`}>
                              <Bell size={14} fill={task.reminderMinutes ? "currentColor" : "none"} strokeWidth={3} />
                           </button>
                        </div>
                        <h4 
                          className={`text-lg font-bold text-slate-900 leading-tight mb-3 transition-opacity cursor-pointer hover:underline ${
                            task.status === TaskStatus.DONE ? 'opacity-40 line-through' : ''
                          }`}
                          onClick={() => updateTaskStatus(task.id, task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE)}
                        >
                           {task.title}
                        </h4>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                           <div className="flex items-center gap-1.5">
                              <Clock size={12} strokeWidth={3} />
                              <span>{task.dueTime || 'Anytime'}</span>
                           </div>
                           {task.status !== TaskStatus.DONE && (
                              <div className="flex items-center gap-1.5 text-indigo-500">
                                 <Zap size={10} fill="currentColor" />
                                 <span>Active</span>
                              </div>
                           )}
                        </div>
                     </div>
                   ))
                 )}
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 relative z-10">
                 <button 
                   onClick={() => setIsCreateModalOpen(true)}
                   className="w-full h-16 flex items-center justify-center gap-4 bg-slate-900 text-white rounded-[1.5rem] font-bold text-xs uppercase tracking-[0.3em] shadow-2xl shadow-slate-300 hover:bg-black transition-all active:scale-95 group/btn"
                 >
                    <Plus size={20} strokeWidth={4} className="group-hover/btn:rotate-90 transition-transform duration-500" />
                    Initialize Unit
                 </button>
              </div>
           </div>
        </div>

      </div>

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   <div className="p-2 bg-slate-900/10 rounded-lg text-slate-900">
                      <Plus size={20} strokeWidth={2.5} />
                   </div>
                   Initialize New Unit
                </h3>
                <button 
                  onClick={() => setIsCreateModalOpen(false)} 
                  className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
            </div>

            <form onSubmit={handleCreateTask} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Unit Title</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-800 font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white outline-none transition-all placeholder:text-slate-400" 
                    value={newTaskTitle} 
                    onChange={(e) => setNewTaskTitle(e.target.value)} 
                    placeholder="Enter unit title..."
                    autoFocus 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Description</label>
                  <div className="relative">
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pl-10 text-slate-700 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white outline-none transition-all resize-none min-h-[100px]" 
                      rows={3} 
                      value={newTaskDescription} 
                      onChange={(e) => setNewTaskDescription(e.target.value)} 
                      placeholder="Describe the operational requirements..."
                    />
                    <AlignLeft className="absolute left-3.5 top-4 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Category</label>
                      <div className="relative">
                        <select 
                          className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl p-3.5 pr-8 text-slate-700 font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white outline-none transition-all" 
                          value={newTaskCategory} 
                          onChange={(e) => setNewTaskCategory(e.target.value as Category)}
                        >
                          <option value={Category.COMPANY}>Company</option>
                          <option value={Category.PERSONAL}>Personal</option>
                        </select>
                        <Tag className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Priority</label>
                      <div className="relative">
                        <select 
                          className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl p-3.5 pr-8 text-slate-700 font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white outline-none transition-all" 
                          value={newTaskPriority} 
                          onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                        >
                          {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <Flag className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      </div>
                   </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 mt-auto">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)} 
                  className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-white hover:shadow-sm hover:text-slate-800 rounded-xl transition-all text-sm border border-transparent hover:border-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-black shadow-lg shadow-slate-900/20 active:scale-95 transition-all text-sm flex items-center gap-2"
                >
                  <Plus size={18} strokeWidth={2.5} /> Create Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;