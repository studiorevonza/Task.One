import React, { useState, useEffect, useMemo } from 'react';
import { Task, Project, TaskStatus, Priority } from '../types';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Bot, Zap, Target, CheckCircle2, ArrowRight, MessageSquare, Loader2, RefreshCw, Star, ShieldCheck, TrendingUp } from 'lucide-react';
import { format, isToday, isPast } from 'date-fns';

interface WorkspaceIntelligenceProps {
  tasks: Task[];
  projects: Project[];
  addTask: (task: Task) => void;
}

const WorkspaceIntelligence: React.FC<WorkspaceIntelligenceProps> = ({ tasks, projects, addTask }) => {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);

  const pendingTasks = useMemo(() => tasks.filter(t => t.status !== TaskStatus.DONE), [tasks]);
  const highPriorityTasks = useMemo(() => pendingTasks.filter(t => t.priority === Priority.HIGH), [pendingTasks]);
  const todayTasks = useMemo(() => pendingTasks.filter(t => isToday(new Date(t.dueDate + 'T00:00:00'))), [pendingTasks]);

  const fetchBriefing = async () => {
    setLoadingBrief(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Context:
        Active Projects: ${projects.map(p => p.name).join(', ')}
        High Priority Tasks: ${highPriorityTasks.map(t => t.title).join(', ')}
        Tasks Due Today: ${todayTasks.map(t => t.title).join(', ')}

        Generate a professional, high-performance coaching "Daily Intelligence Briefing" (approx 3 sentences). 
        Make it sound like a senior executive strategist.
      `;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setBriefing(response.text || "Systems operational. Focus on your high-impact deliverables today.");
    } catch (e) {
      setBriefing("Unable to sync neural insights. Please check workspace connectivity.");
    } finally {
      setLoadingBrief(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, []);

  const handleChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
    setChatLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: "You are the TASQ Senior Workspace Strategist. You provide elite-level project management advice, technical breakdown of tasks, and efficiency optimizations. Tone: Crisp, professional, visionary."
        }
      });
      const response = await chat.sendMessage({ message: userText });
      setChatHistory(prev => [...prev, { role: 'model', text: response.text || "Acknowledged. Proceeding with analysis." }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'model', text: "Strategic link interrupted. Please retry." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const projectHealth = useMemo(() => {
    return projects.map(p => {
      const pTasks = tasks.filter(t => t.projectId === p.id);
      const completed = pTasks.filter(t => t.status === TaskStatus.DONE).length;
      const overdue = pTasks.filter(t => t.status !== TaskStatus.DONE && isPast(new Date(t.dueDate + 'T00:00:00')) && !isToday(new Date(t.dueDate + 'T00:00:00'))).length;
      return { 
        name: p.name, 
        progress: p.progress, 
        status: overdue > 0 ? 'AT RISK' : completed === pTasks.length && pTasks.length > 0 ? 'STABLE' : 'ON TRACK' 
      };
    });
  }, [projects, tasks]);

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10 animate-fade-in-up">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-200">
              <Sparkles size={28} />
            </div>
            Intelligence Hub
          </h2>
          <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-[11px]">Advanced Workspace Analytics & Strategy</p>
        </div>
        <button 
          onClick={fetchBriefing}
          disabled={loadingBrief}
          className="group flex items-center gap-3 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-800 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
        >
          {loadingBrief ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />}
          Sync Insights
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Main Strategic Column */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Elite Briefing Card */}
          <div className="neural-mesh rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
               <TrendingUp size={180} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-8">
                 <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-black uppercase tracking-[0.2em]">
                    Strategic Assessment
                 </div>
                 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>

              {loadingBrief ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-8 w-full bg-white/10 rounded-xl"></div>
                  <div className="h-8 w-3/4 bg-white/10 rounded-xl"></div>
                </div>
              ) : (
                <h3 className="text-2xl md:text-3xl font-bold leading-[1.3] max-w-2xl tracking-tight">
                  {briefing}
                </h3>
              )}

              <div className="mt-12 flex flex-wrap gap-4">
                 <div className="bg-white/10 backdrop-blur-xl px-6 py-4 rounded-[1.5rem] border border-white/10 flex items-center gap-4">
                    <div className="p-2 bg-white/10 rounded-xl">
                       <Target size={20} className="text-indigo-200" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Active Focus</p>
                       <p className="text-xl font-black">{todayTasks.length}</p>
                    </div>
                 </div>
                 <div className="bg-white/10 backdrop-blur-xl px-6 py-4 rounded-[1.5rem] border border-white/10 flex items-center gap-4">
                    <div className="p-2 bg-white/10 rounded-xl">
                       <Zap size={20} className="text-amber-200" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-amber-200 uppercase tracking-widest">Urgent Risk</p>
                       <p className="text-xl font-black">{highPriorityTasks.length}</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Suggested Roadmap */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
               <h3 className="font-black text-slate-900 flex items-center gap-3 uppercase tracking-tighter text-lg">
                 <Target size={22} className="text-indigo-600" />
                 Optimized Focus Path
               </h3>
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Based on Velocity</span>
               </div>
            </div>
            <div className="p-8 space-y-4">
               {highPriorityTasks.length === 0 && todayTasks.length === 0 ? (
                 <div className="text-center py-20 flex flex-col items-center">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 size={32} className="text-emerald-500" />
                   </div>
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Horizon clear. Systems fully optimized.</p>
                 </div>
               ) : (
                 [...highPriorityTasks, ...todayTasks].slice(0, 4).map((task, i) => (
                   <div key={task.id} className="flex items-center gap-6 p-6 rounded-[2rem] bg-slate-50 border border-slate-100 hover:border-indigo-300 hover:bg-white transition-all group cursor-pointer shadow-none hover:shadow-xl hover:shadow-indigo-50">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-400 text-sm shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-all">
                        0{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                         <h4 className="font-black text-slate-900 text-base truncate uppercase tracking-tight">{task.title}</h4>
                         <div className="flex items-center gap-3 mt-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${task.priority === Priority.HIGH ? 'text-red-500' : 'text-indigo-500'}`}>
                               {task.priority} Priority
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                               Due {format(new Date(task.dueDate + 'T00:00:00'), 'MMM dd')}
                            </span>
                         </div>
                      </div>
                      <div className="p-3 bg-white rounded-xl text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all">
                         <ArrowRight size={20} />
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>

        </div>

        {/* Analytics & Consulting Column */}
        <div className="space-y-10">
          
          {/* Project Health Index */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col">
             <h3 className="font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-tighter text-lg">
               <ShieldCheck size={22} className="text-emerald-500" />
               Health Index
             </h3>
             <div className="space-y-6">
                {projectHealth.map(p => (
                   <div key={p.name} className="flex flex-col gap-3 p-4 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                      <div className="flex justify-between items-center">
                         <p className="text-sm font-black text-slate-800 truncate uppercase tracking-tight">{p.name}</p>
                         <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${p.status === 'AT RISK' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
                            {p.status}
                         </span>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                               className={`h-full transition-all duration-1000 ${p.status === 'AT RISK' ? 'bg-red-500' : 'bg-indigo-600'}`} 
                               style={{ width: `${p.progress}%` }} 
                            />
                         </div>
                         <span className="text-xs font-black text-slate-900 w-10 text-right">{p.progress}%</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* Real-time Strategy Consultant */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl flex flex-col h-[500px] border border-slate-800">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner">
                      <MessageSquare size={24} />
                   </div>
                   <div>
                      <h3 className="font-black text-sm uppercase tracking-tight">AI Strategist</h3>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Active Interface</p>
                </div>
                </div>
                <div className="flex gap-1">
                   <div className="w-1 h-1 rounded-full bg-indigo-500"></div>
                   <div className="w-1 h-1 rounded-full bg-indigo-500"></div>
                   <div className="w-1 h-1 rounded-full bg-indigo-500"></div>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto space-y-6 mb-8 pr-2 custom-scrollbar">
                {chatHistory.length === 0 && (
                   <div className="text-center py-16 opacity-40">
                      <Star size={40} className="mx-auto text-indigo-400 mb-4" />
                      <p className="text-slate-400 text-xs font-bold px-6 leading-relaxed">Secure link established. Submit project queries for deep analysis.</p>
                   </div>
                )}
                {chatHistory.map((msg, i) => (
                   <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                      <div className={`max-w-[85%] p-4 rounded-3xl text-xs font-bold leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-white/10 text-indigo-50 border border-white/5'}`}>
                         {msg.text}
                      </div>
                   </div>
                ))}
                {chatLoading && (
                   <div className="flex justify-start">
                      <div className="bg-white/5 p-4 rounded-3xl flex items-center gap-3">
                         <div className="flex gap-1">
                            <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                            <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                            <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                         </div>
                         <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Analyzing</span>
                      </div>
                   </div>
                )}
             </div>

             <form onSubmit={handleChat} className="relative mt-auto">
                <input 
                   type="text" 
                   placeholder="Command Strategy..."
                   className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                   value={chatInput}
                   onChange={(e) => setChatInput(e.target.value)}
                />
                <button 
                   type="submit"
                   disabled={!chatInput.trim() || chatLoading}
                   className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 rounded-xl text-white hover:bg-indigo-500 transition-all disabled:opacity-50 shadow-lg shadow-indigo-900"
                >
                   <ArrowRight size={18} strokeWidth={3} />
                </button>
             </form>
          </div>

        </div>

      </div>
    </div>
  );
};

export default WorkspaceIntelligence;