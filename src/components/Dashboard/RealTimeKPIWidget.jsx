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

  const summary = useMemo(() => ({
    monthSaving: safeNumber(wsData?.summary?.saving_summary?.month_saving, 0),
    avgSaving: safeNumber(wsData?.summary?.saving_summary?.today_saving, 0),
    electricUsage: safeNumber(wsData?.houseLoad?.daily, 0),
  }), [wsData]);

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
      <div className="flex items-center justify-between pb-6 border-b border-gray-100 mb-6">
        <div className="flex items-center gap-4">
          <img src={toyotaLogoSrc} alt="Toyota logo" className="h-8 w-auto" />
          <div className="w-px h-8 bg-gray-300" />
          <h2 className="text-lg font-bold text-gray-900">{siteInfo?.name || 'Site'}</h2>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Monthly Saved */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-900">Monthly Saved</span>
          </div>
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="font-bold text-blue-900" style={{ fontSize: 'clamp(0.875rem, 2vw, 1.25rem)' }}>
              {formatWithCommas(summary.monthSaving)}
            </span>
            <span className="text-xs text-blue-700 whitespace-nowrap">Baht</span>
          </div>
        </div>

        {/* Avg Saved */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-900">Avg Saved</span>
          </div>
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="font-bold text-green-900" style={{ fontSize: 'clamp(0.875rem, 2vw, 1.25rem)' }}>
              {formatWithCommas(summary.avgSaving)}
            </span>
            <span className="text-xs text-green-700 whitespace-nowrap">Baht/hr</span>
          </div>
        </div>

        {/* Temperature */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-medium text-amber-900">Temperature</span>
          </div>
          <div className="flex items-center gap-2" style={{ color: '#000000', fontSize: 'clamp(0.875rem, 2vw, 1.25rem)', fontWeight: 700 }}>
            <WeatherTempDisplay
              main={weather?.main}
              current={weather?.current}
              min={weather?.min}
              max={weather?.max}
            />
            {weatherLoading && <span className="text-xs text-amber-600">Updating...</span>}
          </div>
        </div>

        {/* Current Usage */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-900">Current Usage</span>
          </div>
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="font-bold text-purple-900" style={{ fontSize: 'clamp(0.875rem, 2vw, 1.25rem)' }}>
              {formatWithCommas(summary.electricUsage)}
            </span>
            <span className="text-xs text-purple-700 whitespace-nowrap">kW</span>
          </div>
        </div>
      </div>
    </div>
  );
}