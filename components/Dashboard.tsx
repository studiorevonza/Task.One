import React from 'react';
import { Project, Task, TaskStatus, Priority, User, View } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CheckCircle2, AlertCircle, Clock, Briefcase, Calendar, Zap } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardProps {
  tasks: Task[];
  projects: Project[];
  user: User | null;
  onViewChange: (view: View) => void;
  onProjectSelect: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, projects, user, onViewChange, onProjectSelect }) => {
  // Stats calculation
  const completedTasks = tasks.filter(task => task.status === TaskStatus.DONE);
  const inProgressTasks = tasks.filter(task => task.status === TaskStatus.IN_PROGRESS);
  const overdueTasks = tasks.filter(task => 
    new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE
  );

  // Calculate stats
  const stats = {
    totalTasks: tasks.length,
    completed: completedTasks.length,
    inProgress: inProgressTasks.length,
    overdue: overdueTasks.length,
    completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0
  };

  // Chart data for task distribution
  const taskDistributionData = [
    { name: 'Completed', value: completedTasks.length, color: '#10b981' },
    { name: 'In Progress', value: inProgressTasks.length, color: '#3b82f6' },
    { name: 'To Do', value: tasks.filter(t => t.status === TaskStatus.TODO).length, color: '#f59e0b' },
    { name: 'Review', value: tasks.filter(t => t.status === TaskStatus.REVIEW).length, color: '#8b5cf6' },
  ].filter(item => item.value > 0); // Only show non-zero values

  // Project stats
  const activeProjects = projects.filter(project => {
    const projectTasks = tasks.filter(task => task.projectId === project.id);
    return projectTasks.some(task => task.status !== TaskStatus.DONE);
  });

  // Recent tasks (most recent due dates)
  const upcomingTasks = [...tasks]
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 bg-white">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-slate-600 mt-2">
          Here's what's happening with your tasks and projects today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div 
          className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-slate-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onViewChange('TASKS')}
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Briefcase className="text-blue-600" size={24} />
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-slate-900">{stats.totalTasks}</h3>
              <p className="text-slate-600">Total Tasks</p>
            </div>
          </div>
        </div>

        <div 
          className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border border-slate-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onViewChange('TASKS')}
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="text-green-600" size={24} />
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-slate-900">{stats.completed}</h3>
              <p className="text-slate-600">Completed</p>
            </div>
          </div>
        </div>

        <div 
          className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-xl border border-slate-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onViewChange('TASKS')}
        >
          <div className="flex items-center">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Clock className="text-amber-600" size={24} />
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-slate-900">{stats.inProgress}</h3>
              <p className="text-slate-600">In Progress</p>
            </div>
          </div>
        </div>

        <div 
          className="bg-gradient-to-r from-red-50 to-rose-50 p-5 rounded-xl border border-slate-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onViewChange('TASKS')}
        >
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="text-red-600" size={24} />
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-slate-900">{stats.overdue}</h3>
              <p className="text-slate-600">Overdue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Rate and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Completion Rate Card */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Completion Rate</h3>
          <div className="flex flex-col items-center">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - stats.completionRate / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">{stats.completionRate}%</span>
                <span className="text-slate-600 text-sm">Complete</span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-slate-600">
                {stats.completed} of {stats.totalTasks} tasks completed
              </p>
            </div>
          </div>
        </div>

        {/* Task Distribution */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Task Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {taskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} tasks`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Projects and Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects */}
        <div 
          className="bg-white border border-slate-200 rounded-xl p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onViewChange('PROJECTS')}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Active Projects</h3>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {activeProjects.length}
            </span>
          </div>
          <div className="space-y-3">
            {activeProjects.length > 0 ? (
              activeProjects.map(project => {
                const projectTasks = tasks.filter(task => task.projectId === project.id);
                const completedProjectTasks = projectTasks.filter(task => task.status === TaskStatus.DONE);
                const progress = projectTasks.length > 0 
                  ? Math.round((completedProjectTasks.length / projectTasks.length) * 100) 
                  : 0;

                return (
                  <div 
                    key={project.id} 
                    className="p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onProjectSelect(project.id);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-slate-900">{project.name}</h4>
                      <span className="text-sm text-slate-600">{progress}%</span>
                    </div>
                    <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">
                      {completedProjectTasks.length}/{projectTasks.length} tasks completed
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-600 italic">No active projects</p>
            )}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div 
          className="bg-white border border-slate-200 rounded-xl p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onViewChange('TASKS')}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Upcoming Tasks</h3>
            <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {upcomingTasks.length}
            </span>
          </div>
          <div className="space-y-3">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map(task => (
                <div key={task.id} className="p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-slate-900">{task.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.priority === Priority.HIGH ? 'bg-red-100 text-red-800' :
                      task.priority === Priority.MEDIUM ? 'bg-amber-100 text-amber-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600 mt-2">
                    <Calendar size={14} className="mr-1" />
                    <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      task.status === TaskStatus.DONE ? 'bg-green-100 text-green-800' :
                      task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                      task.status === TaskStatus.REVIEW ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-600 italic">No upcoming tasks</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;