import { supabase } from './supabase';
import {
  WaterIntakeEntry,
  UrineOutputEntry,
  SugarMonitorEntry,
  DailySummary,
  MedicationSchedule,
  MedicationReminderLog
} from '@/types';

// ------------------------------------------------------------------
// Date helpers
// ------------------------------------------------------------------
export function getLocalTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getLocalYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function shiftDateString(dateStr: string, deltaDays: number): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return getLocalTodayString();
  const d = new Date(parts[0], parts[1] - 1, parts[2] + deltaDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatTo12Hr(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const minute = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour}:${minute} ${ampm}`;
}

// Helper that throws a user-visible error on Supabase failure
function assertNoError<T>(data: T | null, error: { message: string } | null, context: string): T {
  if (error) {
    console.error(`[Supabase] ${context} error:`, error.message);
    throw new Error(`${context}: ${error.message}`);
  }
  if (data === null) {
    throw new Error(`${context}: No data returned`);
  }
  return data;
}

// ------------------------------------------------------------------
// WATER INTAKE
// ------------------------------------------------------------------
export async function getWaterIntake(date?: string): Promise<WaterIntakeEntry[]> {
  let query = supabase
    .from('water_intake')
    .select('*')
    .order('entry_time', { ascending: true });
  if (date) query = query.eq('entry_date', date);
  const { data, error } = await query;
  if (error) {
    console.error('[Supabase] getWaterIntake error:', error.message);
    return [];
  }
  return (data ?? []) as WaterIntakeEntry[];
}

export async function addWaterIntake(
  entry: Omit<WaterIntakeEntry, 'id' | 'created_at'>
): Promise<WaterIntakeEntry> {
  const { data, error } = await supabase
    .from('water_intake')
    .insert([entry])
    .select()
    .single();
  return assertNoError(data, error, 'addWaterIntake') as WaterIntakeEntry;
}

export async function deleteWaterIntake(id: string): Promise<void> {
  const { error } = await supabase.from('water_intake').delete().eq('id', id);
  if (error) throw new Error(`deleteWaterIntake: ${error.message}`);
}

// ------------------------------------------------------------------
// URINE OUTPUT
// ------------------------------------------------------------------
export async function getUrineOutput(date?: string): Promise<UrineOutputEntry[]> {
  let query = supabase
    .from('urine_output')
    .select('*')
    .order('entry_time', { ascending: true });
  if (date) query = query.eq('entry_date', date);
  const { data, error } = await query;
  if (error) {
    console.error('[Supabase] getUrineOutput error:', error.message);
    return [];
  }
  return (data ?? []) as UrineOutputEntry[];
}

export async function addUrineOutput(
  entry: Omit<UrineOutputEntry, 'id' | 'created_at'>
): Promise<UrineOutputEntry> {
  const { data, error } = await supabase
    .from('urine_output')
    .insert([entry])
    .select()
    .single();
  return assertNoError(data, error, 'addUrineOutput') as UrineOutputEntry;
}

export async function deleteUrineOutput(id: string): Promise<void> {
  const { error } = await supabase.from('urine_output').delete().eq('id', id);
  if (error) throw new Error(`deleteUrineOutput: ${error.message}`);
}

// ------------------------------------------------------------------
// SUGAR MONITOR
// ------------------------------------------------------------------
export async function getSugarMonitor(date?: string): Promise<SugarMonitorEntry[]> {
  let query = supabase
    .from('sugar_monitor')
    .select('*')
    .order('entry_time', { ascending: true });
  if (date) query = query.eq('entry_date', date);
  const { data, error } = await query;
  if (error) {
    console.error('[Supabase] getSugarMonitor error:', error.message);
    return [];
  }
  return (data ?? []) as SugarMonitorEntry[];
}

export async function addSugarMonitor(
  entry: Omit<SugarMonitorEntry, 'id' | 'created_at'>
): Promise<SugarMonitorEntry> {
  const { data, error } = await supabase
    .from('sugar_monitor')
    .insert([entry])
    .select()
    .single();
  return assertNoError(data, error, 'addSugarMonitor') as SugarMonitorEntry;
}

export async function deleteSugarMonitor(id: string): Promise<void> {
  const { error } = await supabase.from('sugar_monitor').delete().eq('id', id);
  if (error) throw new Error(`deleteSugarMonitor: ${error.message}`);
}

// ------------------------------------------------------------------
// DAILY SUMMARY (computed from existing data)
// ------------------------------------------------------------------
export async function getDailySummary(date: string): Promise<DailySummary> {
  const [water, urine, sugar] = await Promise.all([
    getWaterIntake(date),
    getUrineOutput(date),
    getSugarMonitor(date),
  ]);

  const total_intake_ml = water.reduce((s, r) => s + Number(r.amount_ml || 0), 0);
  const total_output_ml = urine.reduce((s, r) => s + Number(r.volume_ml || 0), 0);
  const reading_count = sugar.length;
  const avg_blood_sugar_mgdl =
    reading_count > 0
      ? Math.round(
          (sugar.reduce((s, r) => s + Number(r.blood_sugar_mgdl || 0), 0) / reading_count) * 10
        ) / 10
      : null;
  const total_insulin_units = sugar.reduce((s, r) => s + Number(r.insulin_units || 0), 0);

  return {
    summary_date: date,
    total_intake_ml,
    total_output_ml,
    net_balance_ml: total_intake_ml - total_output_ml,
    avg_blood_sugar_mgdl,
    total_insulin_units,
    reading_count,
    updated_at: new Date().toISOString(),
  };
}

export async function getDailySummariesRange(
  startDate: string,
  endDate: string
): Promise<DailySummary[]> {
  const [sY, sM, sD] = startDate.split('-').map(Number);
  const [eY, eM, eD] = endDate.split('-').map(Number);
  const start = new Date(sY, sM - 1, sD);
  const end = new Date(eY, eM - 1, eD);
  const results: DailySummary[] = [];

  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    results.push(await getDailySummary(dateStr));
  }
  return results;
}

// ------------------------------------------------------------------
// MEDICATION SCHEDULE
// ------------------------------------------------------------------
export async function getMedicationSchedules(): Promise<MedicationSchedule[]> {
  const { data, error } = await supabase
    .from('medication_schedule')
    .select('*')
    .order('scheduled_time', { ascending: true });
  if (error) {
    console.error('[Supabase] getMedicationSchedules error:', error.message);
    return [];
  }
  return (data ?? []) as MedicationSchedule[];
}

export async function addMedicationSchedule(
  schedule: Omit<MedicationSchedule, 'id' | 'created_at'>
): Promise<MedicationSchedule> {
  const { data, error } = await supabase
    .from('medication_schedule')
    .insert([schedule])
    .select()
    .single();
  return assertNoError(data, error, 'addMedicationSchedule') as MedicationSchedule;
}

export async function updateMedicationSchedule(
  id: string,
  updates: Partial<MedicationSchedule>
): Promise<void> {
  const { error } = await supabase
    .from('medication_schedule')
    .update(updates)
    .eq('id', id);
  if (error) throw new Error(`updateMedicationSchedule: ${error.message}`);
}

export async function deleteMedicationSchedule(id: string): Promise<void> {
  const { error } = await supabase.from('medication_schedule').delete().eq('id', id);
  if (error) throw new Error(`deleteMedicationSchedule: ${error.message}`);
}

// ------------------------------------------------------------------
// MEDICATION REMINDER LOG
// ------------------------------------------------------------------
export async function getRemindersForDate(dateStr: string): Promise<MedicationReminderLog[]> {
  const { data, error } = await supabase
    .from('medication_reminder_log')
    .select('*, medication_schedule(*)')
    .gte('due_at', `${dateStr}T00:00:00`)
    .lte('due_at', `${dateStr}T23:59:59`);
  if (error) {
    console.error('[Supabase] getRemindersForDate error:', error.message);
    return [];
  }
  return (data ?? []) as MedicationReminderLog[];
}

export async function updateReminderStatus(
  id: string,
  status: 'given' | 'snoozed' | 'missed',
  linkedSugarId?: string
): Promise<void> {
  const { error } = await supabase
    .from('medication_reminder_log')
    .update({
      status,
      acknowledged_at: new Date().toISOString(),
      linked_sugar_monitor_id: linkedSugarId ?? null,
    })
    .eq('id', id);
  if (error) throw new Error(`updateReminderStatus: ${error.message}`);
}

export async function clearAllDatabaseData(): Promise<void> {
  const [w, u, s, m, r] = await Promise.all([
    supabase.from('water_intake').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('urine_output').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('sugar_monitor').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('medication_schedule').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('medication_reminder_log').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
  ]);

  if (w.error) throw new Error(`Clear Water Intake: ${w.error.message}`);
  if (u.error) throw new Error(`Clear Urine Output: ${u.error.message}`);
  if (s.error) throw new Error(`Clear Sugar Monitor: ${s.error.message}`);
  if (m.error) throw new Error(`Clear Medication Schedule: ${m.error.message}`);
  if (r.error) throw new Error(`Clear Reminder Log: ${r.error.message}`);
}
