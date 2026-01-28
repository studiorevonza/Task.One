
import React, { useState, useMemo } from 'react';
import { Task, Category, Priority, TaskStatus } from '../types';
import { format, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, isToday as isTodayDate } from 'date-fns';
import { ChevronLeft, ChevronRight, Bell, Calendar as CalendarIcon, Clock, ArrowRight, MoreHorizontal, Plus } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  updateTask?: (id: string, updates: Partial<Task>) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, updateTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = endOfMonth(currentDate);
  
  // Manual calculation for start of week (Sunday) to avoid date-fns import error
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(monthStart.getDate() - monthStart.getDay());
  calendarStart.setHours(0, 0, 0, 0);

  // Manual calculation for end of week (Saturday) to avoid date-fns import error
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

  return (
    <div className="flex flex-col h-full bg-slate-50/30 animate-fade-in">
      {/* Header Section */}
      <div className="px-6 py-8 md:px-10 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-200">
               <CalendarIcon size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Workspace Schedule</h2>
              <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Timeline & Deadlines Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
             <button 
                onClick={goToToday}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
             >
                Today
             </button>
             <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-600 transition-all"><ChevronLeft size={18} /></button>
                <span className="font-black text-slate-900 text-sm px-4 min-w-[150px] text-center uppercase tracking-tight">
                  {format(currentDate, 'MMMM yyyy')}
                </span>
                <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-600 transition-all"><ChevronRight size={18} /></button>
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl mx-auto w-full p-4 md:p-8 gap-8">
        
        {/* Calendar Grid Container */}
        <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
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
              const hasHighPriority = dayTasks.some(t => t.priority === Priority.HIGH);

              return (
                <div 
                  key={day.toISOString()} 
                  onClick={() => setSelectedDate(day)}
                  className={`relative min-h-[90px] p-2 transition-all cursor-pointer group border-b border-r border-slate-50 last:border-r-0 hover:z-10 ${
                    !isCurrentMonth ? 'bg-slate-50/30' : 'bg-white'
                  } ${isSelected ? 'ring-2 ring-inset ring-slate-900 bg-slate-50/50' : 'hover:bg-slate-50/80'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-black w-7 h-7 flex items-center justify-center rounded-xl transition-all ${
                      isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 
                      isSelected ? 'bg-slate-900 text-white' : 'text-slate-400 group-hover:text-slate-900'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {hasHighPriority && !isToday && !isSelected && (
                       <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mt-2.5 mr-1" />
                    )}
                  </div>

                  <div className="space-y-1 max-h-[60px] overflow-hidden">
                    {dayTasks.slice(0, 3).map(task => (
                      <div 
                        key={task.id} 
                        className={`text-[9px] px-2 py-1 rounded-lg truncate font-bold uppercase tracking-tight border ${
                          task.status === TaskStatus.DONE ? 'bg-slate-100 text-slate-400 border-slate-200 line-through' :
                          task.category === Category.COMPANY 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-[9px] font-black text-slate-300 pl-2 uppercase tracking-widest">
                        + {dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side Agenda Panel */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6 animate-fade-in-up">
           <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex-1 flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{format(selectedDate, 'EEEE')}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{format(selectedDate, 'MMMM do, yyyy')}</p>
                 </div>
                 <div className={`p-3 rounded-2xl ${isTodayDate(selectedDate) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 border border-slate-200'}`}>
                    <Clock size={20} />
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                 {selectedDayTasks.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                         <CalendarIcon size={24} className="text-slate-300" />
                      </div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No activities scheduled</p>
                   </div>
                 ) : (
                   selectedDayTasks.map(task => (
                     <div key={task.id} className="group bg-slate-50 border border-slate-100 rounded-3xl p-5 hover:bg-white hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer relative overflow-hidden">
                        <div className="flex justify-between items-start mb-3">
                           <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${
                             task.priority === Priority.HIGH ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                           }`}>
                              {task.priority} Priority
                           </span>
                           <button onClick={(e) => toggleReminder(task, e)} className={`p-2 rounded-xl transition-all ${task.reminderMinutes ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-400 hover:text-indigo-600'}`}>
                              <Bell size={14} fill={task.reminderMinutes ? "currentColor" : "none"} />
                           </button>
                        </div>
                        <h4 className={`font-black text-slate-900 leading-snug mb-1 ${task.status === TaskStatus.DONE ? 'line-through opacity-50' : ''}`}>
                           {task.title}
                        </h4>
                        <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                           <span className="flex items-center gap-1.5">
                              <Clock size={12} />
                              {task.dueTime || 'Anytime'}
                           </span>
                           <span className="text-slate-200">•</span>
                           <span>{task.category}</span>
                        </div>
                     </div>
                   ))
                 )}
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100">
                 <button className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95 group">
                    <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
                    New Entry
                 </button>
              </div>
           </div>

           {/* Quick Stats Widget */}
           <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform">
                 <ArrowRight size={100} />
              </div>
              <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-4">Workspace Throughput</p>
              <h3 className="font-black text-2xl tracking-tighter mb-4">
                 {(tasks.filter(t => t.status === TaskStatus.DONE).length / (tasks.length || 1) * 100).toFixed(0)}% Completed
              </h3>
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-white transition-all duration-1000" 
                   style={{ width: `${(tasks.filter(t => t.status === TaskStatus.DONE).length / (tasks.length || 1) * 100)}%` }} 
                 />
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default CalendarView;
