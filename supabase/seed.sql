-- Seed data for Patient Yousef

-- 1. Medication Schedules (Morning & Night Insulin)
insert into medication_schedule (medicine_name, dose_label, category, scheduled_time, label, recurrence, active)
values
  ('Insulin (Lantus)', '10 units', 'insulin', '08:00:00', 'Morning Insulin', 'daily', true),
  ('Insulin (Humalog)', '6 units', 'insulin', '12:30:00', 'Lunch Insulin', 'daily', true),
  ('Insulin (Lantus)', '12 units', 'insulin', '20:00:00', 'Night Insulin', 'daily', true),
  ('Metformin', '500 mg', 'oral', '08:30:00', 'Morning Metformin', 'daily', true);

-- 2. Water Intake Sample Data (Today & Yesterday)
insert into water_intake (entry_date, entry_time, liquid_type, amount_ml, notes)
values
  (current_date, '07:30:00', 'Water', 250, 'Morning glass of water'),
  (current_date, '09:00:00', 'Tea', 200, 'Green tea without sugar'),
  (current_date, '11:15:00', 'Water', 300, 'Hydration after walk'),
  (current_date, '13:00:00', 'Soup', 250, 'Chicken broth with lunch'),
  (current_date, '16:30:00', 'Water', 250, 'Afternoon intake'),
  (current_date - interval '1 day', '08:00:00', 'Water', 300, 'Yesterday morning'),
  (current_date - interval '1 day', '12:00:00', 'Juice', 200, 'Fresh orange juice'),
  (current_date - interval '1 day', '18:00:00', 'Water', 400, 'Yesterday evening');

-- 3. Urine Output Sample Data
insert into urine_output (entry_date, entry_time, volume_ml, notes)
values
  (current_date, '07:15:00', 300, 'First void morning'),
  (current_date, '10:30:00', 250, 'Clear'),
  (current_date, '14:00:00', 200, 'Normal'),
  (current_date, '17:45:00', 300, 'Clear yellow'),
  (current_date - interval '1 day', '07:30:00', 350, 'Yesterday morning'),
  (current_date - interval '1 day', '13:15:00', 300, 'Normal void');

-- 4. Sugar & Insulin Monitor Sample Data
insert into sugar_monitor (entry_date, entry_time, blood_sugar_mgdl, insulin_type, insulin_units, notes)
values
  (current_date, '07:45:00', 112, 'Lantus', 10, 'Fasting glucose normal'),
  (current_date, '12:45:00', 135, 'Humalog', 6, 'Post-breakfast check'),
  (current_date, '17:00:00', 98, null, null, 'Pre-dinner measurement'),
  (current_date - interval '1 day', '08:00:00', 125, 'Lantus', 10, 'Yesterday morning fasting'),
  (current_date - interval '1 day', '20:15:00', 158, 'Lantus', 12, 'Elevated after dinner');
