'use client';

import React, { useState } from 'react';
import { DailySummary, WaterIntakeEntry, UrineOutputEntry, SugarMonitorEntry } from '@/types';
import { exportToExcel } from '@/lib/export-excel';
import { exportToPDF, exportToCSV } from '@/lib/export-pdf';
import { Download, FileSpreadsheet, FileText, FileCode } from 'lucide-react';

interface ExportReportProps {
  selectedDate: string;
  summary: DailySummary;
  waterList: WaterIntakeEntry[];
  urineList: UrineOutputEntry[];
  sugarList: SugarMonitorEntry[];
}

export const ExportReport: React.FC<ExportReportProps> = ({
  selectedDate,
  summary,
  waterList,
  urineList,
  sugarList
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExcelExport = async () => {
    setIsExporting(true);
    try {
      await exportToExcel('Yousef', selectedDate, summary, waterList, urineList, sugarList);
    } catch (err) {
      console.error('Excel Export Error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePDFExport = () => {
    try {
      exportToPDF('Yousef', selectedDate, summary, waterList, urineList, sugarList);
    } catch (err) {
      console.error('PDF Export Error:', err);
    }
  };

  const handleCSVExport = () => {
    try {
      exportToCSV(selectedDate, waterList, urineList, sugarList);
    } catch (err) {
      console.error('CSV Export Error:', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Download Health Reports</h3>
            <p className="text-[11px] text-slate-500 font-medium">Export files for doctor visits or record keeping</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Excel Export */}
        <button
          onClick={handleExcelExport}
          disabled={isExporting}
          className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-900 text-left transition active:scale-[0.98] group disabled:opacity-50"
        >
          <div className="flex items-center justify-between mb-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
              .XLSX
            </span>
          </div>
          <div className="font-extrabold text-sm">Download Excel Report</div>
          <div className="text-xs text-emerald-700 font-medium mt-0.5">
            Single-page print layout with daily locked totals &amp; logs
          </div>
        </button>

        {/* PDF Export */}
        <button
          onClick={handlePDFExport}
          className="p-4 rounded-2xl border border-red-200 bg-red-50/60 hover:bg-red-100/70 text-red-900 text-left transition active:scale-[0.98] group"
        >
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-6 h-6 text-red-600 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-200 text-red-900">
              .PDF
            </span>
          </div>
          <div className="font-extrabold text-sm">Download PDF Document</div>
          <div className="text-xs text-red-700 font-medium mt-0.5">
            Clean styled printable health summary
          </div>
        </button>

        {/* CSV Export */}
        <button
          onClick={handleCSVExport}
          className="p-4 rounded-2xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-900 text-left transition active:scale-[0.98] group"
        >
          <div className="flex items-center justify-between mb-2">
            <FileCode className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-200 text-blue-900">
              .CSV
            </span>
          </div>
          <div className="font-extrabold text-sm">Download Raw CSV</div>
          <div className="text-xs text-blue-700 font-medium mt-0.5">
            Raw data spreadsheet file
          </div>
        </button>
      </div>
    </div>
  );
};
