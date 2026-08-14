'use client';

import React, { useEffect } from 'react';
import { MedicationReminderLog } from '@/types';
import { playAlarmSound, stopAlarmSound } from '@/lib/audio';
import { BellRing, CheckCircle, Clock, XCircle, Syringe } from 'lucide-react';

interface AlarmModalProps {
  pendingReminder: MedicationReminderLog | null;
  alarmTone?: string;
  onMarkGiven: (reminder: MedicationReminderLog) => void;
  onSnooze: (reminderId: string) => void;
  onMarkMissed: (reminderId: string) => void;
}

export const AlarmModal: React.FC<AlarmModalProps> = ({
  pendingReminder,
  alarmTone = 'chime',
  onMarkGiven,
  onSnooze,
  onMarkMissed
}) => {
  useEffect(() => {
    if (pendingReminder) {
      playAlarmSound(alarmTone);
    } else {
      stopAlarmSound();
    }
    return () => {
      stopAlarmSound();
    };
  }, [pendingReminder, alarmTone]);

  if (!pendingReminder) return null;

  const sched = pendingReminder.medication_schedule;
  const title = sched?.label || sched?.medicine_name || 'Medication Reminder';
  const detail = `${sched?.medicine_name || ''} ${sched?.dose_label ? `(${sched.dose_label})` : ''}`.trim();

  const handleGivenClick = () => {
    stopAlarmSound();
    onMarkGiven(pendingReminder);
  };

  const handleSnoozeClick = () => {
    stopAlarmSound();
    onSnooze(pendingReminder.id);
  };

  const handleMissedClick = () => {
    stopAlarmSound();
    onMarkMissed(pendingReminder.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-red-200 p-5 text-center overflow-hidden relative">
        {/* Animated Alarm Top Icon */}
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-red-100 text-red-600 flex items-center justify-center animate-bounce shadow-sm">
          <BellRing className="w-8 h-8" />
        </div>

        <div className="inline-block px-3 py-0.5 mb-1.5 rounded-full bg-red-100 text-red-800 text-[10px] font-black uppercase tracking-wider">
          Alarm Due Now
        </div>

        <h2 className="text-xl font-black text-slate-900 mb-0.5">
          {title}
        </h2>
        <p className="text-xs font-bold text-purple-700 mb-5 flex items-center justify-center gap-1">
          <Syringe className="w-3.5 h-3.5" />
          {detail || 'Scheduled medicine dose'}
        </p>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleGivenClick}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Mark as Given &amp; Log Dose
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSnoozeClick}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-1"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Snooze 10m
            </button>

            <button
              onClick={handleMissedClick}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition flex items-center justify-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5 text-slate-400" />
              Missed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
