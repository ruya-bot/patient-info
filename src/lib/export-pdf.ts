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

export function exportMultiDayPDF(
  patientName: string,
  startDate: string,
  endDate: string,
  waterList: WaterIntakeEntry[] = [],
  urineList: UrineOutputEntry[] = [],
  sugarList: SugarMonitorEntry[] = []
): void {
  const doc = new jsPDF();
  
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

  // Calculate day-by-day summary rows
  const summaryRows: any[] = [];
  let totalIntakeAll = 0;
  let totalOutputAll = 0;
  let totalInsulinAll = 0;

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

    const dayInsulin = daySugar.reduce((acc, c) => acc + Number(c.insulin_units || 0), 0);

    totalIntakeAll += dayIntake;
    totalOutputAll += dayOutput;
    totalInsulinAll += dayInsulin;

    summaryRows.push([
      dateStr,
      `${dayIntake} ml`,
      `${dayOutput} ml`,
      `${dayBalance} ml`,
      avgGlucose > 0 ? `${avgGlucose} mg/dL` : 'N/A',
      `${dayInsulin} U`,
      `${daySugar.length} rdgs`
    ]);
  });

  // Page 1: Elegant range title and main aggregated summary table
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 30, 'F');

  // Accent Line
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 30, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(`Multi-Day Health Report — ${patientName || 'Yousef'}`, 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Period: ${startDate} to ${endDate} (${dateStrings.length} days)`, 14, 25);

  let currentY = 42;

  // Title for Summary Table
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Date Range Overview Summary', 14, currentY);
  currentY += 4;

  autoTable(doc, {
    startY: currentY,
    head: [['Date', 'Total Intake', 'Total Output', 'Net Balance', 'Avg Glucose', 'Insulin Logged', 'Glucose Checks']],
    body: summaryRows,
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
      fontSize: 9, 
      textColor: [15, 23, 42] 
    }
  });

  // Page 2+: Day-by-Day detailed logs
  dateStrings.forEach((dateStr) => {
    const dayWater = safeWater.filter(w => w.entry_date === dateStr);
    const dayUrine = safeUrine.filter(u => u.entry_date === dateStr);
    const daySugar = safeSugar.filter(s => s.entry_date === dateStr);

    // Skip printing pages for empty days to avoid paper waste
    if (dayWater.length === 0 && dayUrine.length === 0 && daySugar.length === 0) return;

    doc.addPage();
    
    // Day Banner
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, 210, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Detailed Logs — ${dateStr}`, 14, 10);

    let dayY = 22;

    // 1. Water Intake
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Water & Fluids Log', 14, dayY);
    dayY += 3;

    const wRows = dayWater.length > 0
      ? dayWater.map(w => [formatTo12Hr(w.entry_time), w.liquid_type, `${w.amount_ml} ml`, w.notes || '-'])
      : [['-', 'No fluid entries logged', '-', '-']];

    autoTable(doc, {
      startY: dayY,
      head: [['Time', 'Liquid Type', 'Amount', 'Notes']],
      body: wRows,
      theme: 'striped',
      headStyles: { fillColor: [71, 85, 105], fontSize: 8 },
      styles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    dayY = (doc as any).lastAutoTable.finalY + 6;

    // 2. Urine Output
    doc.setFont('helvetica', 'bold');
    doc.text('Urine Output Log', 14, dayY);
    dayY += 3;

    const uRows = dayUrine.length > 0
      ? dayUrine.map(u => [formatTo12Hr(u.entry_time), `${u.volume_ml} ml`])
      : [['-', 'No urine output logged']];

    autoTable(doc, {
      startY: dayY,
      head: [['Time', 'Volume']],
      body: uRows,
      theme: 'striped',
      headStyles: { fillColor: [71, 85, 105], fontSize: 8 },
      styles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    dayY = (doc as any).lastAutoTable.finalY + 6;

    // 3. Glucose & Insulin
    doc.setFont('helvetica', 'bold');
    doc.text('Blood Sugar & Insulin Monitor', 14, dayY);
    dayY += 3;

    const sRows = daySugar.length > 0
      ? daySugar.map(s => {
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
      : [['-', 'No blood sugar logs', '-', '-', '-']];

    autoTable(doc, {
      startY: dayY,
      head: [['Time', 'Glucose Level', 'Status', 'Insulin Type', 'Units']],
      body: sRows,
      theme: 'striped',
      headStyles: { fillColor: [71, 85, 105], fontSize: 8 },
      styles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });
  });

  // Page Numbers Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount} — Generated by Yousef Patient Monitor`, 14, 287);
  }

  doc.save(`patient_multiday_${startDate}_to_${endDate}.pdf`);
}
