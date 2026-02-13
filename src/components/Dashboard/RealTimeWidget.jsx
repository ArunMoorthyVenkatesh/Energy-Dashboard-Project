// src/components/RealTimeWidget/RealTimeWidget.jsx
import { useEffect, useState, useMemo } from 'react';
import Card from '../Base/Card';
import PieGraph from '../Graphs/PieGraph';
import TimelineBarchart from '../Graphs/TimelineBarchart';
import styles from './realtimewidget.module.css';
import { formatWithCommas } from '../../utils/FormatUtil';
import Dropdown from '../Base/Dropdown';
import WeatherTempDisplay from './WeatherTempDisplay';
import { WeatherAPI } from '../../api/WeatherAPI';
import { normalizeOneCallWeather } from '../../utils/WeatherUtil';
import { fetchSiteGanttChart } from '../../api/ganttApi';
import { mapGanttToNumberArray, mapGanttToTimelineData, resolveGranularity, todayIsoDate } from '../../mappers/ganttMapper';
import { formatWithCommas, formatPercent} from '../../utils/FormatUtil';

/**
 * UI-only default data (no domain computation here).
 * Missing backend fields must be treated as 0/null to keep UI stable.
 */
const defaultData = {
  summary: {
    month_cost: null,
    avg_cost: null,
    electric_usage: null,
  },
  graph: {
    usageGraphData: Array.from({ length: 24 }).map(() => 0),
  },
  usage: {
    pvValue: null,
    batteryValue: null,
    gridValue: null,
    totalValue: null,
    pvPercentage: null,
    gridPercentage: null,
    batteryPercentage: null,
  },
};

/**
 * RealTimeWidget
 * - siteInfo: fetched from REST (nexus-management) { name, latitude, longitude }
 * - wsData: realtime payload from WebSocket (nexus-management fan-out)
 */
