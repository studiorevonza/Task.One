
import React, { useState } from 'react';
import { Task, TaskStatus, Priority, Category } from '../types';
import { KanbanSquare, Lock, Calendar, AlertCircle, CheckCircle2, Circle, Clock, MoreHorizontal } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

interface WorkflowViewProps {
  tasks: Task[];
  updateTaskStatus: (id: string, status: TaskStatus) => void;
}

const WorkflowView: React.FC<WorkflowViewProps> = ({ tasks, updateTaskStatus }) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
    // Transparent drag image hack if needed, or rely on browser default
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
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
        return { color: 'bg-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', icon: Circle };
      case TaskStatus.IN_PROGRESS:
        return { color: 'bg-blue-500', bg: 'bg-blue-50/50', border: 'border-blue-100', icon: Clock };
      case TaskStatus.REVIEW:
        return { color: 'bg-purple-500', bg: 'bg-purple-50/50', border: 'border-purple-100', icon: AlertCircle };
      case TaskStatus.DONE:
        return { color: 'bg-emerald-500', bg: 'bg-emerald-50/50', border: 'border-emerald-100', icon: CheckCircle2 };
    }
  };

  const getPriorityBadge = (priority: Priority) => {
     switch (priority) {
        case Priority.HIGH: return <span className="bg-red-50 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-100 uppercase tracking-wider">High</span>;
        case Priority.MEDIUM: return <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-100 uppercase tracking-wider">Med</span>;
        case Priority.LOW: return <span className="bg-green-50 text-green-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-green-100 uppercase tracking-wider">Low</span>;
     }
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-lg text-white">
                <KanbanSquare size={24} />
            </div>
            Workflow
            </h2>
            <p className="text-slate-500 text-sm md:text-base mt-1 ml-1">Drag and drop cards to update progress.</p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex h-full gap-6 min-w-max">
            {Object.values(TaskStatus).map(status => {
            const statusTasks = tasks.filter(t => t.status === status);
            const isDropZone = draggedTaskId !== null;
            const config = getStatusConfig(status);
            const StatusIcon = config.icon;

            return (
                <div 
                    key={status} 
                    className={`w-80 flex flex-col rounded-2xl transition-all duration-300 ${config.bg} border ${config.border} ${
                        isDropZone ? 'ring-2 ring-slate-400/20' : ''
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status)}
                >
                    {/* Column Header */}
                    <div className="p-4 flex items-center justify-between sticky top-0 bg-inherit rounded-t-2xl z-10 backdrop-blur-sm">
                        <div className="flex items-center gap-2.5">
                            <StatusIcon size={18} className={`${status === TaskStatus.TODO ? 'text-slate-500' : status === TaskStatus.IN_PROGRESS ? 'text-blue-500' : status === TaskStatus.REVIEW ? 'text-purple-500' : 'text-emerald-500'}`} />
                            <h3 className="font-bold text-slate-800 text-sm">{status}</h3>
                        </div>
                        <span className="bg-white/60 text-slate-600 text-xs font-bold px-2 py-1 rounded-md min-w-[1.5rem] text-center shadow-sm">
                            {statusTasks.length}
                        </span>
                    </div>

                    {/* Task List */}
                    <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3 custom-scrollbar">
                        {statusTasks.map(task => {
                            const blockingTasks = getBlockingTasks(task);
                            const isBlocked = blockingTasks.length > 0;
                            const isOverdue = task.status !== TaskStatus.DONE && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));

                            return (
                            <div 
                                key={task.id} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, task.id)}
                                className={`group p-4 rounded-xl shadow-sm border cursor-grab active:cursor-grabbing transition-all relative ${
                                    draggedTaskId === task.id ? 'opacity-40 scale-95 rotate-1' : 'opacity-100 hover:-translate-y-0.5'
                                } ${
                                    isBlocked 
                                    ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300 shadow-sm' 
                                    : 'bg-white border-slate-200/60 hover:shadow-md hover:border-slate-300'
                                }`}
                            >
                                {/* Drag Handle / Top Row */}
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-2">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${task.category === Category.COMPANY ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-teal-50 text-teal-600 border-teal-100'}`}>
                                            {task.category}
                                        </span>
                                        {getPriorityBadge(task.priority)}
                                    </div>
                                    <button className="text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreHorizontal size={16} />
                                    </button>
                                </div>

                                {/* Title */}
                                <h4 className={`font-semibold text-slate-800 mb-1 leading-snug ${task.status === TaskStatus.DONE ? 'line-through text-slate-400' : ''}`}>
                                    {task.title}
                                </h4>
                                
                                {task.description && (
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                                        {task.description}
                                    </p>
                                )}

                                {/* Bottom Row */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-2">
                                    <div className={`flex items-center gap-1.5 text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                                        <Calendar size={12} />
                                        <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                                    </div>

                                    {isBlocked && (
                                        <div className="group/tooltip relative">
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 cursor-help">
                                                <Lock size={10} /> Blocked
                                            </div>
                                            <div className="absolute bottom-full right-0 mb-2 w-48 p-2.5 bg-slate-800 text-white text-[10px] rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-20 pointer-events-none">
                                                <p className="font-bold mb-1 text-slate-400 uppercase tracking-wider text-[9px]">Waiting for:</p>
                                                <ul className="space-y-1">
                                                    {blockingTasks.map(t => (
                                                        <li key={t.id} className="truncate flex items-center gap-1.5">
                                                            <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                                                            {t.title}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            );
                        })}
                        
                        {/* Empty State */}
                        {statusTasks.length === 0 && (
                            <div className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200/50 rounded-xl m-1">
                                <p className="text-xs font-medium text-slate-400">No tasks</p>
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
