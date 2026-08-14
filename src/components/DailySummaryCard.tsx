'use client';

import React from 'react';
import { DailySummary } from '@/types';
import { Droplet, Activity, Syringe, Pill, ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';

interface DailySummaryCardProps {
  summary: DailySummary;
  dosesGivenCount: number;
  dosesTotalCount: number;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({
  summary,
  dosesGivenCount,
  dosesTotalCount
}) => {
  const isNetPositive = summary.net_balance_ml >= 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Scale className="w-5 h-5 text-navy-900" />
          <h2 className="text-sm font-extrabold text-navy-900">
            Daily Summary — {summary.summary_date}
          </h2>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          Auto Totals
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Water Intake */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-600">Water Intake</span>
            <div className="p-1 rounded-md bg-blue-100 text-blue-700">
              <Droplet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">
            {summary.total_intake_ml} <span className="text-xs font-semibold text-slate-500">ml</span>
          </div>
        </div>

        {/* Urine Output */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-600">Urine Output</span>
            <div className="p-1 rounded-md bg-amber-100 text-amber-700">
              <Droplet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">
            {summary.total_output_ml} <span className="text-xs font-semibold text-slate-500">ml</span>
          </div>
        </div>

        {/* Net Fluid Balance */}
        <div className={`rounded-xl p-3 border ${
          isNetPositive
            ? 'bg-blue-50/80 border-blue-200 text-blue-900'
            : 'bg-orange-50/80 border-orange-200 text-orange-900'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-extrabold">Net Fluid</span>
            {isNetPositive ? (
              <ArrowUpRight className="w-4 h-4 text-blue-600" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-orange-600" />
            )}
          </div>
          <div className="text-lg font-black flex items-baseline gap-0.5">
            <span>{summary.net_balance_ml > 0 ? `+${summary.net_balance_ml}` : summary.net_balance_ml}</span>
            <span className="text-xs font-semibold">ml</span>
          </div>
        </div>

        {/* Avg Blood Sugar */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-600">Avg Glucose</span>
            <div className="p-1 rounded-md bg-emerald-100 text-emerald-700">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">
            {summary.avg_blood_sugar_mgdl ? summary.avg_blood_sugar_mgdl : '—'}
            <span className="text-xs font-semibold text-slate-500 ml-0.5">
              {summary.avg_blood_sugar_mgdl ? 'mg/dL' : ''}
            </span>
          </div>
          <div className="text-[10px] font-medium text-slate-500">
            {summary.reading_count} readings
          </div>
        </div>

        {/* Total Insulin */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-600">Total Insulin</span>
            <div className="p-1 rounded-md bg-purple-100 text-purple-700">
              <Syringe className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">
            {summary.total_insulin_units} <span className="text-xs font-semibold text-slate-500">Units</span>
          </div>
        </div>

        {/* Doses Given */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-600">Doses Given</span>
            <div className="p-1 rounded-md bg-teal-100 text-teal-700">
              <Pill className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">
            {dosesGivenCount} <span className="text-xs font-semibold text-slate-500">/ {dosesTotalCount} due</span>
          </div>
        </div>
      </div>
    </div>
  );
};
