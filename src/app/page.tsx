'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  WaterIntakeEntry,
  UrineOutputEntry,
  SugarMonitorEntry,
  DailySummary,
  MedicationSchedule,
  MedicationReminderLog
} from '@/types';

import {
  getWaterIntake,
  addWaterIntake,
  deleteWaterIntake,
  getUrineOutput,
  addUrineOutput,
  deleteUrineOutput,
  getSugarMonitor,
  addSugarMonitor,
  deleteSugarMonitor,
  getDailySummary,
  getDailySummariesRange,
  getMedicationSchedules,
  addMedicationSchedule,
  updateMedicationSchedule,
  deleteMedicationSchedule,
  getRemindersForDate,
  updateReminderStatus,
  getLocalTodayString
} from '@/lib/storage';

import { Header } from '@/components/Header';
import { WaterTracker } from '@/components/WaterTracker';
import { UrineTracker } from '@/components/UrineTracker';
import { SugarTracker } from '@/components/SugarTracker';
import { ScheduleTracker } from '@/components/ScheduleTracker';
import { AlarmModal } from '@/components/AlarmModal';
import { TrendsChart } from '@/components/TrendsChart';
import { ExportReport } from '@/components/ExportReport';
import { AlertTriangle, X, HeartPulse } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<string>(getLocalTodayString());
  const [pushSubscribed, setPushSubscribed] = useState<boolean>(false);

  const [waterList, setWaterList] = useState<WaterIntakeEntry[]>([]);
  const [urineList, setUrineList] = useState<UrineOutputEntry[]>([]);
  const [sugarList, setSugarList] = useState<SugarMonitorEntry[]>([]);
  const [summary, setSummary] = useState<DailySummary>({
    summary_date: getLocalTodayString(),
    total_intake_ml: 0,
    total_output_ml: 0,
    net_balance_ml: 0,
    avg_blood_sugar_mgdl: null,
    total_insulin_units: 0,
    reading_count: 0
  });
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [historicalSummaries, setHistoricalSummaries] = useState<DailySummary[]>([]);
  const [reminders, setReminders] = useState<MedicationReminderLog[]>([]);
  const [pendingAlarm, setPendingAlarm] = useState<MedicationReminderLog | null>(null);
  const [prefilledInsulin, setPrefilledInsulin] = useState<{ type: string; units: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trends' | 'schedules' | 'export'>('dashboard');

  // Intro animation states
  const [renderIntro, setRenderIntro] = useState<boolean>(true);
  const [introFadeOut, setIntroFadeOut] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasShown = sessionStorage.getItem('patient_monitor_intro_shown');
      if (hasShown) {
        setRenderIntro(false);
        return;
      }
    }
    const fadeTimer = setTimeout(() => {
      setIntroFadeOut(true);
    }, 2000);
    const removeTimer = setTimeout(() => {
      setRenderIntro(false);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('patient_monitor_intro_shown', 'true');
      }
    }, 2500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Error toast state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 6000);
  };

  // Recalculate summary from current lists
  const recalculateSummary = useCallback((
    wList: WaterIntakeEntry[],
    uList: UrineOutputEntry[],
    sList: SugarMonitorEntry[]
  ) => {
    const total_intake_ml = wList.reduce((s, r) => s + Number(r.amount_ml || 0), 0);
    const total_output_ml = uList.reduce((s, r) => s + Number(r.volume_ml || 0), 0);
    const reading_count = sList.length;
    const avg_blood_sugar_mgdl = reading_count > 0
      ? Math.round(sList.reduce((s, r) => s + Number(r.blood_sugar_mgdl || 0), 0) / reading_count * 10) / 10
      : null;
    const total_insulin_units = sList.reduce((s, r) => s + Number(r.insulin_units || 0), 0);
    setSummary(prev => ({
      ...prev,
      total_intake_ml,
      total_output_ml,
      net_balance_ml: total_intake_ml - total_output_ml,
      avg_blood_sugar_mgdl,
      total_insulin_units,
      reading_count,
    }));
  }, []);

  const loadDataForDate = useCallback(async (dateStr: string) => {
    const [wData, uData, sData, sumData, schedData, remData] = await Promise.all([
      getWaterIntake(dateStr),
      getUrineOutput(dateStr),
      getSugarMonitor(dateStr),
      getDailySummary(dateStr),
      getMedicationSchedules(),
      getRemindersForDate(dateStr)
    ]);
    setWaterList(wData);
    setUrineList(uData);
    setSugarList(sData);
    setSummary(sumData);
    setSchedules(schedData);
    setReminders(remData);
  }, []);

  const loadHistoricalData = useCallback(async () => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 30);
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const range = await getDailySummariesRange(fmt(start), fmt(today));
    setHistoricalSummaries(range);
  }, []);

  useEffect(() => {
    loadDataForDate(selectedDate);
  }, [selectedDate, loadDataForDate]);

  useEffect(() => {
    if (activeTab === 'trends') loadHistoricalData();
  }, [activeTab, loadHistoricalData]);

  // Alarm polling every 15s
  useEffect(() => {
    const checkAlarm = async () => {
      const today = getLocalTodayString();
      const scheds = await getMedicationSchedules();
      const currentReminders = await getRemindersForDate(today);
      const now = new Date();
      const currentTimeStr = now.toTimeString().slice(0, 5);

      for (const s of scheds) {
        if (!s.active) continue;
        if (s.scheduled_time.slice(0, 5) === currentTimeStr) {
          const existing = currentReminders.find(r => r.schedule_id === s.id && r.status !== 'snoozed');
          if (!existing) {
            setPendingAlarm({ id: 'rem-' + Date.now(), schedule_id: s.id, due_at: now.toISOString(), status: 'pending', medication_schedule: s });
            break;
          }
        }
      }
    };
    checkAlarm();
    const interval = setInterval(checkAlarm, 15000);
    return () => clearInterval(interval);
  }, [pendingAlarm]);

  // Web Push
  const handleRequestPushPermission = async () => {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
      setPushSubscribed(true);
    } catch (e) {
      console.error('Push setup failed:', e);
    }
  };

  // ----------------------------------------------------------------
  // WATER — optimistic add with rollback on failure
  // ----------------------------------------------------------------
  const handleAddWater = async (entry: Omit<WaterIntakeEntry, 'id' | 'created_at'>) => {
    const tempId = 'temp-' + Date.now();
    const tempEntry: WaterIntakeEntry = { ...entry, id: tempId, created_at: new Date().toISOString() };
    const optimistic = [...waterList, tempEntry].sort((a, b) => a.entry_time.localeCompare(b.entry_time));
    setWaterList(optimistic);
    recalculateSummary(optimistic, urineList, sugarList);

    try {
      const saved = await addWaterIntake(entry);
      // Replace temp entry with real one from Supabase (has real UUID)
      setWaterList(prev => prev.map(r => r.id === tempId ? saved : r));
    } catch (e: unknown) {
      // Rollback
      setWaterList(prev => prev.filter(r => r.id !== tempId));
      recalculateSummary(waterList, urineList, sugarList);
      showError(`Failed to save water entry: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const handleDeleteWater = async (id: string) => {
    const snapshot = waterList;
    const updated = waterList.filter(r => r.id !== id);
    setWaterList(updated);
    recalculateSummary(updated, urineList, sugarList);
    try {
      await deleteWaterIntake(id);
    } catch (e: unknown) {
      setWaterList(snapshot);
      recalculateSummary(snapshot, urineList, sugarList);
      showError(`Failed to delete: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  // ----------------------------------------------------------------
  // URINE — optimistic add with rollback
  // ----------------------------------------------------------------
  const handleAddUrine = async (entry: Omit<UrineOutputEntry, 'id' | 'created_at'>) => {
    const tempId = 'temp-' + Date.now();
    const tempEntry: UrineOutputEntry = { ...entry, id: tempId, created_at: new Date().toISOString() };
    const optimistic = [...urineList, tempEntry].sort((a, b) => a.entry_time.localeCompare(b.entry_time));
    setUrineList(optimistic);
    recalculateSummary(waterList, optimistic, sugarList);

    try {
      const saved = await addUrineOutput(entry);
      setUrineList(prev => prev.map(r => r.id === tempId ? saved : r));
    } catch (e: unknown) {
      setUrineList(prev => prev.filter(r => r.id !== tempId));
      recalculateSummary(waterList, urineList, sugarList);
      showError(`Failed to save urine entry: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const handleDeleteUrine = async (id: string) => {
    const snapshot = urineList;
    const updated = urineList.filter(r => r.id !== id);
    setUrineList(updated);
    recalculateSummary(waterList, updated, sugarList);
    try {
      await deleteUrineOutput(id);
    } catch (e: unknown) {
      setUrineList(snapshot);
      recalculateSummary(waterList, snapshot, sugarList);
      showError(`Failed to delete: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  // ----------------------------------------------------------------
  // SUGAR — optimistic add with rollback
  // ----------------------------------------------------------------
  const handleAddSugar = async (entry: Omit<SugarMonitorEntry, 'id' | 'created_at'>) => {
    const tempId = 'temp-' + Date.now();
    const tempEntry: SugarMonitorEntry = { ...entry, id: tempId, created_at: new Date().toISOString() };
    const optimistic = [...sugarList, tempEntry].sort((a, b) => a.entry_time.localeCompare(b.entry_time));
    setSugarList(optimistic);
    recalculateSummary(waterList, urineList, optimistic);

    try {
      const saved = await addSugarMonitor(entry);
      setSugarList(prev => prev.map(r => r.id === tempId ? saved : r));
    } catch (e: unknown) {
      setSugarList(prev => prev.filter(r => r.id !== tempId));
      recalculateSummary(waterList, urineList, sugarList);
      showError(`Failed to save glucose entry: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const handleDeleteSugar = async (id: string) => {
    const snapshot = sugarList;
    const updated = sugarList.filter(r => r.id !== id);
    setSugarList(updated);
    recalculateSummary(waterList, urineList, updated);
    try {
      await deleteSugarMonitor(id);
    } catch (e: unknown) {
      setSugarList(snapshot);
      recalculateSummary(waterList, urineList, snapshot);
      showError(`Failed to delete: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  // ----------------------------------------------------------------
  // SCHEDULES
  // ----------------------------------------------------------------
  const handleAddSchedule = async (sched: Omit<MedicationSchedule, 'id' | 'created_at'>) => {
    try {
      const created = await addMedicationSchedule(sched);
      setSchedules(prev => [...prev, created]);
    } catch (e: unknown) {
      showError(`Failed to add schedule: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const handleUpdateSchedule = async (id: string, updates: Partial<MedicationSchedule>) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    try {
      await updateMedicationSchedule(id, updates);
    } catch (e: unknown) {
      showError(`Failed to update schedule: ${e instanceof Error ? e.message : 'Unknown error'}`);
      loadDataForDate(selectedDate);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    try {
      await deleteMedicationSchedule(id);
    } catch (e: unknown) {
      showError(`Failed to delete schedule: ${e instanceof Error ? e.message : 'Unknown error'}`);
      loadDataForDate(selectedDate);
    }
  };

  // ----------------------------------------------------------------
  // ALARM ACTIONS
  // ----------------------------------------------------------------
  const handleAlarmMarkGiven = async (reminder: MedicationReminderLog) => {
    setPendingAlarm(null);
    try {
      await updateReminderStatus(reminder.id, 'given');
    } catch {/* non-critical */ }
    const sched = reminder.medication_schedule;
    if (sched?.category === 'insulin') {
      setPrefilledInsulin({ type: sched.medicine_name, units: parseInt(sched.dose_label || '0') || 0 });
    }
  };

  const handleAlarmSnooze = async (reminderId: string) => {
    setPendingAlarm(null);
    try { await updateReminderStatus(reminderId, 'snoozed'); } catch {/* non-critical */ }
  };

  const handleAlarmMarkMissed = async (reminderId: string) => {
    setPendingAlarm(null);
    try { await updateReminderStatus(reminderId, 'missed'); } catch {/* non-critical */ }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-slate-900 flex flex-col font-sans antialiased">

      {/* Supabase misconfiguration banner */}
      {!isSupabaseConfigured && (
        <div className="bg-red-600 text-white text-xs font-bold px-4 py-3 flex items-center gap-2 justify-center">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Supabase is not configured — check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local and restart the dev server.
        </div>
      )}

      {/* Error toast */}
      {errorMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 max-w-sm w-full mx-4">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <Header
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onRequestPush={handleRequestPushPermission}
        pushSubscribed={pushSubscribed}
      />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5 space-y-4 pb-safe">
        {/* Desktop tab bar — hidden on mobile (we use bottom nav instead) */}
        <div className="hidden sm:flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-2xl shadow-sm">
          {(['dashboard', 'trends', 'schedules', 'export'] as const).map((tab, i) => {
            const labels = ['📋 Track', '📈 Trends', '⏰ Alarms', '📥 Report'];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {labels[i]}
              </button>
            );
          })}
        </div>

        <div key={activeTab} className="anim-fade-up">
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              <WaterTracker entries={waterList} selectedDate={selectedDate} onAddEntry={handleAddWater} onDeleteEntry={handleDeleteWater} />
              <UrineTracker entries={urineList} selectedDate={selectedDate} onAddEntry={handleAddUrine} onDeleteEntry={handleDeleteUrine} />
              <SugarTracker entries={sugarList} selectedDate={selectedDate} onAddEntry={handleAddSugar} onDeleteEntry={handleDeleteSugar} prefilledInsulin={prefilledInsulin} onClearPrefilled={() => setPrefilledInsulin(null)} />
            </div>
          )}
          {activeTab === 'trends' && <TrendsChart summaries={historicalSummaries} />}
          {activeTab === 'schedules' && (
            <ScheduleTracker schedules={schedules} onAddSchedule={handleAddSchedule} onUpdateSchedule={handleUpdateSchedule} onDeleteSchedule={handleDeleteSchedule} />
          )}
          {activeTab === 'export' && (
            <ExportReport patientName="Yousef" selectedDate={selectedDate} summary={summary} waterList={waterList} urineList={urineList} sugarList={sugarList} />
          )}
        </div>
      </main>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="bottom-nav sm:hidden">
        <div className="flex items-stretch">
          {([
            { tab: 'dashboard', icon: '💧', label: 'Track' },
            { tab: 'trends',    icon: '📈', label: 'Trends' },
            { tab: 'schedules', icon: '⏰', label: 'Alarms' },
            { tab: 'export',    icon: '📄', label: 'Report' },
          ] as const).map(({ tab, icon, label }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all duration-200 active:scale-95 ${
                activeTab === tab ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              <span className={`text-xl leading-none transition-transform duration-200 ${activeTab === tab ? 'scale-110' : 'scale-100'}`}>{icon}</span>
              <span className={`text-[10px] font-extrabold uppercase tracking-wide transition-all duration-200 ${activeTab === tab ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
              {activeTab === tab && <span className="w-4 h-0.5 rounded-full bg-slate-900 mt-0.5" />}
            </button>
          ))}
        </div>
      </nav>

      <AlarmModal pendingReminder={pendingAlarm} onMarkGiven={handleAlarmMarkGiven} onSnooze={handleAlarmSnooze} onMarkMissed={handleAlarmMarkMissed} />

      {/* ── Premium Intro Screen ── */}
      {renderIntro && (
        <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white transition-opacity duration-500 ease-out ${
          introFadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}>
          <div className="flex flex-col items-center max-w-xs text-center space-y-6">
            {/* Heart logo */}
            <div className="intro-glow w-20 h-20 rounded-[28px] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <HeartPulse className="w-10 h-10 text-white" />
            </div>
            
            {/* Text details */}
            <div className="space-y-1">
              <h2 className="intro-title text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                Patient Monitor
              </h2>
              <p className="intro-subtitle text-xs text-slate-400 font-bold uppercase tracking-wider">
                Yousef Care Dashboard
              </p>
            </div>

            {/* Premium Loader Bar */}
            <div className="w-36 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="intro-progress h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
