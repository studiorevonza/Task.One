
import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskStatus, Priority, Category } from '../types';
import { KanbanSquare, Lock, Calendar, AlertCircle, CheckCircle2, Circle, Clock, MoreHorizontal, Activity, Zap } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

interface WorkflowViewProps {
  tasks: Task[];
  updateTaskStatus: (id: string, status: TaskStatus) => void;
}

const WorkflowView: React.FC<WorkflowViewProps> = ({ tasks, updateTaskStatus }) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedTaskId) {
      updateTaskStatus(draggedTaskId, status);
      setDraggedTaskId(null);
    }
  };

  const getBlockingTasks = (task: Task) => {
    if (!task.dependencies || task.dependencies.length === 0) return [];
    return task.dependencies
      .map(depId => tasks.find(t => t.id === depId))
      .filter(t => t && t.status !== TaskStatus.DONE) as Task[];
  };

  const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return { color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', icon: Circle, glow: 'bg-slate-500/10' };
      case TaskStatus.IN_PROGRESS:
        return { color: 'text-blue-500', bg: 'bg-blue-50/50', border: 'border-blue-100', icon: Clock, glow: 'bg-blue-500/10' };
      case TaskStatus.REVIEW:
        return { color: 'text-purple-500', bg: 'bg-purple-50/50', border: 'border-purple-100', icon: AlertCircle, glow: 'bg-purple-500/10' };
      case TaskStatus.DONE:
        return { color: 'text-emerald-500', bg: 'bg-emerald-50/50', border: 'border-emerald-100', icon: CheckCircle2, glow: 'bg-emerald-500/10' };
    }
  };

  const getPriorityBadge = (priority: Priority) => {
     switch (priority) {
        case Priority.HIGH: return <span className="bg-red-50 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-100 uppercase tracking-widest shadow-sm">High Priority</span>;
        case Priority.MEDIUM: return <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-100 uppercase tracking-widest shadow-sm">Medium Priority</span>;
        case Priority.LOW: return <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-widest shadow-sm">Low Priority</span>;
     }
  };

  const workflowStats = useMemo(() => {
    const total = tasks.length;
    const active = tasks.filter(t => t.status !== TaskStatus.DONE).length;
    const completed = total - active;
    const efficiency = total > 0 ? Math.round((completed / total) * 100) : 100;
    return { total, active, completed, efficiency };
  }, [tasks]);

  return (
    <div className="p-4 md:p-8 h-full flex flex-col bg-slate-50/30">
      {/* Real-time Workflow Mission Control */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
        <div>
            <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-slate-200 flex items-center gap-2">
                    <Zap size={10} className="text-yellow-400 fill-yellow-400" />
                    Workflow Live
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    SYNC_TIME: {format(currentTime, 'HH:mm:ss')}
                </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tighter flex items-center gap-4 leading-none">
                Neural Pipeline
            </h2>
            <p className="text-slate-500 text-lg font-medium mt-3">Visualizing {workflowStats.active} active execution units through the delivery grid.</p>
        </div>

        <div className="flex items-center gap-6 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50">
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Flow Velocity</span>
                <span className="text-2xl font-bold text-slate-900">{workflowStats.efficiency}%</span>
            </div>
            <div className="h-10 w-px bg-slate-100"></div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Grid</span>
                <span className="text-2xl font-bold text-slate-900">{workflowStats.active} Units</span>
            </div>
            <div className="h-10 w-px bg-slate-100"></div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Finalized</span>
                <span className="text-2xl font-bold text-emerald-500">{workflowStats.completed}</span>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex h-full gap-8 min-w-max pb-4">
            {Object.values(TaskStatus).map(status => {
            const statusTasks = tasks.filter(t => t.status === status);
            const isDropZone = draggedTaskId !== null;
            const config = getStatusConfig(status);
            const StatusIcon = config.icon;

            return (
                <div 
                    key={status} 
                    className={`w-96 flex flex-col rounded-[2.5rem] transition-all duration-500 ${config.bg} border ${config.border} p-1 ${
                        isDropZone ? 'ring-4 ring-slate-900/5 bg-white/60 backdrop-blur-md' : 'shadow-sm'
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status)}
                >
                    {/* Column Header */}
                    <div className="p-6 flex items-center justify-between sticky top-0 bg-inherit rounded-t-[2.5rem] z-10">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl bg-white shadow-sm border ${config.border} ${config.color}`}>
                                <StatusIcon size={18} strokeWidth={3} />
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest">{status.replace('_', ' ')}</h3>
                        </div>
                        <span className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-slate-200">
                            {statusTasks.length}
                        </span>
                    </div>

                    {/* Task List */}
                    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 custom-scrollbar">
                        {statusTasks.map(task => {
                            const blockingTasks = getBlockingTasks(task);
                            const isBlocked = blockingTasks.length > 0;
                            const isOverdue = task.status !== TaskStatus.DONE && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
                            const isHighPriority = task.priority === Priority.HIGH && task.status !== TaskStatus.DONE;

                            return (
                            <div 
                                key={task.id} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, task.id)}
                                className={`group p-6 rounded-[2rem] border cursor-grab active:cursor-grabbing transition-all duration-300 relative ${
                                    draggedTaskId === task.id ? 'opacity-30 scale-95' : 'opacity-100 hover:shadow-2xl hover:border-slate-400 hover:-translate-y-1'
                                } ${
                                    isBlocked 
                                    ? 'bg-amber-50/50 border-amber-200' 
                                    : isHighPriority 
                                        ? 'bg-white border-red-200/50 shadow-red-500/5' 
                                        : 'bg-white border-slate-200 shadow-sm'
                                }`}
                            >
                                {isHighPriority && (
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/5 rounded-full blur-xl -mr-4 -mt-4 animate-pulse"></div>
                                )}

                                {/* Header Row */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest ${task.category === Category.COMPANY ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                            {task.category}
                                        </span>
                                        {getPriorityBadge(task.priority)}
                                    </div>
                                    <button className="text-slate-300 hover:text-slate-900 transition-colors p-1">
                                        <MoreHorizontal size={16} strokeWidth={3} />
                                    </button>
                                </div>

                                {/* Title */}
                                <h4 className={`text-lg font-bold text-slate-900 leading-tight mb-2 ${task.status === TaskStatus.DONE ? 'line-through text-slate-300' : ''}`}>
                                    {task.title}
                                </h4>
                                
                                {task.description && (
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 font-medium leading-relaxed">
                                        {task.description}
                                    </p>
                                )}

                                {/* Bottom Row */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                                        <Calendar size={12} strokeWidth={3} />
                                        <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isBlocked && (
                                            <div className="group/tooltip relative">
                                                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-200 cursor-help">
                                                    <Lock size={10} strokeWidth={3} />
                                                </div>
                                                <div className="absolute bottom-full right-0 mb-3 w-56 p-4 bg-slate-900 text-white text-[10px] rounded-2xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-20 pointer-events-none border border-slate-800">
                                                    <p className="font-bold mb-2 text-slate-400 uppercase tracking-widest text-[8px]">Waiting for:</p>
                                                    <ul className="space-y-1.5">
                                                        {blockingTasks.map(t => (
                                                            <li key={t.id} className="truncate flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                                                                <span className="font-bold">{t.title}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                        {task.status === TaskStatus.DONE && (
                                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                <CheckCircle2 size={14} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                        
                        {/* Empty Space Filler */}
                        {statusTasks.length === 0 && (
                            <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-200/50 rounded-[2rem] m-2 bg-white/30 backdrop-blur-sm">
                                <Activity size={32} className="text-slate-200 mb-2 opacity-30" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zone Clear</p>
                            </div>
                        )}
                    </div>
                </div>
            );
            })}
        </div>
      </div>
    </div>
  );
};

export default WorkflowView;
