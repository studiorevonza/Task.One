
import React, { useState, useRef, useEffect } from 'react';
import { Task, Project, Message, Priority, Category, TaskStatus } from '../types';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Send, Loader2, Plus, MessageSquare, Lightbulb, Trash2, ArrowRight, CheckCircle2, Bot, User as UserIcon, ListChecks, Zap, Terminal } from 'lucide-react';

interface BrainstormViewProps {
  tasks: Task[];
  projects: Project[];
  addTask: (task: Task) => void;
}

const BrainstormView: React.FC<BrainstormViewProps> = ({ tasks, projects, addTask }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: "Welcome to your Strategy Lab. I've analyzed your current workflow. How can I help you scale your projects today?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // guideline: Create a new GoogleGenAI instance right before making an API call using process.env.API_KEY.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = `
        User context:
        Projects: ${projects.map(p => p.name).join(', ')}
        Unfinished Tasks: ${tasks.filter(t => t.status !== TaskStatus.DONE).map(t => t.title).join(', ')}
      `;

      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `You are a high-performance productivity coach. 
          Provide crisp, tactical advice. 
          When suggesting tasks, use a bulleted list starting with "- " or numbers. 
          Context: ${context}`
        }
      });

      const response = await chat.sendMessage({ message: input });
      // response.text is a getter, do not use text().
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || "I'm having trouble analyzing that. Could you rephrase?",
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Connection failed. Please verify your workspace configuration.",
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const parseTasksFromText = (text: string) => {
    const lines = text.split('\n');
    return lines
      .filter(line => line.trim().match(/^[-*•\d.]+/))
      .map(line => line.replace(/^[-*•\d.]+\s*/, '').trim())
      .filter(line => line.length > 5 && !line.toLowerCase().includes('pro-tip'));
  };

  const createQuickTask = (title: string) => {
    addTask({
      id: Date.now().toString(),
      title,
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      category: Category.COMPANY,
      dueDate: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Premium Header */}
      <div className="px-8 py-5 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">AI Strategy Lab</h2>
            <div className="flex items-center gap-2">
               <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Gemini Neural Engine Active</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setMessages([messages[0]])}
          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          title="Reset Session"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Canvas */}
        <div className="flex-1 flex flex-col h-full relative">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar scroll-smooth"
          >
            {messages.map((msg, idx) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                <div className={`max-w-[80%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'model' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>
                    {msg.role === 'model' ? <Bot size={20} /> : <UserIcon size={20} />}
                  </div>
                  
                  <div className="space-y-4">
                    <div className={`rounded-2xl p-5 shadow-sm leading-relaxed text-sm ${
                      msg.role === 'user' 
                        ? 'bg-slate-900 text-white rounded-tr-none font-medium' 
                        : 'ai-bubble-gradient border border-indigo-100 text-slate-800 rounded-tl-none font-medium shadow-indigo-100/20'
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>

                    {/* Smart Extraction Board */}
                    {msg.role === 'model' && parseTasksFromText(msg.text).length > 0 && (
                      <div className="bg-white rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-50/50 overflow-hidden ml-2">
                        <div className="px-4 py-3 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between">
                           <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                              <ListChecks size={14} /> Identified Actions
                           </span>
                           <span className="text-[10px] text-indigo-400 font-bold">{parseTasksFromText(msg.text).length} tasks</span>
                        </div>
                        <div className="p-2 space-y-1">
                          {parseTasksFromText(msg.text).map((task, i) => (
                            <button 
                              key={i}
                              onClick={() => createQuickTask(task)}
                              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 text-xs font-bold text-slate-700 transition-all group text-left border border-transparent hover:border-indigo-100"
                            >
                              <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                 <Plus size={14} />
                              </div>
                              <span className="flex-1 truncate">{task}</span>
                              <Zap size={12} className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start animate-pulse-subtle">
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Bot size={20} />
                  </div>
                  <div className="ai-bubble-gradient border border-indigo-100 rounded-2xl rounded-tl-none p-5 flex items-center gap-3 shadow-sm">
                    <div className="flex gap-1">
                       <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                       <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                       <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                    </div>
                    <span className="text-xs text-indigo-600 font-black uppercase tracking-widest">Synthesizing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Console */}
          <div className="p-8 bg-white border-t border-slate-200">
            <div className="max-w-4xl mx-auto">
              {messages.length === 1 && (
                 <div className="flex flex-wrap gap-2 mb-6">
                    {[
                      "Draft an executive summary", 
                      "Prioritize my high-risk tasks", 
                      "Generate a 5-day sprint plan",
                      "How do I clear my backlog?"
                    ].map(p => (
                      <button 
                        key={p} 
                        onClick={() => setInput(p)}
                        className="text-[11px] font-bold px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center gap-2 shadow-sm bg-white"
                      >
                        <Lightbulb size={12} className="text-amber-500" />
                        {p}
                      </button>
                    ))}
                 </div>
              )}
              <div className="relative group">
                <div className="absolute inset-0 bg-indigo-600/5 rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                <div className="relative bg-slate-50 border border-slate-200 rounded-[2rem] p-2 flex items-center gap-2 group-focus-within:border-indigo-400 group-focus-within:bg-white transition-all shadow-sm group-focus-within:shadow-indigo-100">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400">
                     <Terminal size={20} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Command Gemini Intelligence..."
                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-800 placeholder:text-slate-400 px-2"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSend();
                    }}
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="h-12 w-12 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all flex items-center justify-center shadow-lg shadow-indigo-200 disabled:opacity-20 active:scale-90"
                  >
                    <Send size={18} fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="hidden xl:flex w-96 border-l border-slate-200 bg-white flex-col p-8 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Knowledge Base</h3>
            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded">Live Sync</span>
          </div>

          <div className="space-y-8">
             <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                   <h4 className="text-sm font-extrabold text-slate-900">Project Landscape</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active</p>
                      <p className="text-xl font-black text-slate-900">{projects.length}</p>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Blockers</p>
                      <p className="text-xl font-black text-slate-900">{tasks.filter(t => t.priority === Priority.HIGH).length}</p>
                   </div>
                </div>
             </div>
             
             <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                   <h4 className="text-sm font-extrabold text-slate-900">Neural Strategies</h4>
                </div>
                <div className="space-y-3">
                   {[
                     { title: "Recursive Decomposition", desc: "AI breaks goals into sub-atomic tasks." },
                     { title: "Priority Mesh", desc: "Cross-referencing deadlines with ROI." },
                     { title: "Zero-Backlog Protocol", desc: "Automated sorting of legacy tasks." }
                   ].map((item, i) => (
                     <div key={i} className="group p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                        <p className="text-xs font-black text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">{item.title}</p>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                     </div>
                   ))}
                </div>
             </div>

             <div className="mt-auto pt-8">
                <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Zap size={60} />
                   </div>
                   <p className="text-[10px] font-black opacity-50 uppercase tracking-[0.2em] mb-2">Strategy Tip</p>
                   <p className="text-sm font-bold leading-relaxed mb-4">
                      "Ask me to simulate a stakeholder review for your Q4 campaign."
                   </p>
                   <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                      Try This Command
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrainstormView;
