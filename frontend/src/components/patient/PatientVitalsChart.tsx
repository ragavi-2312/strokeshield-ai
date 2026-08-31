import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { VitalsPoint } from '../../types';
import { Activity, Heart, Droplet, Wind, TrendingUp } from 'lucide-react';

interface PatientVitalsChartProps {
  data: VitalsPoint[];
}

export const PatientVitalsChart: React.FC<PatientVitalsChartProps> = ({ data }) => {
  const [activeMetric, setActiveMetric] = useState<'bp' | 'glucose' | 'heart_rate' | 'spo2' | 'risk'>('bp');

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-medium">No historical vitals recorded yet.</p>
        <p className="text-xs text-slate-400 mt-1">Complete a stroke assessment to begin longitudinal trend tracking.</p>
      </div>
    );
  }

  // Format data chronological for plotting
  const chartData = [...data].reverse();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header & Metric Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-600" />
            <span>Longitudinal Vital Signs & Urgency Trends</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical progression across {chartData.length} clinical assessment{chartData.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveMetric('bp')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
              activeMetric === 'bp' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span>Blood Pressure</span>
          </button>
          <button
            onClick={() => setActiveMetric('glucose')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
              activeMetric === 'glucose' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Droplet className="w-3.5 h-3.5 text-amber-600" />
            <span>Glucose</span>
          </button>
          <button
            onClick={() => setActiveMetric('heart_rate')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
              activeMetric === 'heart_rate' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-600" />
            <span>Heart Rate</span>
          </button>
          <button
            onClick={() => setActiveMetric('spo2')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
              activeMetric === 'spo2' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wind className="w-3.5 h-3.5 text-teal-600" />
            <span>SpO2</span>
          </button>
          <button
            onClick={() => setActiveMetric('risk')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
              activeMetric === 'risk' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
            <span>Risk Score</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {activeMetric === 'bp' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[50, 220]} tick={{ fontSize: 11, fill: '#64748b' }} unit=" mmHg" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <ReferenceLine y={140} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Stage 2 HTN (140)', fill: '#f59e0b', fontSize: 10 }} />
              <ReferenceLine y={180} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Crisis (180)', fill: '#ef4444', fontSize: 10 }} />
              <Line type="monotone" dataKey="systolic_bp" name="Systolic BP" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="diastolic_bp" name="Diastolic BP" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          ) : activeMetric === 'glucose' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[40, 300]} tick={{ fontSize: 11, fill: '#64748b' }} unit=" mg/dL" />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Hypoglycemia (70)', fill: '#f59e0b', fontSize: 10 }} />
              <ReferenceLine y={180} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Hyperglycemia (180)', fill: '#ef4444', fontSize: 10 }} />
              <Line type="monotone" dataKey="glucose" name="Blood Glucose (mg/dL)" stroke="#d97706" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          ) : activeMetric === 'heart_rate' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[40, 150]} tick={{ fontSize: 11, fill: '#64748b' }} unit=" bpm" />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Tachycardia (100)', fill: '#ef4444', fontSize: 10 }} />
              <Line type="monotone" dataKey="heart_rate" name="Heart Rate (bpm)" stroke="#e11d48" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          ) : activeMetric === 'spo2' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit=" %" />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <ReferenceLine y={92} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Hypoxia (<92%)', fill: '#ef4444', fontSize: 10 }} />
              <Line type="monotone" dataKey="spo2" name="Oxygen Saturation (SpO2 %)" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit=" /100" />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <ReferenceLine y={65} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Emergency Threshold (65)', fill: '#ef4444', fontSize: 10 }} />
              <ReferenceLine y={38} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Moderate Threshold (38)', fill: '#f59e0b', fontSize: 10 }} />
              <Line type="monotone" dataKey="risk_score" name="AI Stroke Urgency Score" stroke="#9333ea" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
