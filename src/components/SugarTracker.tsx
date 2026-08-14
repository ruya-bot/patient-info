'use client';

import React, { useState, useEffect } from 'react';
import { SugarMonitorEntry, getGlucoseStatus } from '@/types';
import { Activity, Plus, Trash2, Clock, Syringe, Droplets } from 'lucide-react';

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
    high: 'bg-red-50 text-red-800 border-red-200'
  };

  const statusBadgeMap = {
    normal: '🟢 Normal',
    warning: '🟡 Borderline',
    high: '🔴 High'
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

          <div className={`grid grid-cols-1 gap-3 ${mode === 'insulin' ? 'sm:grid-cols-2 md:grid-cols-4' : 'sm:grid-cols-2'}`}>
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
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Insulin Type</label>
                  <select value={insulinType} onChange={e => setInsulinType(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600">
                    <option value="Lantus">Lantus (Long-acting)</option>
                    <option value="Humalog">Humalog (Rapid-acting)</option>
                    <option value="Novolog">Novolog (Rapid-acting)</option>
                    <option value="Levemir">Levemir</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
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
      {entries.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <p className="text-xs font-semibold text-slate-500">No blood sugar logged yet for this date.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-50/80">
                <th className="py-2.5 px-3 rounded-l-xl">Time</th>
                <th className="py-2.5 px-3">Blood Sugar</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Insulin</th>
                <th className="py-2.5 px-3">Notes</th>
                <th className="py-2.5 px-3 text-right rounded-r-xl">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {entries.map(item => {
                const status = getGlucoseStatus(item.blood_sugar_mgdl);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-extrabold text-slate-900">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" />{item.entry_time}</span>
                    </td>
                    <td className="py-3 px-3 font-extrabold text-slate-900">
                      {item.blood_sugar_mgdl} <span className="text-[10px] text-slate-500 font-bold">mg/dL</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${statusColorMap[status]}`}>
                        {statusBadgeMap[status]}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-700">
                      {item.insulin_units ? (
                        <span className="inline-flex items-center gap-1 text-purple-700 font-extrabold bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-lg">
                          <Syringe className="w-3 h-3" />
                          {item.insulin_type || 'Insulin'}: {item.insulin_units} U
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Check only</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-medium">{item.notes || '-'}</td>
                    <td className="py-3 px-3 text-right">
                      <button onClick={() => onDeleteEntry(item.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition rounded-lg hover:bg-red-50" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
