# Personal Patient Monitoring App (Yousef)

A lightweight, high-performance home-care web application for tracking one patient's **water intake**, **urine output**, and **blood sugar / insulin**, featuring automatic daily locked totals, medicine/insulin audio & web push alarms, and downloadable Excel (.xlsx), PDF, and CSV reports.

Designed specifically for single-patient home care with zero login friction, mobile-first navigation, and dark mode support.

---

## 🌟 Key Features

1. **Pinned Daily Summary Card**:
   - Total Water Intake (ml)
   - Total Urine Output (ml)
   - Net Fluid Balance (intake − output) color-coded blue (positive) / orange (negative)
   - Average Blood Sugar (mg/dL) & reading count
   - Total Insulin given (Units)
   - Doses given vs due today
   - Date picker to flip back and inspect any previous date's locked summary.

2. **Fluid Trackers**:
   - **Water Intake**: Quick-add buttons (`+200ml Water`, `+250ml Tea`, `+150ml Juice`, `+300ml IV Fluid`) + custom input modal & live entries table.
   - **Urine Output**: Quick-add buttons (`+150ml`, `+250ml`, `+350ml`, `+500ml`) + custom input modal & live entries table.

3. **Blood Sugar & Insulin Monitor**:
   - 3-tier clinical color status:
     - 🟢 **Normal**: 70–140 mg/dL
     - 🟡 **Borderline / Warning**: < 70 or 141–180 mg/dL
     - 🔴 **High**: > 180 mg/dL
   - Log glucose reading, insulin type (Lantus, Humalog, etc.), and units given.

4. **Medicine & Insulin Schedule & Alarms**:
   - Quick presets: **"Add Morning Insulin (08:00)"** and **"Add Night Insulin (20:00)"**.
   - In-app **Web Audio API** alarm chime banner with **Mark as Given**, **Snooze 10 min**, and **Missed** actions.
   - Service Worker (`public/sw.js`) **Web Push Notifications** for background alarms (PWA supported on iOS 16.4+ when added to Home Screen).

5. **Trends & Visual Analytics**:
   - Recharts fluid intake vs. output bar chart with net balance overlay.
   - Glucose timeline chart with shaded green target range (70–140 mg/dL).

6. **Export Engine**:
   - **Excel (.xlsx)**: Single-page A4 print layout matching daily totals and logs (`exceljs`).
   - **PDF Document**: Formatted printable medical summary (`jspdf` + `jspdf-autotable`).
   - **CSV**: Raw data backup.

---

## 🚀 Technology Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS (Navy palette `#1F3864`) + Lucide Icons
- **Database**: Supabase Cloud (Postgres) with automatic recalculation triggers (`supabase/migration.sql`)
- **Dual Storage**: Built-in LocalStorage fallback when Supabase env vars are not set
- **Charts**: Recharts
- **Exporting**: ExcelJS, jsPDF, jsPDF-AutoTable
- **Alarms**: Web Audio API (Synthesizer Chime) + Web Push (`web-push`) + Vercel Cron (`vercel.json`)

---

## 💻 Local Development Setup

### 1. Clone & Install
```bash
git clone <repository-url>
cd patient-monitor
npm install
```

### 2. Run Standalone (LocalStorage Mode)
You can run the app out-of-the-box without configuring Supabase first!
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Demo seed data for Yousef will be pre-loaded into your browser's LocalStorage automatically.

---

## 🗄️ Supabase Cloud Postgres Setup

To connect to your Supabase Postgres database:

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase Dashboard.
3. Paste and run the contents of [`supabase/migration.sql`](file:///d:/projects/patient%20monitor/supabase/migration.sql).
4. (Optional) Run [`supabase/seed.sql`](file:///d:/projects/patient%20monitor/supabase/seed.sql) to populate initial sample data for Yousef.
5. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional for background Web Push notifications:
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=mailto:patient-monitor@example.com
```

---

## 🌐 Vercel Deployment

1. Push your code to GitHub / GitLab.
2. Import the repository into **Vercel**.
3. Add the environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
4. Vercel will automatically detect `vercel.json` and create the Cron job hitting `/api/cron/check-reminders` every 5 minutes to trigger alarms and push notifications!

---

## 📱 Web Push on Mobile (iOS / Android)

- **Android (Chrome)**: Click **Enable Alarms** in the header to request notification permissions.
- **iPhone / iPad (iOS 16.4+)**: Open the app in Safari, tap **Share** -> **Add to Home Screen**. Launch the app from your Home Screen (PWA mode), and click **Enable Alarms**.
