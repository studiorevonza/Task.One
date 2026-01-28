
import React, { useState, useEffect, useMemo } from 'react';
import { Task, TimeEntry } from '../types';
import { Play, Square, Clock, Calendar as CalendarIcon, History, Plus, BarChart3, Timer, Briefcase } from 'lucide-react';
import { format, endOfWeek, endOfMonth, isWithinInterval, eachDayOfInterval, isSameDay, isToday, isYesterday } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

interface TimeTrackingProps {
  tasks: Task[];
  timeEntries: TimeEntry[];
  activeTimer: { startTime: number; description: string; taskId?: string } | null;
  startTimer: (description: string, taskId?: string) => void;
  stopTimer: () => void;
  addManualEntry: (entry: Omit<TimeEntry, 'id'>) => void;
}

const TimeTracking: React.FC<TimeTrackingProps> = ({ 
  tasks, 
  timeEntries, 
  activeTimer, 
  startTimer, 
  stopTimer,
  addManualEntry 
}) => {
  // Timer State
  const [elapsed, setElapsed] = useState(0);
  const [timerDesc, setTimerDesc] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');

  // Manual Entry State
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualHours, setManualHours] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualTaskId, setManualTaskId] = useState('');

  // Update elapsed time for active timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    
    if (activeTimer) {
      setElapsed(Math.floor((Date.now() - activeTimer.startTime) / 1000));
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - activeTimer.startTime) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  // Helper to format seconds into HH:MM:SS
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!timerDesc && !selectedTaskId) return;
    const desc = timerDesc || tasks.find(t => t.id === selectedTaskId)?.title || 'Untitled Task';
    startTimer(desc, selectedTaskId || undefined);
    setTimerDesc('');
    setSelectedTaskId('');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseInt(manualHours) || 0;
    const m = parseInt(manualMinutes) || 0;
    if (h === 0 && m === 0) return;

    const totalSeconds = (h * 3600) + (m * 60);
    const desc = manualDesc || tasks.find(t => t.id === manualTaskId)?.title || 'Manual Entry';
    
    const dateObj = new Date(manualDate);
    // Set a default time (9 AM) so it doesn't look weird, but preserve the date
    const startTimeIso = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 9, 0, 0).toISOString();
    const endTimeIso = new Date(new Date(startTimeIso).getTime() + totalSeconds * 1000).toISOString();

    addManualEntry({
      taskId: manualTaskId || undefined,
      description: desc,
      startTime: startTimeIso,
      endTime: endTimeIso,
      duration: totalSeconds,
      date: manualDate
    });

    setManualHours('');
    setManualMinutes('');
    setManualDesc('');
    setManualTaskId('');
  };

  // --- Statistics & Chart Data ---
  const now = new Date();
  
  const weeklyChartData = useMemo(() => {
    // Manually calculate start of week (Monday start)
    const start = new Date(now);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const end = endOfWeek(now, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dayEntries = timeEntries.filter(e => isSameDay(new Date(e.date + 'T00:00:00'), day));
      const totalSeconds = dayEntries.reduce((acc, curr) => acc + curr.duration, 0);
      return {
        day: format(day, 'EEE'), // Mon, Tue...
        fullDate: format(day, 'MMM d'),
        hours: parseFloat((totalSeconds / 3600).toFixed(1)),
        isToday: isSameDay(day, now)
      };
    });
  }, [timeEntries, now]);

  const weeklyTotalSeconds = timeEntries
    .filter(e => isWithinInterval(new Date(e.date + 'T00:00:00'), { 
        // Manually calculate start of week
        start: (() => {
            const d = new Date(now);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            d.setDate(diff);
            d.setHours(0,0,0,0);
            return d;
        })(), 
        end: endOfWeek(now, { weekStartsOn: 1 }) 
    }))
    .reduce((acc, curr) => acc + curr.duration, 0);

  const monthlyTotalSeconds = timeEntries
    .filter(e => isWithinInterval(new Date(e.date + 'T00:00:00'), { 
        start: new Date(now.getFullYear(), now.getMonth(), 1), // manual startOfMonth 
        end: endOfMonth(now) 
    }))
    .reduce((acc, curr) => acc + curr.duration, 0);

  const formatStatHours = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return (
      <span>
        <span className="text-2xl font-bold text-slate-900">{h}</span>
        <span className="text-sm text-slate-400 font-medium ml-1">h</span>
        <span className="text-2xl font-bold text-slate-900 ml-2">{m}</span>
        <span className="text-sm text-slate-400 font-medium ml-1">m</span>
      </span>
    );
  };

  // --- History Grouping ---
  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: TimeEntry[] } = {};
    const sorted = [...timeEntries].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    sorted.forEach(entry => {
      const date = new Date(entry.date + 'T00:00:00');
      let key = format(date, 'MMMM d, yyyy');
      if (isToday(date)) key = 'Today';
      else if (isYesterday(date)) key = 'Yesterday';
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });
    return groups;
  }, [timeEntries]);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Timer size={32} className="text-black" />
          Time Tracker
        </h2>
        <p className="text-slate-500 mt-1">Manage your productivity and track billable hours.</p>
      </div>

      {/* Top Section: Timer & Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left: Active Timer Card - White Theme */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          
          <div className="relative z-10">
             <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold uppercase tracking-wider mb-6">
                <div className={`w-2.5 h-2.5 rounded-full ${activeTimer ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                {activeTimer ? 'Timer Running' : 'Timer Idle'}
             </div>

             <div className="text-center py-4">
                <div className="font-mono text-6xl md:text-8xl font-bold tracking-tight text-slate-900 tabular-nums">
                   {formatDuration(elapsed)}
                </div>
                {activeTimer && (
                   <div className="mt-4 text-slate-600 text-lg bg-slate-50 inline-block px-4 py-1.5 rounded-full border border-slate-100 font-medium">
                      {activeTimer.description}
                   </div>
                )}
             </div>
          </div>

          {/* Controls */}
          <div className="relative z-10 mt-8">
             {activeTimer ? (
               <button 
                 onClick={stopTimer}
                 className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
               >
                 <Square fill="currentColor" size={20} /> Stop Session
               </button>
             ) : (
               <div className="flex flex-col md:flex-row gap-3">
                 <div className="flex-1 flex gap-3">
                    <div className="relative flex-1">
                      <input 
                        type="text" 
                        placeholder="What are you working on?"
                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all font-medium"
                        value={timerDesc}
                        onChange={(e) => setTimerDesc(e.target.value)}
                      />
                    </div>
                    <div className="relative w-1/3 min-w-[150px]">
                      <select 
                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 pl-10 text-slate-900 appearance-none cursor-pointer hover:bg-slate-100 transition-colors outline-none focus:ring-2 focus:ring-black/5 focus:border-black font-medium"
                        value={selectedTaskId}
                        onChange={(e) => setSelectedTaskId(e.target.value)}
                      >
                         <option value="">No Task</option>
                         {tasks.filter(t => t.status !== 'Done').map(t => (
                           <option key={t.id} value={t.id}>{t.title}</option>
                         ))}
                      </select>
                      <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>
                 </div>
                 <button 
                    onClick={handleStart}
                    disabled={!timerDesc && !selectedTaskId}
                    className="w-full md:w-auto px-8 h-14 bg-black hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98]"
                 >
                    <Play fill="currentColor" size={20} /> Start
                 </button>
               </div>
             )}
          </div>
        </div>

        {/* Right: Stats & Weekly Chart */}
        <div className="space-y-6 flex flex-col">
           {/* Stats Cards */}
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">This Week</p>
                 {formatStatHours(weeklyTotalSeconds)}
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">This Month</p>
                 {formatStatHours(monthlyTotalSeconds)}
              </div>
           </div>

           {/* Chart */}
           <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 size={18} className="text-slate-400" />
                    Weekly Activity
                 </h3>
              </div>
              <div className="w-full h-[200px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis 
                          dataKey="day" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 12 }} 
                          dy={10}
                       />
                       <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                       />
                       <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                       />
                       <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                          {weeklyChartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.isToday ? '#111827' : '#cbd5e1'} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>
      </div>

      {/* Bottom Section: Manual Entry & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* Manual Entry Form */}
         <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-6">
               <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Plus size={20} className="text-black" />
                  Log Manual Time
               </h3>
               
               <form onSubmit={handleManualSubmit} className="space-y-5">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Date</label>
                     <div className="relative">
                        <input 
                           type="date" 
                           required
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-medium text-slate-900"
                           value={manualDate}
                           onChange={(e) => setManualDate(e.target.value)}
                        />
                        <CalendarIcon size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Hours</label>
                        <input 
                           type="number" min="0" placeholder="0"
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-medium"
                           value={manualHours}
                           onChange={(e) => setManualHours(e.target.value)}
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Minutes</label>
                        <input 
                           type="number" min="0" max="59" placeholder="0"
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-medium"
                           value={manualMinutes}
                           onChange={(e) => setManualMinutes(e.target.value)}
                        />
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Details</label>
                     <input 
                        type="text" 
                        placeholder="Description..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-3 outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                        value={manualDesc}
                        onChange={(e) => setManualDesc(e.target.value)}
                     />
                     <div className="relative">
                        <select 
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all appearance-none text-slate-600 text-sm"
                           value={manualTaskId}
                           onChange={(e) => setManualTaskId(e.target.value)}
                        >
                           <option value="">Link to Task (Optional)</option>
                           {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                        </select>
                        <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                     </div>
                  </div>

                  <button 
                     type="submit"
                     className="w-full bg-black hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                     <Plus size={18} /> Add Entry
                  </button>
               </form>
            </div>
         </div>

         {/* History Log */}
         <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                     <History size={20} className="text-black" />
                     Recent Activity
                  </h3>
               </div>
               
               <div className="max-h-[600px] overflow-y-auto p-6 space-y-8">
                  {Object.keys(groupedHistory).length === 0 ? (
                     <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                        <Clock size={48} className="mb-4 opacity-20" />
                        <p>No time entries recorded yet.</p>
                     </div>
                  ) : (
                     Object.entries(groupedHistory).map(([dateLabel, rawEntries]) => {
                       const entries = rawEntries as TimeEntry[];
                       return (
                        <div key={dateLabel}>
                           <div className="flex items-center gap-4 mb-4">
                              <h4 className="font-bold text-slate-900 text-sm">{dateLabel}</h4>
                              <div className="h-px bg-slate-100 flex-1" />
                              <span className="text-xs font-semibold text-slate-400">
                                 {formatDuration(entries.reduce((acc, e) => acc + e.duration, 0))} total
                              </span>
                           </div>
                           
                           <div className="space-y-3">
                              {entries.map(entry => (
                                 <div key={entry.id} className="group bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 rounded-xl p-4 transition-all hover:shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 group-hover:text-black group-hover:border-slate-300 transition-colors">
                                       <Clock size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <p className="font-bold text-slate-900 truncate">{entry.description}</p>
                                       <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                          <span>{format(new Date(entry.startTime), 'h:mm a')} - {format(new Date(entry.endTime), 'h:mm a')}</span>
                                          {entry.taskId && (
                                             <>
                                                <span>•</span>
                                                <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                                                   <Briefcase size={10} /> Linked
                                                </span>
                                             </>
                                          )}
                                       </div>
                                    </div>
                                    <div className="font-mono font-bold text-slate-900 text-lg">
                                       {formatDuration(entry.duration)}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )})
                  )}
               </div>
            </div>
         </div>

      </div>
    </div>
  );
};

export default TimeTracking;
