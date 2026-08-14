'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Bell, CheckCircle2, HeartPulse, Calendar } from 'lucide-react';
import { getLocalTodayString, shiftDateString } from '@/lib/storage';

interface HeaderProps {
  selectedDate: string;
  onDateChange: (d: string) => void;
  onRequestPush: () => void;
  pushSubscribed: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  selectedDate, onDateChange, onRequestPush, pushSubscribed
}) => {
  const isToday = selectedDate === getLocalTodayString();

  const fmt = (d: string) => {
    const [y, m, day] = d.split('-');
    return new Date(+y, +m - 1, +day).toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short'
    });
  };

  return (
    <header className="sticky top-0 z-40 glass border-b border-slate-200/60 shadow-sm">
      {/* Brand row */}
      <div className="max-w-2xl mx-auto px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-md">
            <HeartPulse className="w-4.5 h-4.5 text-blue-300 w-[18px] h-[18px]" />
          </div>
          <div>
            <h1 className="text-[15px] font-black text-slate-900 leading-none tracking-tight flex items-center gap-1.5">
              Patient Monitor
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
            </h1>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Yousef Care</p>
          </div>
        </div>

        <button
          onClick={onRequestPush}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold border transition-all duration-200 active:scale-95 ${
            pushSubscribed
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {pushSubscribed
            ? <><CheckCircle2 className="w-4 h-4" /><span className="hidden sm:inline">Active</span></>
            : <><Bell className="w-4 h-4" /><span className="hidden sm:inline">Alarms</span></>}
        </button>
      </div>

      {/* Date nav row */}
      <div className="max-w-2xl mx-auto px-4 pb-3 flex items-center gap-2">
        <button
          onClick={() => onDateChange(shiftDateString(selectedDate, -1))}
          className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-600 active:scale-95 transition hover:bg-slate-50"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 shadow-sm rounded-2xl px-4 py-2.5">
          <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => e.target.value && onDateChange(e.target.value)}
            className="bg-transparent text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
          />
          {isToday
            ? <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wide">Today</span>
            : <button onClick={() => onDateChange(getLocalTodayString())} className="text-[11px] font-bold text-blue-600 hover:underline">Today</button>
          }
        </div>

        <button
          onClick={() => onDateChange(shiftDateString(selectedDate, 1))}
          className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-600 active:scale-95 transition hover:bg-slate-50"
          aria-label="Next day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
