'use client';

import React, { useState } from 'react';
import { DailySummary, WaterIntakeEntry, UrineOutputEntry, SugarMonitorEntry } from '@/types';
import { exportToExcel, exportMultiDayExcel } from '@/lib/export-excel';
import { exportToPDF, exportToCSV, exportMultiDayPDF } from '@/lib/export-pdf';
import { supabase } from '@/lib/supabase';
import { Download, FileSpreadsheet, FileText, FileCode, Calendar } from 'lucide-react';

interface ExportReportProps {
  patientName: string;
  selectedDate: string;
  summary: DailySummary;
  waterList: WaterIntakeEntry[];
  urineList: UrineOutputEntry[];
  sugarList: SugarMonitorEntry[];
}

export const ExportReport: React.FC<ExportReportProps> = ({
  patientName,
  selectedDate,
  summary,
  waterList,
  urineList,
  sugarList
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [reportMode, setReportMode] = useState<'single' | 'multi'>('single');
  
  // Set defaults: startDate = 7 days ago, endDate = today
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Query ranges from Supabase
  const fetchRangeData = async () => {
    const { data: waterData } = await supabase
      .from('water_intake')
      .select('*')
      .gte('entry_date', startDate)
      .lte('entry_date', endDate)
      .order('entry_date', { ascending: true })
      .order('entry_time', { ascending: true });

    const { data: urineData } = await supabase
      .from('urine_output')
      .select('*')
      .gte('entry_date', startDate)
      .lte('entry_date', endDate)
      .order('entry_date', { ascending: true })
      .order('entry_time', { ascending: true });

    const { data: sugarData } = await supabase
      .from('sugar_monitor')
      .select('*')
      .gte('entry_date', startDate)
      .lte('entry_date', endDate)
      .order('entry_date', { ascending: true })
      .order('entry_time', { ascending: true });

    return {
      water: (waterData || []) as WaterIntakeEntry[],
      urine: (urineData || []) as UrineOutputEntry[],
      sugar: (sugarData || []) as SugarMonitorEntry[]
    };
  };

  const handleExcelExport = async () => {
    setIsExporting(true);
    try {
      if (reportMode === 'single') {
        await exportToExcel(patientName, selectedDate, summary, waterList, urineList, sugarList);
      } else {
        const data = await fetchRangeData();
        await exportMultiDayExcel(patientName, startDate, endDate, data.water, data.urine, data.sugar);
      }
    } catch (err) {
      console.error('Excel Export Error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePDFExport = async () => {
    setIsExporting(true);
    try {
      if (reportMode === 'single') {
        exportToPDF(patientName, selectedDate, summary, waterList, urineList, sugarList);
      } else {
        const data = await fetchRangeData();
        exportMultiDayPDF(patientName, startDate, endDate, data.water, data.urine, data.sugar);
      }
    } catch (err) {
      console.error('PDF Export Error:', err);
    } finally {
      setIsExporting(false);
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
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

      {/* Report Mode Segment Control */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit mb-4">
        <button
          onClick={() => setReportMode('single')}
          className={`text-xs font-black px-4 py-2 rounded-lg transition-all duration-150 ${reportMode === 'single' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Single Day
        </button>
        <button
          onClick={() => setReportMode('multi')}
          className={`text-xs font-black px-4 py-2 rounded-lg transition-all duration-150 ${reportMode === 'multi' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Multiple Days
        </button>
      </div>

      {/* Date Range Selectors for Multiple Days */}
      {reportMode === 'multi' && (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl mb-4 space-y-3 animate-in fade-in duration-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Configure Date Range
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* Export Options Buttons */}
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
          <div className="font-extrabold text-sm">
            {isExporting ? 'Exporting…' : reportMode === 'single' ? 'Download Excel' : 'Download Excel Range'}
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-0.5">
            {reportMode === 'single' 
              ? 'Print-ready single day table summaries and logs.'
              : 'Multi-tab spreadsheet summarizing day-by-day stats & detailed logs.'}
          </div>
        </button>

        {/* PDF Export */}
        <button
          onClick={handlePDFExport}
          disabled={isExporting}
          className="p-4 rounded-2xl border border-red-200 bg-red-50/60 hover:bg-red-100/70 text-red-900 text-left transition active:scale-[0.98] group disabled:opacity-50"
        >
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-6 h-6 text-red-600 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-200 text-red-900">
              .PDF
            </span>
          </div>
          <div className="font-extrabold text-sm">
            {isExporting ? 'Exporting…' : reportMode === 'single' ? 'Download PDF' : 'Download PDF Range'}
          </div>
          <div className="text-xs text-red-700 font-medium mt-0.5">
            {reportMode === 'single'
              ? 'Premium formatted single-day document for doctors.'
              : 'Multi-page formal health tracking docket with aggregated overview.'}
          </div>
        </button>

        {/* CSV Export */}
        <button
          onClick={handleCSVExport}
          disabled={isExporting || reportMode === 'multi'}
          className="p-4 rounded-2xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-900 text-left transition active:scale-[0.98] group disabled:opacity-50"
        >
          <div className="flex items-center justify-between mb-2">
            <FileCode className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-200 text-blue-900">
              .CSV
            </span>
          </div>
          <div className="font-extrabold text-sm">Download Raw CSV</div>
          <div className="text-xs text-blue-700 font-medium mt-0.5">
            Simple plain-text values sheet for single day raw records.
          </div>
        </button>
      </div>
    </div>
  );
};
