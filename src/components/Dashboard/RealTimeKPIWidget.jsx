import { useEffect, useState, useMemo } from 'react';
import { TrendingUp, Zap, DollarSign, Thermometer } from 'lucide-react';
import { formatWithCommas } from '../../utils/FormatUtil';
import WeatherTempDisplay from './WeatherTempDisplay';
import { WeatherAPI } from '../../api/WeatherAPI';
import { normalizeOneCallWeather } from '../../utils/WeatherUtil';

/* ---------------------------
 * CONSTANTS
 * --------------------------- */

const STORAGE_KEY = 'data_weather_one_call_storage';

/* ---------------------------
 * HELPERS
 * --------------------------- */

function safeNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Auto-scale energy values (kWh -> MWh -> GWh)
function autoScaleEnergy(value) {
  const numValue = parseFloat(value);
  if (!Number.isFinite(numValue)) return { value: '0.00', unit: 'kWh' };
  
  const absValue = Math.abs(numValue);
  if (absValue >= 1000000) {
    return { value: formatWithCommas(numValue / 1000000), unit: 'GWh' };
  } else if (absValue >= 1000) {
    return { value: formatWithCommas(numValue / 1000), unit: 'MWh' };
  }
  return { value: formatWithCommas(numValue), unit: 'kWh' };
}

// Auto-scale currency values (Baht -> KBaht -> MBaht)
function autoScaleBaht(value) {
  const numValue = parseFloat(value);
  if (!Number.isFinite(numValue)) return { value: '0.00', unit: 'Baht' };
  
  const absValue = Math.abs(numValue);
  if (absValue >= 1000000) {
    return { value: formatWithCommas(numValue / 1000000), unit: 'MBaht' };
  } else if (absValue >= 1000) {
    return { value: formatWithCommas(numValue / 1000), unit: 'KBaht' };
  }
  return { value: formatWithCommas(numValue), unit: 'Baht' };
}

/* ---------------------------
 * COMPONENT
 * --------------------------- */

export default function RealTimeKPIWidget({ wsData, siteInfo }) {
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const coords = useMemo(() => {
    const lat = parseFloat(siteInfo?.latitude);
    const lon = parseFloat(siteInfo?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return { lat: null, lon: null };
    return { lat, lon };
  }, [siteInfo?.latitude, siteInfo?.longitude]);

  const summary = useMemo(() => {
    const monthSaving = safeNumber(wsData?.summary?.saving_summary?.month_saving, 0);
    const avgSaving = safeNumber(wsData?.summary?.saving_summary?.today_saving, 0);
    const electricUsage = safeNumber(wsData?.houseLoad?.daily, 0);
    
    const scaledMonthSaving = autoScaleBaht(monthSaving);
    const scaledAvgSaving = autoScaleBaht(avgSaving);
    const scaledUsage = autoScaleEnergy(electricUsage);
    
    return {
      monthSaving,
      avgSaving,
      electricUsage,
      scaledMonthSaving,
      scaledAvgSaving,
      scaledUsage,
    };
  }, [wsData]);

  /* ---------------------------
   * WEATHER FETCH
   * --------------------------- */
  useEffect(() => {
    if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lon)) return;

    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        setWeather(normalizeOneCallWeather(JSON.parse(cached)));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    const controller = new AbortController();

    (async () => {
      setWeatherLoading(true);
      try {
        const res = await WeatherAPI.getOneCall({
          lat: coords.lat,
          lon: coords.lon,
          units: 'metric',
          signal: controller.signal,
        });

        if (res?.data?.current) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
          setWeather(normalizeOneCallWeather(res.data));
        } else {
          console.warn('Invalid weather response');
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Weather fetch failed', err);
      } finally {
        setWeatherLoading(false);
      }
    })();

    return () => controller.abort();
  }, [coords.lat, coords.lon]);

  const toyotaLogoSrc = `${process.env.PUBLIC_URL}/toyota-logo.png`;

  /* ---------------------------
   * RENDER
   * --------------------------- */
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200/60 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-sm border border-slate-200/60">
            <img src={toyotaLogoSrc} alt="Toyota logo" className="h-8 w-auto" />
          </div>
          <div className="w-px h-8 bg-slate-300" />
          <h2 className="text-lg font-bold text-slate-900">{siteInfo?.name || 'Site'}</h2>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Monthly Saved */}
        <div className="bg-gradient-to-br from-blue-100 via-indigo-100 to-violet-100 rounded-lg p-4 border-2 border-blue-300/60 hover:border-blue-400 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-white/90 rounded-lg shadow-sm">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-slate-900">Monthly Saved</span>
          </div>
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="font-black text-slate-900" style={{ fontSize: 'clamp(0.875rem, 2vw, 1.25rem)' }}>
              {summary.scaledMonthSaving.value}
            </span>
            <span className="text-xs text-slate-700 font-bold whitespace-nowrap">{summary.scaledMonthSaving.unit}</span>
          </div>
        </div>

        {/* Avg Saved */}
        <div className="bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100 rounded-lg p-4 border-2 border-emerald-300/60 hover:border-emerald-400 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-white/90 rounded-lg shadow-sm">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-slate-900">Avg Saved</span>
          </div>
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="font-black text-slate-900" style={{ fontSize: 'clamp(0.875rem, 2vw, 1.25rem)' }}>
              {summary.scaledAvgSaving.value}
            </span>
            <span className="text-xs text-slate-700 font-bold whitespace-nowrap">{summary.scaledAvgSaving.unit}/hr</span>
          </div>
        </div>

        {/* Temperature */}
        <div className="bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100 rounded-lg p-4 border-2 border-orange-300/60 hover:border-orange-400 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-white/90 rounded-lg shadow-sm">
              <Thermometer className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-xs font-bold text-slate-900">Temperature</span>
          </div>
          <div className="flex items-center gap-2" style={{ color: '#0f172a', fontSize: 'clamp(0.875rem, 2vw, 1.25rem)', fontWeight: 900 }}>
            <WeatherTempDisplay
              main={weather?.main}
              current={weather?.current}
              min={weather?.min}
              max={weather?.max}
            />
            {weatherLoading && <span className="text-xs text-orange-700 font-semibold">Updating...</span>}
          </div>
        </div>

        {/* Current Usage */}
        <div className="bg-gradient-to-br from-purple-100 via-fuchsia-100 to-pink-100 rounded-lg p-4 border-2 border-purple-300/60 hover:border-purple-400 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-white/90 rounded-lg shadow-sm">
              <Zap className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xs font-bold text-slate-900">Current Usage</span>
          </div>
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="font-black text-slate-900" style={{ fontSize: 'clamp(0.875rem, 2vw, 1.25rem)' }}>
              {summary.scaledUsage.value}
            </span>
            <span className="text-xs text-slate-700 font-bold whitespace-nowrap">{summary.scaledUsage.unit}</span>
          </div>
        </div>
      </div>
    </div>
  );
}