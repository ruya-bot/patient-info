import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DailySummary, WaterIntakeEntry, UrineOutputEntry, SugarMonitorEntry } from '@/types';
import { formatTo12Hr } from './storage';

export function exportToPDF(
  patientName: string,
  selectedDate: string,
  summary: DailySummary | null,
  waterList: WaterIntakeEntry[] = [],
  urineList: UrineOutputEntry[] = [],
  sugarList: SugarMonitorEntry[] = []
): void {
  const doc = new jsPDF();

  const safeWater = Array.isArray(waterList) ? waterList : [];
  const safeUrine = Array.isArray(urineList) ? urineList : [];
  const safeSugar = Array.isArray(sugarList) ? sugarList : [];

  const totalIntake = summary?.total_intake_ml ?? safeWater.reduce((acc, curr) => acc + Number(curr.amount_ml || 0), 0);
  const totalOutput = summary?.total_output_ml ?? safeUrine.reduce((acc, curr) => acc + Number(curr.volume_ml || 0), 0);
  const netBalance = totalIntake - totalOutput;

  // 1. Elegant Header Band (Dark Slate)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 30, 'F');

  // Accent Line (Royal Blue)
  doc.setFillColor(59, 130, 246); // blue-500
  doc.rect(0, 30, 210, 2, 'F');

  // Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Patient Health Monitor — ${patientName || 'Yousef'}`, 14, 18);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Confidential Home Care Health Report', 14, 25);

  // Date
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Date: ${selectedDate}`, 160, 20);

  let currentY = 42;

  // 2. Daily Summary Section Header
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Daily Summary Overview', 14, currentY);
  currentY += 4;

  // Summary Table (Styled like a clean dashboard card)
  autoTable(doc, {
    startY: currentY,
    head: [['Total Intake', 'Total Output', 'Net Balance', 'Avg Glucose', 'Insulin Logged', 'Glucose Checks']],
    body: [[
      `${totalIntake} ml`,
      `${totalOutput} ml`,
      `${netBalance} ml`,
      summary?.avg_blood_sugar_mgdl ? `${summary.avg_blood_sugar_mgdl} mg/dL` : 'N/A',
      `${summary?.total_insulin_units ?? 0} U`,
      `${safeSugar.length} readings`
    ]],
    theme: 'grid',
    headStyles: { 
      fillColor: [59, 130, 246], 
      textColor: [255, 255, 255], 
      fontStyle: 'bold', 
      fontSize: 9,
      halign: 'center'
    },
    styles: { 
      halign: 'center', 
      fontSize: 10, 
      fontStyle: 'bold', 
      textColor: [15, 23, 42] 
    },
    columnStyles: {
      2: { textColor: netBalance < 0 ? [220, 38, 38] : [16, 185, 129] } // Red if negative, green if positive
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // 3. Water Intake Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Water & Fluids Log', 14, currentY);
  currentY += 4;

  const waterRows = safeWater.length > 0
    ? safeWater.map(w => [formatTo12Hr(w.entry_time), w.liquid_type, `${w.amount_ml} ml`, w.notes || '-'])
    : [['-', 'No fluid entries logged for this date', '-', '-']];

  autoTable(doc, {
    startY: currentY,
    head: [['Time', 'Liquid Type', 'Amount', 'Notes']],
    body: waterRows,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], fontSize: 9 }, // Slate-800
    styles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] } // Slate-50
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // 4. Urine Output Section (Clean list, no notes)
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Urine Output Log', 14, currentY);
  currentY += 4;

  const urineRows = safeUrine.length > 0
    ? safeUrine.map(u => [formatTo12Hr(u.entry_time), `${u.volume_ml} ml`])
    : [['-', 'No urine output logged for this date']];

  autoTable(doc, {
    startY: currentY,
    head: [['Time', 'Volume']],
    body: urineRows,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], fontSize: 9 },
    styles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // 5. Blood Sugar & Insulin Section (Clean columns, no notes)
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Blood Sugar & Insulin Monitor', 14, currentY);
  currentY += 4;

  const sugarRows = safeSugar.length > 0
    ? safeSugar.map(s => {
        const glucoseVal = s.blood_sugar_mgdl;
        const status = glucoseVal >= 70 && glucoseVal <= 140 ? 'Normal' : (glucoseVal < 70 ? 'Low' : 'High');
        return [
          formatTo12Hr(s.entry_time),
          `${glucoseVal} mg/dL`,
          status,
          s.insulin_type || '-',
          s.insulin_units ? `${s.insulin_units} U` : '-'
        ];
      })
    : [['-', 'No blood sugar logs for this date', '-', '-', '-']];

  autoTable(doc, {
    startY: currentY,
    head: [['Time', 'Glucose Level', 'Status', 'Insulin Type', 'Units']],
    body: sugarRows,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], fontSize: 9 },
    styles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  // Footer Page Numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Page ${i} of ${pageCount} — Generated by Yousef Patient Monitor`, 14, 287);
  }

  doc.save(`patient_monitoring_${selectedDate}.pdf`);
}

export function exportToCSV(
  selectedDate: string,
  waterList: WaterIntakeEntry[] = [],
  urineList: UrineOutputEntry[] = [],
  sugarList: SugarMonitorEntry[] = []
): void {
  const safeWater = Array.isArray(waterList) ? waterList : [];
  const safeUrine = Array.isArray(urineList) ? urineList : [];
  const safeSugar = Array.isArray(sugarList) ? sugarList : [];

  let csv = `Date: ${selectedDate}\n\n`;

  csv += `--- WATER INTAKE ---\nTime,Liquid Type,Amount (ml),Notes\n`;
  safeWater.forEach(w => {
    csv += `"${formatTo12Hr(w.entry_time)}","${w.liquid_type}",${w.amount_ml},"${w.notes || ''}"\n`;
  });

  csv += `\n--- URINE OUTPUT ---\nTime,Volume (ml)\n`;
  safeUrine.forEach(u => {
    csv += `"${formatTo12Hr(u.entry_time)}",${u.volume_ml}\n`;
  });

  csv += `\n--- BLOOD SUGAR & INSULIN ---\nTime,Blood Sugar (mg/dL),Insulin Type,Insulin Units\n`;
  safeSugar.forEach(s => {
    csv += `"${formatTo12Hr(s.entry_time)}",${s.blood_sugar_mgdl},"${s.insulin_type || ''}",${s.insulin_units || ''}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `patient_data_${selectedDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
