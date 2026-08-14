'use client';

import React, { useState } from 'react';
import { MedicationSchedule, MedicationCategory, MedicationRecurrence } from '@/types';
import { Pill, Plus, Trash2, Clock, Syringe, CheckCircle2, XCircle } from 'lucide-react';

interface ScheduleTrackerProps {
  schedules: MedicationSchedule[];
  onAddSchedule: (schedule: Omit<MedicationSchedule, 'id' | 'created_at'>) => Promise<void>;
  onUpdateSchedule: (id: string, updates: Partial<MedicationSchedule>) => Promise<void>;
  onDeleteSchedule: (id: string) => Promise<void>;
}

export const ScheduleTracker: React.FC<ScheduleTrackerProps> = ({
  schedules,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule
}) => {
  const [medicineName, setMedicineName] = useState('');
  const [doseLabel, setDoseLabel] = useState('');
  const [category, setCategory] = useState<MedicationCategory>('insulin');
  const [scheduledTime, setScheduledTime] = useState('08:00');
  const [label, setLabel] = useState('');
  const [recurrence, setRecurrence] = useState<MedicationRecurrence>('daily');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleAddPreset = async (presetType: 'morning' | 'night') => {
    setIsSubmitting(true);
    try {
      if (presetType === 'morning') {
        await onAddSchedule({
          medicine_name: 'Insulin (Lantus)',
          dose_label: '10 units',
          category: 'insulin',
          scheduled_time: '08:00',
          label: 'Morning Insulin',
          recurrence: 'daily',
          active: true
        });
      } else {
        await onAddSchedule({
          medicine_name: 'Insulin (Lantus)',
          dose_label: '12 units',
          category: 'insulin',
          scheduled_time: '20:00',
          label: 'Night Insulin',
          recurrence: 'daily',
          active: true
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddSchedule({
        medicine_name: medicineName.trim(),
        dose_label: doseLabel.trim() || null,
        category,
        scheduled_time: scheduledTime,
        label: label.trim() || null,
        recurrence,
        active: true
      });

      setMedicineName('');
      setDoseLabel('');
      setLabel('');
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="premium-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 shadow-sm">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Medicine &amp; Insulin Schedule</h3>
            <p className="text-xs text-slate-500 font-semibold">Daily alarm schedule manager</p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-extrabold px-3.5 py-1.5 rounded-xl bg-navy-900 text-white hover:bg-navy-800 transition active:scale-95 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          {showForm ? 'Close' : 'Add Dose'}
        </button>
      </div>

      {/* Presets */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider py-1">Presets:</span>
        <button
          onClick={() => handleAddPreset('morning')}
          disabled={isSubmitting}
          className="text-xs font-extrabold px-3.5 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
        >
          <Syringe className="w-3.5 h-3.5 text-purple-600" />
          + Morning Insulin (08:00)
        </button>
        <button
          onClick={() => handleAddPreset('night')}
          disabled={isSubmitting}
          className="text-xs font-extrabold px-3.5 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
        >
          <Syringe className="w-3.5 h-3.5 text-indigo-600" />
          + Night Insulin (20:00)
        </button>
      </div>

      {/* Form Drawer */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Medicine Name</label>
              <input
                type="text"
                value={medicineName}
                onChange={e => setMedicineName(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                placeholder="Insulin (Lantus)"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Dose Label</label>
              <input
                type="text"
                value={doseLabel}
                onChange={e => setDoseLabel(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                placeholder="10 units / 500mg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Scheduled Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as MedicationCategory)}
                className="w-full text-xs font-bold p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              >
                <option value="insulin">Insulin</option>
                <option value="oral">Oral Medication</option>
                <option value="iv">IV Infusion</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Schedule Label</label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                placeholder="Morning Dose"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Recurrence</label>
              <select
                value={recurrence}
                onChange={e => setRecurrence(e.target.value as MedicationRecurrence)}
                className="w-full text-xs font-bold p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              >
                <option value="daily">Daily</option>
                <option value="once">Once</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="text-xs font-extrabold px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition active:scale-95 shadow-sm disabled:opacity-50"
            >
              Save Schedule
            </button>
          </div>
        </form>
      )}

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <p className="text-xs font-semibold text-slate-500">
            No medication schedules configured yet. Use the presets above to add Yousef&apos;s insulin schedules.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {schedules.map(sched => (
            <div
              key={sched.id}
              className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                sched.active
                  ? 'bg-purple-50/50 border-purple-200 shadow-sm'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-white border border-purple-100 text-purple-700 shadow-sm">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900">
                      {sched.scheduled_time.slice(0, 5)}
                    </span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-900 border border-purple-200">
                      {sched.label || sched.medicine_name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {sched.medicine_name} {sched.dose_label ? `(${sched.dose_label})` : ''} • {sched.recurrence}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onUpdateSchedule(sched.id, { active: !sched.active })}
                  className="p-1.5 text-slate-400 hover:text-purple-600 transition"
                  title={sched.active ? 'Disable Reminder' : 'Enable Reminder'}
                >
                  {sched.active ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-slate-400" />
                  )}
                </button>
                <button
                  onClick={() => onDeleteSchedule(sched.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 transition"
                  title="Delete Schedule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
