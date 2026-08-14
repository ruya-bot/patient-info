'use client';

import React, { useState } from 'react';
import { WaterIntakeEntry } from '@/types';
import { Plus, Trash2, Clock, GlassWater, X } from 'lucide-react';
import { formatTo12Hr } from '@/lib/storage';

interface WaterTrackerProps {
  selectedDate: string;
  entries: WaterIntakeEntry[];
  onAddEntry: (entry: Omit<WaterIntakeEntry, 'id' | 'created_at'>) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
}

const QUICK_PRESETS = [
  { label: '100ml', emoji: '💧', liquid: 'Water',    amount: 100 },
  { label: '200ml', emoji: '💧', liquid: 'Water',    amount: 200 },
  { label: '100ml Tea', emoji: '🍵', liquid: 'Tea',  amount: 100 },
  { label: '100ml Juice', emoji: '🥤', liquid: 'Juice', amount: 100 },
  { label: '100ml IV', emoji: '💉', liquid: 'IV Fluid', amount: 100 },
];

const LIQUID_TYPES = [
  { value: 'Water', emoji: '💧' },
  { value: 'Tea', emoji: '🍵' },
  { value: 'Juice', emoji: '🥤' },
  { value: 'Coffee', emoji: '☕' },
  { value: 'Soup', emoji: '🍲' },
  { value: 'IV Fluid', emoji: '💉' },
  { value: 'Other', emoji: '🏷️' },
];

export const WaterTracker: React.FC<WaterTrackerProps> = ({
  selectedDate, entries, onAddEntry, onDeleteEntry
}) => {
  const now = () => new Date().toTimeString().slice(0, 5);
  const [time, setTime] = useState(now());
  const [liquidType, setLiquidType] = useState('Water');
  const [amountMl, setAmountMl] = useState<number | ''>(100);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [quickSaving, setQuickSaving] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const totalMl = entries.reduce((s, e) => s + Number(e.amount_ml || 0), 0);

  const handleQuick = async (liquid: string, amount: number, label: string) => {
    setQuickSaving(label);
    try {
      await onAddEntry({ entry_date: selectedDate, entry_time: now(), liquid_type: liquid, amount_ml: amount, notes: 'Quick log' });
    } finally { setQuickSaving(null); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountMl || Number(amountMl) <= 0) return;
    setSaving(true);
    try {
      await onAddEntry({ entry_date: selectedDate, entry_time: time || now(), liquid_type: liquidType, amount_ml: Number(amountMl), notes: notes.trim() || null });
      setNotes(''); setAmountMl(100); setShowForm(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="card p-5 anim-fade-up">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
            <GlassWater className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-[15px] font-extrabold text-slate-900 leading-tight">Water Intake</h3>
            <p className="text-[11px] text-slate-400 font-semibold">Fluid volume consumed</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-blue-700 bg-blue-50 px-3 py-1.5 rounded-2xl border border-blue-100 tabular-nums">
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

      {/* Quick-log pills */}
      <div className="mb-3">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quick Log</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PRESETS.map(p => (
            <button
              key={p.label}
              disabled={!!quickSaving}
              onClick={() => handleQuick(p.liquid, p.amount, p.label)}
              className={`pill-btn text-blue-800 border-blue-200 shadow-sm
                ${quickSaving === p.label ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 hover:bg-blue-100'}`}
            >
              {p.emoji} {quickSaving === p.label ? '...' : p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 anim-slide-down">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Amount (ml)</label>
              <input type="number" min="0" step="10" value={amountMl}
                onChange={e => setAmountMl(e.target.value === '' ? '' : Number(e.target.value))}
                className="input-field" placeholder="100" required />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Liquid Type</label>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                {LIQUID_TYPES.map(t => {
                  const isSelected = liquidType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setLiquidType(t.value)}
                      className={`flex items-center gap-1.5 px-4.5 py-3 rounded-2xl text-sm font-bold border transition-all duration-150 shrink-0 select-none active:scale-95
                        ${isSelected 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <span className="text-base">{t.emoji}</span>
                      <span>{t.value}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Notes</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="input-field" placeholder="Optional..." />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold transition-all duration-200 active:scale-98 shadow-sm disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Entry'}
          </button>
        </form>
      )}

      {/* Log list */}
      {/* Log list */}
      {entries.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-1 mt-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="w-24 shrink-0">Time</span>
            <span className="w-20 shrink-0 text-center">Type</span>
            <span>Amount</span>
          </div>
          <span className="w-8 text-right">Delete</span>
        </div>
      )}
      {entries.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <GlassWater className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-400">No fluid logged yet</p>
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
                <span className="w-20 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 shrink-0 text-center truncate">
                  {e.liquid_type}
                </span>
                <span className="text-sm font-black text-slate-900 tabular-nums">
                  {e.amount_ml} <span className="text-[11px] text-slate-400 font-semibold">ml</span>
                </span>
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
