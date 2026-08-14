import ExcelJS from 'exceljs';
import { DailySummary, WaterIntakeEntry, UrineOutputEntry, SugarMonitorEntry } from '@/types';

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

  // Title Block
  sheet.mergeCells('A1:F1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `PATIENT HEALTH REPORT - ${(patientName || 'Yousef').toUpperCase()}`;
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F3864' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 36;

  sheet.mergeCells('A2:F2');
  const subCell = sheet.getCell('A2');
  subCell.value = `Report Date: ${selectedDate} | Exported: ${new Date().toLocaleString()}`;
  subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '486581' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 20;

  sheet.addRow([]);

  // Section 1: Daily Summary Table
  sheet.mergeCells('A4:F4');
  const summaryHeader = sheet.getCell('A4');
  summaryHeader.value = '1. DAILY LOCKED SUMMARY';
  summaryHeader.font = { name: 'Calibri', size: 12, bold: true, color: { argb: '1F3864' } };
  summaryHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9E2EC' } };
  sheet.getRow(4).height = 24;

  const summaryRowHeaders = ['Total Water Intake', 'Total Urine Output', 'Net Fluid Balance', 'Avg Blood Sugar', 'Total Insulin Given', 'Readings Count'];
  const summaryValues = [
    `${totalIntake} ml`,
    `${totalOutput} ml`,
    `${netBalance} ml`,
    summary?.avg_blood_sugar_mgdl ? `${summary.avg_blood_sugar_mgdl} mg/dL` : 'N/A',
    `${summary?.total_insulin_units ?? 0} Units`,
    `${safeSugar.length} entries`
  ];

  sheet.addRow(summaryRowHeaders);
  sheet.addRow(summaryValues);

  sheet.getRow(5).font = { bold: true, color: { argb: '243B53' } };
  sheet.getRow(5).alignment = { horizontal: 'center' };
  sheet.getRow(6).font = { size: 12, bold: true };
  sheet.getRow(6).alignment = { horizontal: 'center' };

  sheet.addRow([]);

  // Section 2: Water Intake Log
  const waterStartRow = sheet.rowCount + 1;
  sheet.mergeCells(`A${waterStartRow}:F${waterStartRow}`);
  const waterHeader = sheet.getCell(`A${waterStartRow}`);
  waterHeader.value = '2. WATER INTAKE LOG';
  waterHeader.font = { name: 'Calibri', size: 12, bold: true, color: { argb: '1F3864' } };
  waterHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9E2EC' } };

  sheet.addRow(['Time', 'Liquid Type', 'Amount (ml)', 'Notes']);
  sheet.getRow(waterStartRow + 1).font = { bold: true };

  if (safeWater.length === 0) {
    sheet.addRow(['No water intake entries for this date', '', '', '']);
  } else {
    safeWater.forEach(w => {
      sheet.addRow([w.entry_time, w.liquid_type, w.amount_ml, w.notes || '']);
    });
  }

  sheet.addRow([]);

  // Section 3: Urine Output Log
  const urineStartRow = sheet.rowCount + 1;
  sheet.mergeCells(`A${urineStartRow}:F${urineStartRow}`);
  const urineHeader = sheet.getCell(`A${urineStartRow}`);
  urineHeader.value = '3. URINE OUTPUT LOG';
  urineHeader.font = { name: 'Calibri', size: 12, bold: true, color: { argb: '1F3864' } };
  urineHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9E2EC' } };

  sheet.addRow(['Time', 'Volume (ml)', 'Notes']);
  sheet.getRow(urineStartRow + 1).font = { bold: true };

  if (safeUrine.length === 0) {
    sheet.addRow(['No urine output entries for this date', '', '']);
  } else {
    safeUrine.forEach(u => {
      sheet.addRow([u.entry_time, u.volume_ml, u.notes || '']);
    });
  }

  sheet.addRow([]);

  // Section 4: Sugar & Insulin Monitor Log
  const sugarStartRow = sheet.rowCount + 1;
  sheet.mergeCells(`A${sugarStartRow}:F${sugarStartRow}`);
  const sugarHeader = sheet.getCell(`A${sugarStartRow}`);
  sugarHeader.value = '4. BLOOD SUGAR & INSULIN MONITOR';
  sugarHeader.font = { name: 'Calibri', size: 12, bold: true, color: { argb: '1F3864' } };
  sugarHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9E2EC' } };

  sheet.addRow(['Time', 'Blood Sugar (mg/dL)', 'Status', 'Insulin Type', 'Insulin (Units)', 'Notes']);
  sheet.getRow(sugarStartRow + 1).font = { bold: true };

  if (safeSugar.length === 0) {
    sheet.addRow(['No glucose/insulin entries for this date', '', '', '', '', '']);
  } else {
    safeSugar.forEach(s => {
      const status = s.blood_sugar_mgdl >= 70 && s.blood_sugar_mgdl <= 140
        ? 'Normal (70-140)'
        : (s.blood_sugar_mgdl < 70 ? 'Low' : 'High');
      sheet.addRow([
        s.entry_time,
        s.blood_sugar_mgdl,
        status,
        s.insulin_type || '-',
        s.insulin_units ? `${s.insulin_units} U` : '-',
        s.notes || ''
      ]);
    });
  }

  // Adjust column widths
  sheet.columns = [
    { width: 15 },
    { width: 22 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 25 }
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
