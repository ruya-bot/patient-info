import ExcelJS from 'exceljs';
import { DailySummary, WaterIntakeEntry, UrineOutputEntry, SugarMonitorEntry } from '@/types';
import { formatTo12Hr } from './storage';

export async function exportToExcel(
  patientName: string,
  selectedDate: string,
  summary: DailySummary | null,
  waterList: WaterIntakeEntry[] = [],
  urineList: UrineOutputEntry[] = [],
  sugarList: SugarMonitorEntry[] = []
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Patient Monitoring System';
  workbook.created = new Date();

  const safeWater = Array.isArray(waterList) ? waterList : [];
  const safeUrine = Array.isArray(urineList) ? urineList : [];
  const safeSugar = Array.isArray(sugarList) ? sugarList : [];

  const totalIntake = summary?.total_intake_ml ?? safeWater.reduce((acc, curr) => acc + Number(curr.amount_ml || 0), 0);
  const totalOutput = summary?.total_output_ml ?? safeUrine.reduce((acc, curr) => acc + Number(curr.volume_ml || 0), 0);
  const netBalance = totalIntake - totalOutput;

  // Sheet 1: Daily Summary & Detail Report
  const sheet = workbook.addWorksheet(`Daily Report (${selectedDate})`, {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1 }
  });

  // Title Block (Premium Slate Dark Blue)
  sheet.mergeCells('A1:F1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `PATIENT HEALTH REPORT - ${(patientName || 'Yousef').toUpperCase()}`;
  titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } }; // slate-900
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 38;

  sheet.mergeCells('A2:F2');
  const subCell = sheet.getCell('A2');
  subCell.value = `Report Date: ${selectedDate} | Exported: ${new Date().toLocaleString()}`;
  subCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: '64748B' } }; // slate-500
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 20;

  sheet.addRow([]);

  // Section 1: Daily Summary Table (Premium Light Purple Accent)
  sheet.mergeCells('A4:F4');
  const summaryHeader = sheet.getCell('A4');
  summaryHeader.value = '1. DAILY LOCKED SUMMARY';
  summaryHeader.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: '1E1B4B' } }; // dark navy/purple
  summaryHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3E8FF' } }; // purple-100
  sheet.getRow(4).height = 24;

  const summaryRowHeaders = ['Total Water Intake', 'Total Urine Output', 'Net Fluid Balance', 'Avg Blood Sugar', 'Total Insulin Given', 'Readings Count'];
  const summaryValues = [
    `${totalIntake} ml`,
    `${totalOutput} ml`,
    `${netBalance} ml`,
    summary?.avg_blood_sugar_mgdl ? `${summary.avg_blood_sugar_mgdl} mg/dL` : 'N/A',
    `${summary?.total_insulin_units ?? 0} U`,
    `${safeSugar.length} entries`
  ];

  sheet.addRow(summaryRowHeaders);
  sheet.addRow(summaryValues);

  sheet.getRow(5).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '475569' } }; // slate-600
  sheet.getRow(5).alignment = { horizontal: 'center' };
  sheet.getRow(6).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: '0F172A' } }; // slate-900
  sheet.getRow(6).alignment = { horizontal: 'center' };

  sheet.addRow([]);

  // Section 2: Water Intake Log
  const waterStartRow = sheet.rowCount + 1;
  sheet.mergeCells(`A${waterStartRow}:F${waterStartRow}`);
  const waterHeader = sheet.getCell(`A${waterStartRow}`);
  waterHeader.value = '2. WATER & FLUIDS INTAKE LOG';
  waterHeader.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: '0F172A' } };
  waterHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } }; // slate-200

  sheet.addRow(['Time', 'Liquid Type', 'Amount (ml)', 'Notes', '', '']);
  sheet.getRow(waterStartRow + 1).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '1E293B' } };

  if (safeWater.length === 0) {
    sheet.addRow(['No water intake entries for this date', '', '', '', '', '']);
  } else {
    safeWater.forEach(w => {
      sheet.addRow([formatTo12Hr(w.entry_time), w.liquid_type, w.amount_ml, w.notes || '', '', '']);
    });
  }

  sheet.addRow([]);

  // Section 3: Urine Output Log (No Notes column)
  const urineStartRow = sheet.rowCount + 1;
  sheet.mergeCells(`A${urineStartRow}:F${urineStartRow}`);
  const urineHeader = sheet.getCell(`A${urineStartRow}`);
  urineHeader.value = '3. URINE OUTPUT LOG';
  urineHeader.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: '0F172A' } };
  urineHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };

  sheet.addRow(['Time', 'Volume (ml)', '', '', '', '']);
  sheet.getRow(urineStartRow + 1).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '1E293B' } };

  if (safeUrine.length === 0) {
    sheet.addRow(['No urine output entries for this date', '', '', '', '', '']);
  } else {
    safeUrine.forEach(u => {
      sheet.addRow([formatTo12Hr(u.entry_time), u.volume_ml, '', '', '', '']);
    });
  }

  sheet.addRow([]);

  // Section 4: Sugar & Insulin Monitor Log (No Notes column)
  const sugarStartRow = sheet.rowCount + 1;
  sheet.mergeCells(`A${sugarStartRow}:F${sugarStartRow}`);
  const sugarHeader = sheet.getCell(`A${sugarStartRow}`);
  sugarHeader.value = '4. BLOOD SUGAR & INSULIN MONITOR';
  sugarHeader.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: '0F172A' } };
  sugarHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };

  sheet.addRow(['Time', 'Blood Sugar (mg/dL)', 'Status', 'Insulin Type', 'Insulin (Units)', '']);
  sheet.getRow(sugarStartRow + 1).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '1E293B' } };

  if (safeSugar.length === 0) {
    sheet.addRow(['No glucose/insulin entries for this date', '', '', '', '', '']);
  } else {
    safeSugar.forEach(s => {
      const glucoseVal = s.blood_sugar_mgdl;
      const status = glucoseVal >= 70 && glucoseVal <= 140
        ? 'Normal'
        : (glucoseVal < 70 ? 'Low' : 'High');
      sheet.addRow([
        formatTo12Hr(s.entry_time),
        glucoseVal,
        status,
        s.insulin_type || '-',
        s.insulin_units ? `${s.insulin_units} U` : '-',
        ''
      ]);
    });
  }

  // Adjust column widths
  sheet.columns = [
    { width: 18 },
    { width: 22 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 }
  ];

  // Generate and Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `patient_monitoring_${selectedDate}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