export default function RealTimeWidget({ wsData, siteInfo, siteId }) {
  const [timeRange, setTimeRange] = useState('day'); // day | month | lifetime
  const [data, setData] = useState(defaultData);
  const [weather, setWeather] = useState(null);
  const [energyBucket, setEnergyBucket] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // REST-based coords (no longer from wsData)
  const coords = useMemo(() => {
    const lat = parseFloat(siteInfo?.latitude);
    const lon = parseFloat(siteInfo?.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return { lat: null, lon: null };
    }

    return { lat, lon };
  }, [siteInfo?.latitude, siteInfo?.longitude]);

  // Weather fetch (client-side only), uses coords from siteInfo
  useEffect(() => {
    const STORAGE_KEY = 'data_weather_one_call_storage';

    if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lon)) return;

    // Load cached weather first (fast UI)
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        setWeather(normalizeOneCallWeather(JSON.parse(cached)));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    let cancelled = false;

    async function fetchWeather() {
      setWeatherLoading(true);
      try {
        const res = await WeatherAPI.getOneCall({
          lat: coords.lat,
          lon: coords.lon,
          units: 'metric', // IMPORTANT: return °C, not Kelvin
        });

        if (!cancelled && res?.data) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
          setWeather(normalizeOneCallWeather(res.data));
        }
      } catch (err) {
        console.error('Fetch weather failed', err);
      } finally {
        if (!cancelled) setWeatherLoading(false);
      }
    }

    fetchWeather();

    return () => {
      cancelled = true;
    };
  }, [coords.lat, coords.lon]);

  // Realtime summary mapping (keep as-is, sourced from wsData)
  useEffect(() => {
    if (!wsData) return;
    setData((prev) => ({
      ...prev,
      summary: {
        month_cost: wsData?.summary?.saving_summary?.month_saving ?? null,
        avg_cost: wsData?.summary?.saving_summary?.today_saving ?? null,
        electric_usage: wsData?.houseLoad?.daily ?? null,
      },
    }));
  }, [
    wsData?.summary?.saving_summary?.month_saving,
    wsData?.summary?.saving_summary?.today_saving,
    wsData?.houseLoad?.daily,
    wsData,
  ]);

  const dropdownOptions = [
    { value: 'day', label: 'Day' },
    { value: 'month', label: 'Month' },
    { value: 'lifetime', label: 'Lifetime' },
  ];

  function selectTimeRange(range) {
    setData((prev) => ({
      ...prev,
      graph: defaultData.graph,
    }));
    setTimeRange(range);
  }

  // REST-driven gantt chart (no computation, just mapping backend series)
  useEffect(() => {
    const granularity = resolveGranularity(timeRange);
    const date = todayIsoDate();
    if (!siteId || !granularity || !date) {
      setData((prev) => ({ ...prev, graph: { usageGraphData: [] } }));
      return;
    }

    let cancelled = false;
    async function loadGantt() {
      try {
        const series = await fetchSiteGanttChart({
          siteId,
          granularity,
          date,
          tz: 'Asia/Ho_Chi_Minh',
        });
        if (cancelled) return;
        const usageSeries = mapGanttToTimelineData(series || [], ['load']);
        setData((prev) => ({
          ...prev,
          graph: { usageGraphData: usageSeries },
        }));
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load site gantt data', err);
        setData((prev) => ({ ...prev, graph: { usageGraphData: [] } }));
      }
    }
    loadGantt();
    return () => {
      cancelled = true;
    };
  }, [siteId, timeRange]);

  // Debug wsData structure
  useEffect(() => {
    console.log('🔍 DEBUG wsData:', {
      hasWsData: !!wsData,
      hasEnergyData: !!wsData?.energyData,
      energyDataKeys: wsData?.energyData ? Object.keys(wsData.energyData) : [],
      daily: wsData?.energyData?.daily,
      monthly: wsData?.energyData?.monthly,
      lifetime: wsData?.energyData?.lifetime,
    });
  }, [wsData]);

  useEffect(() => {
    if (!wsData?.energyData) {
      setEnergyBucket(null);
      return;
    }

    let selectedBucket = null;
    if (timeRange === 'day') {
      selectedBucket = wsData.energyData.daily;
    } else if (timeRange === 'month') {
      selectedBucket = wsData.energyData.monthly;
    } else if (timeRange === 'lifetime') {
      selectedBucket = wsData.energyData.lifetime;
    }

    console.log('📊 Energy bucket data:', {
      timeRange,
      selectedBucket,
      pv: selectedBucket?.pv,
      grid_import: selectedBucket?.grid_import,
      bess: selectedBucket?.bess,
      load: selectedBucket?.load,
    });

    setEnergyBucket(selectedBucket);
  }, [timeRange, wsData?.energyData]);

  // Calculate total from components if load is missing or incorrect
  const totalLoad = useMemo(() => {
    if (!energyBucket) return null;
    
    const pv = Number(energyBucket.pv) || 0;
    const gridImport = Number(energyBucket.grid_import) || 0;
    const bess = Number(energyBucket.bess) || 0;
    const reportedLoad = Number(energyBucket.load);
    
    // Calculate expected total from components
    const calculatedTotal = pv + gridImport + bess;
    
    // Use reported load if it exists and is reasonable, otherwise use calculated
    if (Number.isFinite(reportedLoad) && reportedLoad > 0) {
      // If there's a significant mismatch, log it for debugging
      if (Math.abs(reportedLoad - calculatedTotal) > 0.01) {
        console.warn('⚠️ Load mismatch detected:', {
          reported: reportedLoad,
          calculated: calculatedTotal,
          difference: Math.abs(reportedLoad - calculatedTotal),
        });
      }
      return reportedLoad;
    }
    
    return calculatedTotal > 0 ? calculatedTotal : null;
  }, [energyBucket]);

  const pieData = [
    {
      label: 'From solar cells',
      value: Number(energyBucket?.pv) || 0,
      unit: 'kWh',
      color: 'var(--primary-blue)',
    },
    {
      label: 'From power grid',
      value: Number(energyBucket?.grid_import) || 0,
      unit: 'kWh',
      color: 'var(--primary-orange)',
    },
    {
      label: 'From battery',
      value: Number(energyBucket?.bess) || 0,
      unit: 'kWh',
      color: 'var(--primary-green)',
    },
  ];

  return (
    <Card className={styles.container}>
      <div className={styles.officeInfo}>
        <img src="toyota-logo.png" alt="toyota-logo" />
        <div className={styles.verSepLine} />
        <span className={styles.officeTitle}>
          {siteInfo?.name ?? '-'}
        </span>
      </div>

      <div className={styles.dataSection}>
        <div className={styles.dataInfo}>
          <span className={styles.dataTitle}>Estimated monthly saved</span>
          <div className={styles.dataContent}>
            <span className={styles.dataNum}>{formatWithCommas(data.summary.month_cost)}</span>
            <span className={styles.dataUnit}>Baht</span>
          </div>
        </div>

        <div className={styles.dataInfo}>
          <span className={styles.dataTitle}>Average saved</span>
          <div className={styles.dataContent}>
            <span className={styles.dataNum}>{formatWithCommas(data.summary.avg_cost)}</span>
            <span className={styles.dataUnit}>Baht/hour</span>
          </div>
        </div>

        <div className={styles.dataInfo}>
          <span className={styles.dataTitle}>Zone temperature</span>
          <WeatherTempDisplay
            main={weather?.main}
            current={weather?.current}
            min={weather?.min}
            max={weather?.max}
          />
          {weatherLoading && (
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
              Updating...
            </div>
          )}
        </div>

        <div className={styles.dataInfo}>
          <span className={styles.dataTitle}>Realtime electric usage</span>
          <div className={styles.dataContent}>
            <span className={styles.dataNum}>
              {formatWithCommas(data.summary.electric_usage)}
            </span>
            <span className={styles.dataUnit}>kW</span>
          </div>
        </div>
      </div>

      <div className={styles.electricUsageSection}>
        <div className={styles.dropdown}>
          <Dropdown
            options={dropdownOptions}
            value={timeRange}
            onChange={selectTimeRange}
          />
        </div>

        <div className={styles.usageGraph}>
          <TimelineBarchart
            key={timeRange}
            yAxisLabel="Usage (kW)"
            data={data.graph.usageGraphData}
            viewMode={timeRange}
          />
        </div>

        <div className={styles.usageSummary}>
          <div className={styles.usageTextSection}>
            <span className={styles.title}>Electric usage</span>

            <div className={styles.usageWrapper}>
              <span className={styles.usageSource}>
                <div
                  className={styles.usageColorInd}
                  style={{ background: 'var(--primary-blue)' }}
                />
                From solar cells
              </span>
              <div>
                <span className={styles.usageValue}>
                  {formatWithCommas(energyBucket?.pv)} kW
                </span>
                <span className={styles.usagePercentage}>
                  ({formatPercent(
                    energyBucket?.pv,
                    totalLoad
                  )}%)
                </span>
              </div>
            </div>

            <div className={styles.usageWrapper}>
              <div className={styles.usageSource}>
                <div
                  className={styles.usageColorInd}
                  style={{ background: 'var(--primary-orange)' }}
                />
                From power grid
              </div>
              <div>
                <span className={styles.usageValue}>
                  {formatWithCommas(energyBucket?.grid_import)} kW
                </span>
                <span className={styles.usagePercentage}>
                  ({formatPercent(
                    energyBucket?.grid_import,
                    totalLoad
                  )}%)
                </span>
              </div>
            </div>

            <div className={styles.usageWrapper}>
              <span className={styles.usageSource}>
                <div
                  className={styles.usageColorInd}
                  style={{ background: 'var(--primary-green)' }}
                />
                From battery
              </span>
              <div>
                <span className={styles.usageValue}>
                  {formatWithCommas(energyBucket?.bess)} kW
                </span>
                <span className={styles.usagePercentage}>
                  ({formatPercent(
                    energyBucket?.bess,
                    totalLoad
                  )}%)
                </span>
              </div>
            </div>
          </div>

          <div className={styles.usagePieGraph}>
            <PieGraph
              data={pieData}
              line1={
                totalLoad != null
                  ? formatWithCommas(formatWithCommas(totalLoad))
                  : '-'
              }
              line2="kW"
              line3="total usage"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}