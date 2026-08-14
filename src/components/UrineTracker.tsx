'use client';

import React, { useState } from 'react';
import { UrineOutputEntry } from '@/types';
import { Droplet, Plus, Trash2, Clock, X } from 'lucide-react';
import { formatTo12Hr } from '@/lib/storage';

interface UrineTrackerProps {
  selectedDate: string;
  entries: UrineOutputEntry[];
  onAddEntry: (entry: Omit<UrineOutputEntry, 'id' | 'created_at'>) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
}

const QUICK_PRESETS = [
  { label: '100ml', volume: 100 },
  { label: '200ml', volume: 200 },
  { label: '300ml', volume: 300 },
  { label: '400ml', volume: 400 },
  { label: '500ml', volume: 500 },
];

export const UrineTracker: React.FC<UrineTrackerProps> = ({
  selectedDate, entries, onAddEntry, onDeleteEntry
}) => {
  const now = () => new Date().toTimeString().slice(0, 5);
  const [time, setTime] = useState(now());
  const [volumeMl, setVolumeMl] = useState<number | ''>(100);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [quickSaving, setQuickSaving] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const totalMl = entries.reduce((s, e) => s + Number(e.volume_ml || 0), 0);

  const handleQuick = async (volume: number) => {
    setQuickSaving(volume);
    try {
      await onAddEntry({ entry_date: selectedDate, entry_time: now(), volume_ml: volume, notes: 'Quick log' });
    } finally { setQuickSaving(null); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volumeMl || Number(volumeMl) <= 0) return;
    setSaving(true);
    try {
      await onAddEntry({ entry_date: selectedDate, entry_time: time || now(), volume_ml: Number(volumeMl), notes: notes.trim() || null });
      setNotes(''); setVolumeMl(100); setShowForm(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="card p-5 anim-fade-up" style={{ animationDelay: '60ms' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shadow-sm">
            <Droplet className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-[15px] font-extrabold text-slate-900 leading-tight">Urine Output</h3>
            <p className="text-[11px] text-slate-400 font-semibold">Voided fluid volume</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-amber-700 bg-amber-50 px-3 py-1.5 rounded-2xl border border-amber-100 tabular-nums">
            {totalMl} ml
          </span>
          <button
            onClick={() => setShowForm(v => !v)}
            className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-90 border shadow-sm
              ${showForm ? 'bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-900 text-white'}`}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Quick pills */}
      <div className="mb-3">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quick Log</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PRESETS.map(p => (
            <button
              key={p.volume}
              disabled={quickSaving !== null}
              onClick={() => handleQuick(p.volume)}
              className={`pill-btn text-amber-800 border-amber-200 shadow-sm
                ${quickSaving === p.volume ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50 hover:bg-amber-100'}`}
            >
              🧡 {quickSaving === p.volume ? '...' : p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 anim-slide-down">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Volume (ml)</label>
              <input type="number" min="0" step="10" value={volumeMl}
                onChange={e => setVolumeMl(e.target.value === '' ? '' : Number(e.target.value))}
                className="input-field" placeholder="250" required />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Notes</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="input-field" placeholder="Clear, pale yellow..." />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-extrabold transition-all duration-200 active:scale-98 shadow-sm disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Entry'}
          </button>
        </form>
      )}

      {/* Log list */}
      {entries.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-1 mt-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="w-24 shrink-0">Time</span>
            <span className="w-20 shrink-0">Volume</span>
            <span>Notes</span>
          </div>
          <span className="w-8 text-right">Delete</span>
        </div>
      )}
      {entries.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <Droplet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-400">No output logged yet</p>
        </div>
      ) : (
        <div className="space-y-1 -mx-1">
          {entries.map((e, i) => (
            <div key={e.id}
              className="log-row flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-slate-50"
              style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="w-24 text-xs font-bold text-slate-700 tabular-nums shrink-0 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {formatTo12Hr(e.entry_time)}
                </span>
                <span className="w-20 text-sm font-black text-slate-900 tabular-nums shrink-0">
                  {e.volume_ml} <span className="text-[11px] text-slate-400 font-semibold">ml</span>
                </span>
                {e.notes && e.notes !== 'Quick log' ? (
                  <span className="text-[11px] text-slate-400 italic truncate">{e.notes}</span>
                ) : (
                  <span className="hidden sm:inline-block text-[11px] text-slate-300 font-semibold italic">-</span>
                )}
              </div>
              <button onClick={() => onDeleteEntry(e.id)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all duration-150 active:scale-90 shrink-0 w-8 flex justify-end">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
