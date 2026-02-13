import { useEffect, useState, useCallback } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import DoubleLineGraph from '../Graphs/DoubleLineGraph';
import { fetchGroupGanttChart } from '../../api/ganttApi';
import { mapGroupGanttSeries, resolveGranularity, todayIsoDate } from '../../mappers/ganttMapper';

export default function GroupTimelineWidget({ data }) {
  const [timeRange, setTimeRange] = useState('day');
  const [sourceData, setSourceData] = useState([]);
  const [consumptionData, setConsumptionData] = useState([]);
  const [selectedGrp, setSelectedGrp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const timeDropdownOptions = [
    { value: 'day', label: 'Day' },
    { value: 'month', label: 'Month' },
    { value: 'lifetime', label: 'Lifetime' },
  ];

  const grpDropdownOptions = data.map((g) => ({
    value: g.id,
    label: g.name,
  }));

  useEffect(() => {
    if (grpDropdownOptions.length > 0 && selectedGrp === null) {
      setSelectedGrp(grpDropdownOptions[0].value);
    }
  }, [grpDropdownOptions, selectedGrp]);

  const updateSourceData = useCallback(async () => {
    if (selectedGrp === null) return;
    
    const granularity = resolveGranularity(timeRange);
    const date = todayIsoDate();
    
    if (!granularity || !date) {
      setSourceData([]);
      setConsumptionData([]);
      return;
    }

    setLoading(true);
    try {
      const raw = await fetchGroupGanttChart({
        groupId: selectedGrp,
        granularity,
        date,
        tz: 'Asia/Ho_Chi_Minh',
      });
      
      const mapped = mapGroupGanttSeries(raw || []);
      
      const upper = [
        {
          id: 'grid',
          color: '#F59E0B',
          name: 'Grid',
          data: mapped.grid || [],
        },
        {
          id: 'solar',
          color: '#10B981',
          name: 'Solar',
          data: mapped.pv || [],
        },
        {
          id: 'battery',
          color: '#3B82F6',
          name: 'Battery (+ charge, - discharge)',
          data: mapped.bess || [],
        },
      ];
      
      setSourceData(upper);
      setConsumptionData([
        {
          id: 'consumption1',
          color: '#EF4444',
          name: 'Internal electric load',
          data: (mapped.home_load || []).map((item) => ({
            key: item.key,
            value: item.value ? -item.value : 0,
          })),
        },
      ]);
    } catch (e) {
      console.error('Error loading graph data', e);
      setSourceData([]);
      setConsumptionData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedGrp, timeRange]);

  useEffect(() => {
    if (selectedGrp === null) return;

    updateSourceData();
  }, [selectedGrp, timeRange, updateSourceData]);

  async function handleRefresh() {
    if (isRefreshing || loading) return;
    
    setIsRefreshing(true);
    try {
      await updateSourceData();
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 600);
    }
  }

  function selectGrp(value) {
    setSelectedGrp(value);
  }

  function selectTimeRange(value) {
    setTimeRange(value);
  }

  const hasData = sourceData.length > 0 || consumptionData.length > 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-violet-100 to-purple-100 backdrop-blur-sm rounded-xl p-2 shadow-sm border border-violet-200/60">
            <Activity className="w-5 h-5 text-violet-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Group Energy Supply / Consumption Timeline
          </h2>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-slate-200/60 text-violet-600 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            title="Refresh data"
            aria-label="Refresh data"
          >
            <RefreshCw 
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {/* Toggle Buttons - wrapped with onClick stopPropagation */}
        <div
          className="flex flex-col md:flex-row md:items-center gap-3"
          onClick={(e) => e.stopPropagation()} // Prevent expansion when clicking toggles
        >
          {/* Group Selection */}
          {grpDropdownOptions.length > 0 && (
            <div className="w-full md:w-auto overflow-x-auto">
              <div
                className="inline-flex items-center gap-0.5 rounded-lg bg-gradient-to-b from-slate-50 to-slate-100 p-0.5 shadow-md border border-slate-200/60 min-w-max"
                style={{
                  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.08)',
                }}
              >
                {grpDropdownOptions.map((opt) => {
                  const active = selectedGrp === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => selectGrp(opt.value)}
                      className={`relative px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                        active
                          ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                      style={
                        active
                          ? {
                              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4), 0 1px 2px rgba(0, 0, 0, 0.1)',
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
          )}

          {/* Time Range Selection */}
          <div className="w-full md:w-auto overflow-x-auto">
            <div
              className="inline-flex items-center gap-0.5 rounded-lg bg-gradient-to-b from-slate-50 to-slate-100 p-0.5 shadow-md border border-slate-200/60 min-w-max"
              style={{
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.08)',
              }}
            >
              {timeDropdownOptions.map((opt) => {
                const active = timeRange === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => selectTimeRange(opt.value)}
                    className={`relative px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                      active
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                    style={
                      active
                        ? {
                            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4), 0 1px 2px rgba(0, 0, 0, 0.1)',
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
        </div>
      </div>

      {/* Graph Area - Much Larger */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg border-2 border-slate-200/60 p-6" style={{ minHeight: '450px' }}>
        {loading ? (
          <div className="flex items-center justify-center h-[450px] text-slate-400">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Loading timeline data...</span>
            </div>
          </div>
        ) : hasData ? (
          <div style={{ height: '420px', width: '100%', position: 'relative' }}>
            <DoubleLineGraph
              upperData={sourceData || []}
              lowerData={consumptionData || []}
              yAxisLabel="Power"
              viewMode={timeRange}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[450px] text-slate-400">
            <Activity className="w-16 h-16 mb-3 opacity-30" />
            <p className="text-base font-semibold mb-1">No Timeline Data Available</p>
            <p className="text-sm">Select a group and time range to view energy flow</p>
          </div>
        )}
      </div>

      {/* Legend */}
      {hasData && !loading && (
        <div className="mt-4 flex flex-wrap gap-4 justify-center">
          {[
            { color: '#F59E0B', name: 'Grid' },
            { color: '#10B981', name: 'Solar' },
            { color: '#3B82F6', name: 'Battery' },
            { color: '#EF4444', name: 'Internal Load' },
          ].map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="w-4 h-1 rounded-full shadow-sm" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs font-semibold text-slate-700">{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}