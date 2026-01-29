import { useEffect, useState, useMemo } from 'react';
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
  const { load, pv, gridImport, bess, gridPct, bessPct, pvPct, pieData } = useMemo(() => {
    const load = safeNumber(energyBucket?.load, 0);
    const pv = safeNumber(energyBucket?.pv, 0);
    const gridImport = safeNumber(energyBucket?.grid_import, 0);
    const bess = safeNumber(energyBucket?.bess, 0);

    const gridPct = safePercent(gridImport, load);
    const bessPct = safePercent(bess, load);
    const pvPct = load > 0 ? (100 - Number(gridPct)).toFixed(2) : '0.00';

    const pieData = [
      { label: 'From solar cells', value: pv, unit: 'kW', color: '#3B82F6' },
      { label: 'From power grid', value: gridImport, unit: 'kW', color: '#F59E0B' },
      { label: 'From battery', value: bess, unit: 'kW', color: '#10B981' },
    ];

    return { load, pv, gridImport, bess, gridPct, bessPct, pvPct, pieData };
  }, [energyBucket]);

  const hasGraph = Array.isArray(usageGraphData) && usageGraphData.length > 0;

  /* ---------------------------
   * RENDER
   * --------------------------- */
  return (
    <div className="p-6">
      {/* Header */}
      <div className="pb-4 border-b border-gray-100 mb-6">
        <h2 className="text-lg font-bold text-gray-900">Energy Analytics</h2>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2 mb-6">
        {TIME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            aria-label={`Select ${opt.label} range`}
            onClick={() => setTimeRange(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Usage Graph */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 mb-6" style={{ padding: '1rem 1.5rem', minHeight: '300px' }}>
        {loadingGantt ? (
          <div className="flex items-center justify-center h-[300px] text-gray-400">
            Loading data...
          </div>
        ) : hasGraph ? (
          <div style={{ height: '280px', width: '100%' }}>
            <TimelineBarchart
              key={timeRange}
              yAxisLabel="Usage (kW)"
              data={usageGraphData}
              timeRange={timeRange}
              showTooltip={true}
              tooltipFormatter={(value) => `${formatWithCommas(value)} kW`}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
            <div className="text-sm font-medium mb-1">Usage (kW)</div>
            <div className="text-xs">No usage data available</div>
          </div>
        )}
      </div>

      {/* Usage Breakdown Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Breakdown list */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Electric Usage Breakdown</h3>
          <div className="space-y-3">
            {[
              { color: 'bg-blue-500', label: 'Solar Cells', value: pv, pct: pvPct },
              { color: 'bg-amber-500', label: 'Power Grid', value: gridImport, pct: gridPct },
              { color: 'bg-green-500', label: 'Battery', value: bess, pct: bessPct },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <div className="flex items-baseline gap-0.5 whitespace-nowrap pl-2" style={{ paddingRight: '1cm' }}>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatWithCommas(item.value)}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">kW</span>
                  <span className="text-xs text-gray-500 ml-1">({item.pct}%)</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">Total Usage</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-gray-900">{formatWithCommas(load)}</span>
                <span className="text-sm text-gray-600">kW</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="flex items-center justify-center">
          {load > 0 ? (
            <div className="w-full max-w-[200px]">
              <PieGraph data={pieData} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400 h-full">
              <div className="text-sm font-medium mb-1">Energy Distribution</div>
              <div className="text-xs">No usage data</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}