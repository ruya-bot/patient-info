'use client';

import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Trash2, Play, Square } from 'lucide-react';
import { playAlarmSound, stopAlarmSound } from '@/lib/audio';

interface SettingsProps {
  patientName: string;
  onUpdatePatientName: (name: string) => void;
  alarmTone: string;
  onUpdateAlarmTone: (tone: string) => void;
  onClearAllData: () => Promise<void>;
}

const TONES = [
  { value: 'chime', label: '🔔 Gentle Chime' },
  { value: 'beep', label: '⏰ Digital Beep' },
  { value: 'pulse', label: '💓 Heartbeat Pulse' },
  { value: 'medical', label: '🚨 Medical Alert' },
];

export const Settings: React.FC<SettingsProps> = ({
  patientName,
  onUpdatePatientName,
  alarmTone,
  onUpdateAlarmTone,
  onClearAllData
}) => {
  const [name, setName] = useState(patientName);
  const [selectedTone, setSelectedTone] = useState(alarmTone);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveDetails = () => {
    onUpdatePatientName(name);
    onUpdateAlarmTone(selectedTone);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestSound = () => {
    if (isPlaying) {
      stopAlarmSound();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playAlarmSound(selectedTone);
      // Automatically stop after 4 seconds
      setTimeout(() => {
        stopAlarmSound();
        setIsPlaying(false);
      }, 4000);
    }
  };

  const handleResetData = async () => {
    const confirm = window.confirm(
      "WARNING: Are you sure you want to permanently delete all logged fluid intake, urine output, blood sugar/insulin entries, and medication schedules?\n\nThis will clear the database completely and cannot be undone."
    );
    if (!confirm) return;

    setIsClearing(true);
    try {
      await onClearAllData();
      alert("All local and cloud database records have been successfully deleted.");
    } catch (err: any) {
      alert(`Error clearing data: ${err.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Basic Settings Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 sm:p-6 transition-all hover:shadow-md">
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">System Settings</h3>
            <p className="text-xs text-slate-500 font-semibold">Configure patient details & alarm preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Patient Name */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Patient Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-xs font-bold p-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              placeholder="Yousef"
            />
          </div>

          {/* Alarm Tone Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Alarm Tone</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {TONES.map(t => {
                  const isSelected = selectedTone === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setSelectedTone(t.value);
                        stopAlarmSound();
                        setIsPlaying(false);
                      }}
                      className={`flex items-center justify-center px-4 py-3 rounded-2xl text-xs font-bold border transition-all duration-150 shrink-0 select-none active:scale-95
                        ${isSelected 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleTestSound}
                className={`py-3 px-5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 shrink-0 border
                  ${isPlaying 
                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
              >
                {isPlaying ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-red-600 text-red-600" />
                    Stop Test
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-slate-700 text-slate-700" />
                    Test Sound
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
            <span className={`text-xs font-bold text-emerald-600 transition-opacity duration-200 ${saveSuccess ? 'opacity-100' : 'opacity-0'}`}>
              Settings saved successfully!
            </span>
            <button
              onClick={handleSaveDetails}
              className="py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-all duration-150 active:scale-95 shadow-sm flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              Save Configuration
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone / Reset Card */}
      <div className="bg-red-50/50 rounded-3xl border border-red-200 p-5 sm:p-6 transition-all">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-red-100 text-red-600 border border-red-200 shadow-sm">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-red-900 tracking-tight">Danger Zone</h3>
            <p className="text-xs text-red-500 font-semibold font-sans">Destructive operations that cannot be undone</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-red-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-0.5">
            <h4 className="text-sm font-extrabold text-slate-900">Reset & Delete All Data</h4>
            <p className="text-[11px] text-slate-500 font-semibold max-w-md">
              Permanently wipe all water intake logs, urine outputs, blood sugar checks, insulin logs, and alarm reminder schedules from Supabase.
            </p>
          </div>

          <button
            onClick={handleResetData}
            disabled={isClearing}
            className="py-3 px-5 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs transition shadow-sm shrink-0 flex items-center gap-1.5"
          >
            {isClearing ? 'Clearing…' : 'Reset Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
};
