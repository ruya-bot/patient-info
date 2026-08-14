export interface WaterIntakeEntry {
  id: string;
  entry_date: string; // YYYY-MM-DD
  entry_time: string; // HH:MM or HH:MM:SS
  liquid_type: string;
  amount_ml: number;
  notes?: string | null;
  created_at?: string;
}

export interface UrineOutputEntry {
  id: string;
  entry_date: string; // YYYY-MM-DD
  entry_time: string; // HH:MM or HH:MM:SS
  volume_ml: number;
  notes?: string | null;
  created_at?: string;
}

export interface SugarMonitorEntry {
  id: string;
  entry_date: string; // YYYY-MM-DD
  entry_time: string; // HH:MM or HH:MM:SS
  blood_sugar_mgdl: number;
  insulin_type?: string | null;
  insulin_units?: number | null;
  notes?: string | null;
  created_at?: string;
}

export interface DailySummary {
  id?: string;
  summary_date: string; // YYYY-MM-DD
  total_intake_ml: number;
  total_output_ml: number;
  net_balance_ml: number;
  avg_blood_sugar_mgdl: number | null;
  total_insulin_units: number;
  reading_count: number;
  updated_at?: string;
}

export type MedicationCategory = 'insulin' | 'oral' | 'iv' | 'other';
export type MedicationRecurrence = 'daily' | 'specific_days' | 'once';

export interface MedicationSchedule {
  id: string;
  medicine_name: string;
  dose_label?: string | null;
  category: MedicationCategory;
  scheduled_time: string; // HH:MM:SS or HH:MM
  label?: string | null;
  recurrence: MedicationRecurrence;
  days_of_week?: number[] | null; // 0=Sun .. 6=Sat
  active: boolean;
  created_at?: string;
}

export type ReminderStatus = 'pending' | 'given' | 'snoozed' | 'missed';

export interface MedicationReminderLog {
  id: string;
  schedule_id: string;
  due_at: string;
  status: ReminderStatus;
  acknowledged_at?: string | null;
  linked_sugar_monitor_id?: string | null;
  created_at?: string;
  medication_schedule?: MedicationSchedule;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface GlucoseStatus {
  status: 'normal' | 'warning' | 'danger';
  label: string;
  colorClass: string;
  bgClass: string;
  badgeClass: string;
  dotColor: string;
}

export function getGlucoseStatus(mgdl: number): GlucoseStatus {
  if (mgdl >= 70 && mgdl <= 140) {
    return {
      status: 'normal',
      label: 'Normal (70-140)',
      colorClass: 'text-emerald-700 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
      dotColor: 'bg-emerald-500'
    };
  } else if ((mgdl >= 60 && mgdl < 70) || (mgdl > 140 && mgdl <= 180)) {
    return {
      status: 'warning',
      label: mgdl < 70 ? 'Slightly Low (<70)' : 'Elevated (141-180)',
      colorClass: 'text-amber-700 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
      dotColor: 'bg-amber-500'
    };
  } else {
    return {
      status: 'danger',
      label: mgdl < 60 ? 'Low (<60)' : 'High (>180)',
      colorClass: 'text-red-700 dark:text-red-400',
      bgClass: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800',
      badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300',
      dotColor: 'bg-red-500'
    };
  }
}
