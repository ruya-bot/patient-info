import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import webpush from 'web-push';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:patient-monitor@example.com';

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
  } catch (e) {
    console.warn('VAPID setup warning:', e);
  }
}

export async function GET() {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({ message: 'Supabase not configured, skipping cron check' });
    }

    const now = new Date();
    const currentTimeStr = now.toTimeString().slice(0, 5); // HH:MM
    const currentDayOfWeek = now.getDay(); // 0=Sun..6=Sat

    // Fetch active schedules matching current time
    const { data: schedules, error } = await supabase
      .from('medication_schedule')
      .select('*')
      .eq('active', true);

    if (error || !schedules) {
      return NextResponse.json({ error: error?.message || 'Failed to query schedules' }, { status: 500 });
    }

    const dueSchedules = schedules.filter(s => {
      const schedTime = s.scheduled_time.slice(0, 5);
      if (schedTime !== currentTimeStr) return false;

      if (s.recurrence === 'daily' || s.recurrence === 'once') return true;
      if (s.recurrence === 'specific_days' && s.days_of_week && Array.isArray(s.days_of_week)) {
        return s.days_of_week.includes(currentDayOfWeek);
      }
      return false;
    });

    let insertedCount = 0;

    for (const sched of dueSchedules) {
      // Check if already created today
      const todayDateStr = now.toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('medication_reminder_log')
        .select('id')
        .eq('schedule_id', sched.id)
        .gte('due_at', `${todayDateStr}T${sched.scheduled_time}`);

      if (!existing || existing.length === 0) {
        const { error: insertErr } = await supabase
          .from('medication_reminder_log')
          .insert({
            schedule_id: sched.id,
            due_at: now.toISOString(),
            status: 'pending'
          });

        if (!insertErr) {
          insertedCount++;

          // Send Web Push notification if VAPID keys exist
          if (vapidPublicKey && vapidPrivateKey) {
            const { data: subs } = await supabase.from('push_subscription').select('*');
            if (subs && subs.length > 0) {
              const payload = JSON.stringify({
                title: `${sched.label || sched.medicine_name} Due`,
                body: `${sched.medicine_name} ${sched.dose_label ? `(${sched.dose_label})` : ''} scheduled for ${sched.scheduled_time.slice(0, 5)}.`
              });

              for (const sub of subs) {
                try {
                  await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth }
                  }, payload);
                } catch (pushErr) {
                  console.error('Push notification failed for endpoint:', sub.endpoint, pushErr);
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      time: currentTimeStr,
      dueCount: dueSchedules.length,
      insertedCount
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
