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

  const dayInsulinEntries = safeSugar.filter(s => s.insulin_units && s.insulin_units > 0);
  const singleDayInsulinDetails = dayInsulinEntries.length > 0
    ? dayInsulinEntries.map(s => `${s.insulin_type || 'Insulin'}: ${s.insulin_units} U`).join(', ')
    : '0 U';

  const summaryRowHeaders = ['Total Water Intake', 'Total Urine Output', 'Net Fluid Balance', 'Avg Blood Sugar', 'Total Insulin Given', 'Readings Count'];
  const summaryValues = [
    `${totalIntake} ml`,
    `${totalOutput} ml`,
    `${netBalance} ml`,
    summary?.avg_blood_sugar_mgdl ? `${summary.avg_blood_sugar_mgdl} mg/dL` : 'N/A',
    singleDayInsulinDetails,
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

  sheet.addRow([]);

  // Section 5: Insulin Administration Log (Premium Purple Header)
  const insulinStartRow = sheet.rowCount + 1;
  sheet.mergeCells(`A${insulinStartRow}:F${insulinStartRow}`);
  const insulinHeader = sheet.getCell(`A${insulinStartRow}`);
  insulinHeader.value = '5. INSULIN ADMINISTRATION LOG';
  insulinHeader.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: '581C87' } }; // Purple-900
  insulinHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3E8FF' } }; // Purple-100

  sheet.addRow(['Time', 'Insulin Type', 'Dose (Units)', 'Blood Sugar', '', '']);
  sheet.getRow(insulinStartRow + 1).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '581C87' } };

  const dayInsulinOnly = safeSugar.filter(s => s.insulin_units && s.insulin_units > 0);
  if (dayInsulinOnly.length === 0) {
    sheet.addRow(['No insulin injections logged for this date', '', '', '', '', '']);
  } else {
    dayInsulinOnly.forEach(s => {
      sheet.addRow([
        formatTo12Hr(s.entry_time),
        s.insulin_type || 'Insulin',
        `${s.insulin_units} U`,
        s.blood_sugar_mgdl ? `${s.blood_sugar_mgdl} mg/dL` : '-',
        '',
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

export async function exportMultiDayExcel(
  patientName: string,
  startDate: string,
  endDate: string,
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

  // Generate date list in range
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateStrings: string[] = [];
  const curr = new Date(start);
  while (curr <= end) {
    dateStrings.push(curr.toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + 1);
  }

  // 1. Tab 1: Range Summary Table
  const summarySheet = workbook.addWorksheet('Multi-Day Summary');

  // Title Block
  summarySheet.mergeCells('A1:G1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = `PATIENT MULTI-DAY SUMMARY REPORT - ${(patientName || 'Yousef').toUpperCase()}`;
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 36;

  summarySheet.mergeCells('A2:G2');
  const subCell = summarySheet.getCell('A2');
  subCell.value = `Period: ${startDate} to ${endDate} (${dateStrings.length} days) | Exported: ${new Date().toLocaleString()}`;
  subCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: '64748B' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(2).height = 20;

  summarySheet.addRow([]);

  summarySheet.addRow(['Date', 'Total Intake (ml)', 'Total Output (ml)', 'Net Fluid Balance (ml)', 'Avg Blood Sugar (mg/dL)', 'Total Insulin Given (U)', 'Glucose Checks Count']);
  summarySheet.getRow(4).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  summarySheet.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } }; // blue-500
  summarySheet.getRow(4).alignment = { horizontal: 'center' };
  summarySheet.getRow(4).height = 24;

  dateStrings.forEach(dateStr => {
    const dayWater = safeWater.filter(w => w.entry_date === dateStr);
    const dayUrine = safeUrine.filter(u => u.entry_date === dateStr);
    const daySugar = safeSugar.filter(s => s.entry_date === dateStr);

    const dayIntake = dayWater.reduce((acc, c) => acc + Number(c.amount_ml || 0), 0);
    const dayOutput = dayUrine.reduce((acc, c) => acc + Number(c.volume_ml || 0), 0);
    const dayBalance = dayIntake - dayOutput;
    
    const glucoseValues = daySugar.map(s => Number(s.blood_sugar_mgdl)).filter(v => !isNaN(v));
    const avgGlucose = glucoseValues.length > 0
      ? Math.round(glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length)
      : 0;

    const dayInsulinEntries = daySugar.filter(s => s.insulin_units && s.insulin_units > 0);
    const insulinDetails = dayInsulinEntries.length > 0
      ? dayInsulinEntries.map(s => `${s.insulin_type || 'Insulin'}: ${s.insulin_units} U`).join(', ')
      : '0 U';

    summarySheet.addRow([
      dateStr,
      dayIntake,
      dayOutput,
      dayBalance,
      avgGlucose > 0 ? avgGlucose : 'N/A',
      insulinDetails,
      daySugar.length
    ]);
  });

  // Align cells in summary
  for (let r = 5; r <= summarySheet.rowCount; r++) {
    summarySheet.getRow(r).alignment = { horizontal: 'center' };
    summarySheet.getRow(r).font = { name: 'Segoe UI', size: 10 };
  }

  summarySheet.columns = [
    { width: 15 },
    { width: 20 },
    { width: 20 },
    { width: 22 },
    { width: 24 },
    { width: 24 },
    { width: 22 }
  ];

  // 2. Tab 2: Detailed Fluids Log
  const fluidsSheet = workbook.addWorksheet('Fluids Log');
  fluidsSheet.addRow(['Date', 'Time', 'Liquid Type', 'Amount (ml)', 'Notes']);
  fluidsSheet.getRow(1).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
  fluidsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
  fluidsSheet.getRow(1).alignment = { horizontal: 'center' };
  
  safeWater.forEach(w => {
    fluidsSheet.addRow([w.entry_date, formatTo12Hr(w.entry_time), w.liquid_type, w.amount_ml, w.notes || '']);
  });
  fluidsSheet.columns = [
    { width: 15 },
    { width: 15 },
    { width: 20 },
    { width: 16 },
    { width: 25 }
  ];

  // 3. Tab 3: Detailed Urine Log
  const urineSheet = workbook.addWorksheet('Urine Output Log');
  urineSheet.addRow(['Date', 'Time', 'Volume (ml)']);
  urineSheet.getRow(1).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
  urineSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
  urineSheet.getRow(1).alignment = { horizontal: 'center' };

  safeUrine.forEach(u => {
    urineSheet.addRow([u.entry_date, formatTo12Hr(u.entry_time), u.volume_ml]);
  });
  urineSheet.columns = [
    { width: 15 },
    { width: 15 },
    { width: 18 }
  ];

  // 4. Tab 4: Detailed Glucose Checks Log
  const sugarSheet = workbook.addWorksheet('Glucose Log');
  sugarSheet.addRow(['Date', 'Time', 'Blood Sugar (mg/dL)', 'Status', 'Insulin Type', 'Units']);
  sugarSheet.getRow(1).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
  sugarSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
  sugarSheet.getRow(1).alignment = { horizontal: 'center' };

  safeSugar.forEach(s => {
    const status = s.blood_sugar_mgdl >= 70 && s.blood_sugar_mgdl <= 140 ? 'Normal' : (s.blood_sugar_mgdl < 70 ? 'Low' : 'High');
    sugarSheet.addRow([
      s.entry_date,
      formatTo12Hr(s.entry_time),
      s.blood_sugar_mgdl,
      status,
      s.insulin_type || '-',
      s.insulin_units || '-'
    ]);
  });
  sugarSheet.columns = [
    { width: 15 },
    { width: 15 },
    { width: 22 },
    { width: 15 },
    { width: 20 },
    { width: 15 }
  ];

  // 5. Tab 5: Detailed Insulin Doses Log (Premium Purple Header)
  const insulinSheet = workbook.addWorksheet('Insulin Doses Log');
  insulinSheet.addRow(['Date', 'Time', 'Insulin Type', 'Dose (Units)', 'Blood Sugar']);
  insulinSheet.getRow(1).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
  insulinSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '581C87' } }; // Purple-900
  insulinSheet.getRow(1).alignment = { horizontal: 'center' };

  const rangeInsulinOnly = safeSugar.filter(s => s.insulin_units && s.insulin_units > 0);
  rangeInsulinOnly.forEach(s => {
    insulinSheet.addRow([
      s.entry_date,
      formatTo12Hr(s.entry_time),
      s.insulin_type || 'Insulin',
      s.insulin_units,
      s.blood_sugar_mgdl ? `${s.blood_sugar_mgdl} mg/dL` : '-'
    ]);
  });
  insulinSheet.columns = [
    { width: 15 },
    { width: 15 },
    { width: 20 },
    { width: 18 },
    { width: 18 }
  ];

  // Set grid lines visible for all sheets
  [summarySheet, fluidsSheet, urineSheet, sugarSheet, insulinSheet].forEach(sh => {
    sh.views = [{ showGridLines: true }];
  });

  // Generate and Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `patient_multiday_${startDate}_to_${endDate}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
