
import React, { useState } from 'react';
import { Bell, X, Check, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface Notification {
    id: string;
    title: string;
    message: string;
    time: Date;
    type: 'deadline' | 'reminder' | 'system';
    read: boolean;
}

interface NotificationCenterProps {
    notifications: string[];
    onClear: (index: number) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onClear }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 group"
            >
                <Bell size={20} className={notifications.length > 0 ? 'animate-bounce' : ''} />
                {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                        {notifications.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white border border-slate-200 rounded-[2rem] shadow-2xl z-50 overflow-hidden animate-fade-in-up">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                Neural Feed
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-2 py-0.5 rounded-full border border-slate-200">
                                {notifications.length} Units
                            </span>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-12 text-center opacity-40">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                                        <Check size={24} className="text-slate-300" />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">All Systems Nominal</p>
                                </div>
                            ) : (
                                <div className="p-2 space-y-1">
                                    {notifications.map((notif, idx) => (
                                        <div key={idx} className="group flex items-start gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all relative">
                                            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl shadow-inner mt-0.5">
                                                <AlertTriangle size={16} />
                                            </div>
                                            <div className="flex-1 pr-6">
                                                <p className="text-[13px] text-slate-700 font-medium leading-relaxed">{notif}</p>
                                                <div className="flex items-center gap-2 mt-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <Clock size={10} />
                                                    Recent Alert
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => onClear(idx)}
                                                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 p-1 rounded-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                            <button className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                                View Intelligence Logs
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationCenter;
