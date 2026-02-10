import { useEffect, useState, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import PieGraph from '../Graphs/PieGraph';
import TimelineBarchart from '../Graphs/TimelineBarchart';
import { formatWithCommas } from '../../utils/FormatUtil';
import { fetchSiteGanttChart } from '../../api/ganttApi';
import { mapGanttToTimelineData, resolveGranularity, todayIsoDate } from '../../mappers/ganttMapper';

/* ---------------------------
 * CONSTANTS
 * --------------------------- */

const TIME_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'month', label: 'Month' },
  { value: 'lifetime', label: 'Lifetime' },
];

/* ---------------------------
 * HELPERS
 * --------------------------- */

function safeNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function safePercent(numerator, denominator, decimals = 2) {
  const num = safeNumber(numerator, 0);
  const den = safeNumber(denominator, 0);
  if (den <= 0) return '0.00';
  const pct = (num / den) * 100;
  return Number.isFinite(pct) ? pct.toFixed(decimals) : '0.00';
}

// Auto-scale energy values (kW -> MW -> GW)
function autoScaleEnergy(value) {
  const numValue = parseFloat(value);
  if (!Number.isFinite(numValue)) return { value: '0.00', unit: 'kW' };
  
  const absValue = Math.abs(numValue);
  if (absValue >= 1000000) {
    return { value: formatWithCommas(numValue / 1000000), unit: 'GW' };
  } else if (absValue >= 1000) {
    return { value: formatWithCommas(numValue / 1000), unit: 'MW' };
  }
  return { value: formatWithCommas(numValue), unit: 'kW' };
}

/* ---------------------------
 * COMPONENT
 * --------------------------- */

