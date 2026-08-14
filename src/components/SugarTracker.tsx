'use client';

import React, { useState, useEffect } from 'react';
import { SugarMonitorEntry, getGlucoseStatus } from '@/types';
import { Activity, Plus, Trash2, Clock, Syringe, Droplets } from 'lucide-react';
import { formatTo12Hr } from '@/lib/storage';

interface SugarTrackerProps {
  selectedDate: string;
  entries: SugarMonitorEntry[];
  onAddEntry: (entry: Omit<SugarMonitorEntry, 'id' | 'created_at'>) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
  prefilledInsulin?: { type: string; units: number } | null;
  onClearPrefilled?: () => void;
}

// Quick check types — sugar only, no insulin
const QUICK_CHECKS = [
  { label: 'Fasting', note: 'Fasting check' },
  { label: 'After Meal', note: 'Post-meal check' },
  { label: 'Bedtime', note: 'Bedtime check' },
  { label: 'Random', note: 'Random check' },
];

const INSULIN_TYPES = [
  { value: 'Lantus', label: 'Lantus' },
  { value: 'Humalog', label: 'Humalog' },
  { value: 'Novolog', label: 'Novolog' },
  { value: 'Levemir', label: 'Levemir' },
  { value: 'Other', label: 'Other' },
];

export const SugarTracker: React.FC<SugarTrackerProps> = ({
  selectedDate,
  entries,
  onAddEntry,
  onDeleteEntry,
  prefilledInsulin,
  onClearPrefilled
}) => {
  const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

  const [time, setTime] = useState(getCurrentTime());
  const [bloodSugar, setBloodSugar] = useState<number | ''>(110);
  const [insulinType, setInsulinType] = useState('Lantus');
  const [insulinUnits, setInsulinUnits] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [mode, setMode] = useState<'check' | 'insulin'>('check');

  // Quick check state
  const [quickSugar, setQuickSugar] = useState<number | ''>(110);
  const [quickCheckType, setQuickCheckType] = useState<string | null>(null);
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);

  useEffect(() => {
    if (prefilledInsulin) {
      if (prefilledInsulin.type) setInsulinType(prefilledInsulin.type);
      if (prefilledInsulin.units) setInsulinUnits(prefilledInsulin.units);
      setMode('insulin');
      setShowCustomForm(true);
    }
  }, [prefilledInsulin]);

  // Submit quick sugar-only check
  const handleQuickCheck = async (checkLabel: string, noteText: string) => {
    if (!quickSugar || Number(quickSugar) <= 0) return;
    setQuickCheckType(checkLabel);
    setIsQuickSubmitting(true);
    try {
      await onAddEntry({
        entry_date: selectedDate,
        entry_time: getCurrentTime(),
        blood_sugar_mgdl: Number(quickSugar),
        insulin_type: null,
        insulin_units: null,
        notes: noteText
      });
      setQuickSugar(110);
    } finally {
      setIsQuickSubmitting(false);
      setQuickCheckType(null);
    }
  };

  // Submit full form (with optional insulin)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloodSugar || Number(bloodSugar) <= 0) return;
    setIsSubmitting(true);
    try {
      await onAddEntry({
        entry_date: selectedDate,
        entry_time: time,
        blood_sugar_mgdl: Number(bloodSugar),
        insulin_type: mode === 'insulin' ? (insulinType || null) : null,
        insulin_units: mode === 'insulin' && insulinUnits ? Number(insulinUnits) : null,
        notes: notes.trim() || null
      });
      setNotes('');
      setInsulinUnits('');
      setShowCustomForm(false);
      if (onClearPrefilled) onClearPrefilled();
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusColorMap = {
    normal: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-red-50 text-red-800 border-red-200'
  };

  const statusBadgeMap = {
    normal: '🟢 Normal',
    warning: '🟡 Borderline',
    danger: '🔴 High'
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-5 sm:p-6 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Blood Sugar & Insulin</h3>
            <p className="text-xs text-slate-500 font-semibold">Glucose monitoring & insulin tracking</p>
          </div>
        </div>
        <button
          onClick={() => { setShowCustomForm(!showCustomForm); setMode('check'); }}
          className="text-xs font-extrabold px-3.5 py-1.5 rounded-xl bg-navy-900 text-white hover:bg-navy-800 transition active:scale-95 flex items-center gap-1.5 shadow-sm"
          style={{ backgroundColor: '#0f172a' }}
        >
          <Plus className="w-3.5 h-3.5" />
          {showCustomForm ? 'Close' : 'Log'}
        </button>
      </div>

      {/* ── QUICK SUGAR CHECK STRIP ── */}
      <div className="mb-4 p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-3">
        <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5" /> Quick Sugar Check (No Insulin)
        </p>

        {/* Value input */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={quickSugar}
            onChange={e => setQuickSugar(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-28 text-sm font-extrabold p-2.5 rounded-xl bg-white border border-purple-200 text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-center"
            placeholder="mg/dL"
            min={20}
            max={600}
          />
          <span className="text-xs font-bold text-slate-500">mg/dL</span>
        </div>

        {/* Quick check type buttons */}
        <div className="flex flex-wrap gap-2">
          {QUICK_CHECKS.map(({ label, note }) => (
            <button
              key={label}
              disabled={isQuickSubmitting || !quickSugar}
              onClick={() => handleQuickCheck(label, note)}
              className={`text-xs font-extrabold px-3.5 py-1.5 rounded-xl border transition active:scale-95 disabled:opacity-50
                ${isQuickSubmitting && quickCheckType === label
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-600 hover:text-white hover:border-purple-600'
                }`}
            >
              {isQuickSubmitting && quickCheckType === label ? 'Saving…' : `+ ${label}`}
            </button>
          ))}
        </div>
      </div>

      {/* ── FULL LOG FORM (with insulin option) ── */}
      {showCustomForm && (
        <form onSubmit={handleSubmit} className="mb-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in duration-200">
          {/* Mode toggle */}
          <div className="flex items-center gap-2 p-1 bg-slate-200/60 rounded-xl w-fit">
            <button type="button" onClick={() => setMode('check')}
              className={`text-xs font-extrabold px-4 py-1.5 rounded-lg transition ${mode === 'check' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              Sugar Only
            </button>
            <button type="button" onClick={() => setMode('insulin')}
              className={`text-xs font-extrabold px-4 py-1.5 rounded-lg transition ${mode === 'insulin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              <Syringe className="w-3 h-3 inline mr-1" />
              + Insulin
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600" required />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Blood Sugar (mg/dL)</label>
              <input type="number" value={bloodSugar}
                onChange={e => setBloodSugar(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-xs font-bold p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                placeholder="110" required min={20} max={600} />
            </div>

            {mode === 'insulin' && (
              <>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Insulin Type</label>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                    {INSULIN_TYPES.map(t => {
                      const isSelected = insulinType === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setInsulinType(t.value)}
                          className={`flex items-center justify-center px-4.5 py-3 rounded-2xl text-sm font-bold border transition-all duration-150 shrink-0 select-none active:scale-95
                            ${isSelected 
                              ? 'bg-purple-600 border-purple-600 text-white shadow-sm' 
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Insulin (Units)</label>
                  <input type="number" value={insulinUnits}
                    onChange={e => setInsulinUnits(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-xs font-bold p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                    placeholder="10" min={0} step={0.5} />
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full text-xs font-bold p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              placeholder="Fasting check, after breakfast..." />
          </div>

          <div className="flex justify-end pt-1">
            <button type="submit" disabled={isSubmitting}
              className="text-xs font-extrabold px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition active:scale-95 shadow-sm disabled:opacity-50">
              {isSubmitting ? 'Saving…' : 'Save Entry'}
            </button>
          </div>
        </form>
      )}

      {/* Entries List */}
      {entries.length > 0 && (
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-4">Logged Entries</p>
      )}
      {entries.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <p className="text-xs font-semibold text-slate-500">No blood sugar logged yet for this date.</p>
        </div>
      ) : (
        <div className="space-y-2 -mx-1">
          {entries.map((item, i) => {
            const status = getGlucoseStatus(item.blood_sugar_mgdl);
            return (
              <div
                key={item.id}
                className="log-row flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 sm:bg-transparent sm:border-0 hover:bg-slate-50 transition-colors duration-150"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Left side: Time, Value, Status & Insulin */}
                <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs shrink-0 font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="tabular-nums">{formatTo12Hr(item.entry_time)}</span>
                  </div>
                  
                  <div className="text-sm font-black text-slate-900 shrink-0">
                    {item.blood_sugar_mgdl} <span className="text-[10px] text-slate-400 font-semibold">mg/dL</span>
                  </div>

                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${statusColorMap[status.status]}`}>
                    {statusBadgeMap[status.status]}
                  </span>

                  {item.insulin_units ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-purple-700 font-extrabold bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-lg shrink-0">
                      <Syringe className="w-3 h-3" />
                      {item.insulin_type || 'Insulin'}: {item.insulin_units} U
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[10px] bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 shrink-0">Check only</span>
                  )}
                </div>

                {/* Right side: Notes & Delete Action */}
                <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-dashed border-slate-200 sm:border-t-0 min-w-0">
                  {item.notes ? (
                    <span className="text-xs text-slate-500 font-medium italic truncate max-w-[200px]">
                      {item.notes}
                    </span>
                  ) : (
                    <span className="hidden sm:inline-block text-xs text-slate-300 font-medium italic">-</span>
                  )}
                  <button
                    onClick={() => onDeleteEntry(item.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 active:scale-90 shrink-0 ml-auto"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
