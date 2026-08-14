'use client';

import React, { useState } from 'react';
import { DailySummary } from '@/types';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface TrendsChartProps {
  summaries: DailySummary[];
}

export const TrendsChart: React.FC<TrendsChartProps> = ({ summaries }) => {
  const [daysRange, setDaysRange] = useState<7 | 30>(7);

  const displayData = summaries
    .slice(-daysRange)
    .map(s => ({
      date: s.summary_date.slice(5), // MM-DD
      fullDate: s.summary_date,
      Intake: s.total_intake_ml,
      Output: s.total_output_ml,
      NetBalance: s.net_balance_ml,
      Glucose: s.avg_blood_sugar_mgdl,
      Insulin: s.total_insulin_units
    }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Fluid &amp; Glucose Trends</h3>
            <p className="text-[11px] text-slate-500 font-medium">Historical analytics for Yousef</p>
          </div>
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setDaysRange(7)}
            className={`text-xs font-bold px-3 py-1 rounded-lg transition ${
              daysRange === 7
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDaysRange(30)}
            className={`text-xs font-bold px-3 py-1 rounded-lg transition ${
              daysRange === 30
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {displayData.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-xs font-medium">
          No historical summary data available to render chart.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Chart 1: Fluid Balance */}
          <div>
            <h4 className="text-[11px] font-extrabold text-slate-500 mb-2 uppercase tracking-wider">
              Fluid Intake vs Output (ml)
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="Intake" fill="#2563eb" radius={[4, 4, 0, 0]} name="Water Intake (ml)" />
                  <Bar dataKey="Output" fill="#d97706" radius={[4, 4, 0, 0]} name="Urine Output (ml)" />
                  <Line type="monotone" dataKey="NetBalance" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} name="Net Balance (ml)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
