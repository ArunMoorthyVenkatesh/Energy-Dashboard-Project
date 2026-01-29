import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import DoubleLineGraph from '../Graphs/DoubleLineGraph';
import { fetchGroupGanttChart } from '../../api/ganttApi';
import { mapGroupGanttSeries, resolveGranularity, todayIsoDate } from '../../mappers/ganttMapper';

export default function GroupTimelineWidget({ data }) {
  const [timeRange, setTimeRange] = useState('day');
  const [sourceData, setSourceData] = useState([]);
  const [consumptionData, setConsumptionData] = useState([]);
  const [selectedGrp, setSelectedGrp] = useState(null);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (selectedGrp === null) return;
    
    let cancelled = false;

    async function updateSourceData() {
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
        
        if (cancelled) return;
        
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
        if (cancelled) return;
        console.error('Error loading graph data', e);
        setSourceData([]);
        setConsumptionData([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    updateSourceData();

    return () => {
      cancelled = true;
    };
  }, [selectedGrp, timeRange]);

  function selectGrp(value) {
    setSelectedGrp(value);
  }

  function selectTimeRange(value) {
    setTimeRange(value);
  }

  const hasData = sourceData.length > 0 || consumptionData.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900">
            Group energy supply / consumption timeline
          </h3>
        </div>

        {/* Toggle Buttons */}
        <div className="flex items-center gap-3" style={{ marginRight: '60px' }}>
          {/* Group Selection */}
          {grpDropdownOptions.length > 0 && (
            <div className="flex gap-2">
              {grpDropdownOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => selectGrp(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedGrp === opt.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Time Range Selection */}
          <div className="flex gap-2">
            {timeDropdownOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => selectTimeRange(opt.value)}
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
        </div>
      </div>

      <div className="min-h-[200px]" style={{ padding: '0.5rem', paddingLeft: '1rem', position: 'relative', zIndex: 10 }}>
        {loading ? (
          <div className="flex items-center justify-center h-[200px] text-gray-400">
            <p className="text-sm">Loading data...</p>
          </div>
        ) : hasData ? (
          <div style={{ height: '180px', width: '100%', position: 'relative' }}>
            <DoubleLineGraph
              upperData={sourceData || []}
              lowerData={consumptionData || []}
              yAxisLabel="Electric (kW)"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
            <Activity className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">No timeline data available</p>
          </div>
        )}
      </div>
    </div>
  );
}