export default function EnergyAnalyticsWidget({ wsData, siteId }) {
  const [timeRange, setTimeRange] = useState('day');
  const [usageGraphData, setUsageGraphData] = useState([]);
  const [energyBucket, setEnergyBucket] = useState(null);
  const [loadingGantt, setLoadingGantt] = useState(false);

  /* ---------------------------
   * GANTT DATA LOAD
   * --------------------------- */
  useEffect(() => {
    const granularity = resolveGranularity(timeRange);
    const date = todayIsoDate();

    if (!siteId || !granularity || !date) {
      setUsageGraphData([]);
      return;
    }

    const controller = new AbortController();

    (async () => {
      setLoadingGantt(true);
      try {
        const series = await fetchSiteGanttChart({
          siteId,
          granularity,
          date,
          tz: 'Asia/Ho_Chi_Minh',
          signal: controller.signal,
        });

        const usageSeries = mapGanttToTimelineData(series || [], ['load']);
        setUsageGraphData(usageSeries || []);
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Failed to load Gantt data', err);
      } finally {
        setLoadingGantt(false);
      }
    })();

    return () => controller.abort();
  }, [siteId, timeRange]);

  /* ---------------------------
   * ENERGY BUCKET SELECTION
   * --------------------------- */
  useEffect(() => {
    if (!wsData?.energyData) {
      setEnergyBucket(null);
      return;
    }
    if (timeRange === 'day') setEnergyBucket(wsData.energyData.daily);
    else if (timeRange === 'month') setEnergyBucket(wsData.energyData.monthly);
    else if (timeRange === 'lifetime') setEnergyBucket(wsData.energyData.lifetime);
    else setEnergyBucket(null);
  }, [timeRange, wsData]);

  /* ---------------------------
   * DERIVED ENERGY VALUES (memoized)
   * --------------------------- */
  const { load, gridPct, bessPct, pvPct, pieData, scaledValues } = useMemo(() => {
    const load = safeNumber(energyBucket?.load, 0);
    const pv = safeNumber(energyBucket?.pv, 0);
    const gridImport = safeNumber(energyBucket?.grid_import, 0);
    const bess = safeNumber(energyBucket?.bess, 0);

    const gridPct = safePercent(gridImport, load);
    const bessPct = safePercent(bess, load);
    const pvPct = load > 0 ? (100 - Number(gridPct)).toFixed(2) : '0.00';

    // Scale all values
    const scaledPv = autoScaleEnergy(pv);
    const scaledGrid = autoScaleEnergy(gridImport);
    const scaledBess = autoScaleEnergy(bess);
    const scaledLoad = autoScaleEnergy(load);

    const pieData = [
      { label: 'From solar cells', value: pv, unit: scaledPv.unit, color: '#3B82F6' },
      { label: 'From power grid', value: gridImport, unit: scaledGrid.unit, color: '#F59E0B' },
      { label: 'From battery', value: bess, unit: scaledBess.unit, color: '#10B981' },
    ];

    return { 
      load, 
      gridPct, 
      bessPct, 
      pvPct, 
      pieData,
      scaledValues: {
        pv: scaledPv,
        grid: scaledGrid,
        bess: scaledBess,
        load: scaledLoad,
      }
    };
  }, [energyBucket]);

  const hasGraph = Array.isArray(usageGraphData) && usageGraphData.length > 0;

  /* ---------------------------
   * RENDER
   * --------------------------- */
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-200/60 flex-shrink-0">
        <div className="bg-gradient-to-br from-indigo-100 to-purple-100 backdrop-blur-sm rounded-xl p-2 shadow-sm border border-indigo-200/60">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Energy Analytics</h2>
      </div>

      {/* Time Range Selector */}
      <div 
        className="flex justify-center mb-4 flex-shrink-0"
        onClick={(e) => e.stopPropagation()} // Prevent expansion when clicking toggles
      >
        <div
          className="inline-flex items-center gap-0.5 rounded-lg bg-gradient-to-b from-slate-50 to-slate-100 p-0.5 shadow-md border border-slate-200/60"
          style={{
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.08)',
          }}
        >
          {TIME_OPTIONS.map((opt) => {
            const active = timeRange === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTimeRange(opt.value)}
                className={`relative px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                  active
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
                style={
                  active
                    ? {
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4), 0 1px 2px rgba(0, 0, 0, 0.1)',
                      }
                    : {}
                }
              >
                <span className="relative z-10">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Usage Graph */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg border-2 border-slate-200/60 mb-4 p-4 flex-shrink-0" style={{ minHeight: '300px' }}>
        {loadingGantt ? (
          <div className="flex items-center justify-center h-[280px] text-slate-400">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Loading data...</span>
            </div>
          </div>
        ) : hasGraph ? (
          <div style={{ height: '280px', width: '100%' }}>
            <TimelineBarchart
              key={timeRange}
              yAxisLabel="Usage"
              data={usageGraphData}
              timeRange={timeRange}
              showTooltip={true}
              tooltipFormatter={(value) => {
                const scaled = autoScaleEnergy(value);
                return `${scaled.value} ${scaled.unit}`;
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[280px] text-slate-400">
            <TrendingUp className="w-12 h-12 mb-2 opacity-30" />
            <div className="text-sm font-semibold mb-1">Usage Chart</div>
            <div className="text-xs">No usage data available</div>
          </div>
        )}
      </div>

      {/* Usage Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Breakdown list */}
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Electric Usage Breakdown</h3>
          <div className="space-y-2.5 flex-1">
            {[
              { 
                gradient: 'from-blue-500 to-indigo-600', 
                label: 'Solar Cells', 
                scaled: scaledValues.pv, 
                pct: pvPct 
              },
              { 
                gradient: 'from-amber-500 to-orange-600', 
                label: 'Power Grid', 
                scaled: scaledValues.grid, 
                pct: gridPct 
              },
              { 
                gradient: 'from-green-500 to-emerald-600', 
                label: 'Battery', 
                scaled: scaledValues.bess, 
                pct: bessPct 
              },
            ].map((item) => (
              <div 
                key={item.label} 
                className="bg-gradient-to-r from-slate-50 to-white rounded-lg p-3 border border-slate-200/60 hover:border-slate-300 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${item.gradient} shadow-sm`} />
                    <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-slate-900">
                      {item.scaled.value}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">{item.scaled.unit}</span>
                    <span className="text-xs text-slate-500 ml-1">({item.pct}%)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t-2 border-slate-200/60">
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-lg p-3 border-2 border-indigo-200/60">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Total Usage</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-900">{scaledValues.load.value}</span>
                  <span className="text-sm font-bold text-slate-600">{scaledValues.load.unit}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="flex items-center justify-center">
          {load > 0 ? (
            <div className="w-full max-w-[220px]">
              <PieGraph data={pieData} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 h-full bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg border-2 border-slate-200/60 p-6">
              <TrendingUp className="w-12 h-12 mb-2 opacity-30" />
              <div className="text-sm font-semibold mb-1">Energy Distribution</div>
              <div className="text-xs">No usage data</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}