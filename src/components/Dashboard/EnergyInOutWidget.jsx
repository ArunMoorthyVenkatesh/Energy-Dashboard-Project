import { useEffect, useRef, useState } from 'react';
import { Zap } from 'lucide-react';
import BatterySvg from '../../assets/svg/BatterySvg';
import OutletSvg from '../../assets/svg/OutletSvg';
import PowerSvg from '../../assets/svg/PowerSvg';
import RoundRightArrowSvg from '../../assets/svg/RoundRightArrowSvg';
import SolarSvg from '../../assets/svg/SolarSvg';
import { formatWithCommas } from '../../utils/FormatUtil';

const COLOR = {
  solar: '#77A668',
  battery: '#4E7EE5',
  power: '#E5A44E',
  usage: '#CE5E49',
  export: '#E5A44E',
};

// Auto-scale energy values (kW -> MW -> GW)
function autoScaleEnergy(value) {
  const numValue = parseFloat(value);
  if (!Number.isFinite(numValue)) return { value: '0.00', unit: 'kW' };
  
  const absValue = Math.abs(numValue);
  if (absValue >= 1000000) {
    return { value: formatWithCommas((numValue / 1000000).toFixed(2)), unit: 'GW' };
  } else if (absValue >= 1000) {
    return { value: formatWithCommas((numValue / 1000).toFixed(2)), unit: 'MW' };
  }
  return { value: formatWithCommas(numValue.toFixed(2)), unit: 'kW' };
}

export default function EnergyInOutWidget({ data, isExpanded = false }) {
  const containerRef = useRef(null);
  const solarRef = useRef(null);
  const batteryRef = useRef(null);
  const gridRef = useRef(null);
  const usageRef = useRef(null);
  const exportRef = useRef(null);
  const buildingRef = useRef(null);

  const [lines, setLines] = useState([]);
  const [timeRange, setTimeRange] = useState('live');

  const TIME_OPTIONS = [
    { value: 'live', label: 'Live' },
    { value: 'day', label: 'Day' },
    { value: 'month', label: 'Month' },
    { value: 'lifetime', label: 'Lifetime' },
  ];

  const safeNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  function pickLiveRow() {
    return (
      data?.power?.row ||
      data?.power?.now ||
      data?.live ||
      data?.realtime ||
      data?.real_time ||
      null
    );
  }

  function getSelectedRaw() {
    console.log('🔍 EnergyInOutWidget - timeRange:', timeRange);
    console.log('🔍 Full data structure:', data);
    
    let selectedData;
    
    if (timeRange === 'live') {
      selectedData = pickLiveRow();
      console.log('📊 Live data selected:', selectedData);
    } else {
      switch (timeRange) {
        case 'day':
          selectedData = data?.daily;
          console.log('📊 Daily data selected:', selectedData);
          break;
        case 'month':
          selectedData = data?.monthly;
          console.log('📊 Monthly data selected:', selectedData);
          break;
        case 'lifetime':
          selectedData = data?.lifetime;
          console.log('📊 Lifetime data selected:', selectedData);
          break;
        default:
          selectedData = pickLiveRow();
      }
    }
    
    return selectedData;
  }

  function normalizeFields(raw) {
    if (!raw) {
      console.log('⚠️ No raw data received');
      return { pv: 0, battery: 0, gridImport: 0, load: 0, gridExport: 0 };
    }

    console.log('🔧 Normalizing fields from:', raw);

    // ✅ FIXED: Check if values are in Watts (live) vs kW (cumulative)
    // Live data: values are in Watts (100,000+)
    // Cumulative data: values are already in kW (1-100)
    const looksLikeWatts = safeNum(raw?.solar) > 10000 || safeNum(raw?.load) > 10000;
    
    console.log('🔍 Detection:', {
      solar: raw?.solar,
      load: raw?.load,
      looksLikeWatts,
      willDivideBy1000: looksLikeWatts,
    });

    if (looksLikeWatts) {
      // Live data in Watts - convert to kW
      const batteryNet = safeNum(raw?.battery_discharge) - safeNum(raw?.battery_charge);
      const batteryValue = batteryNet !== 0 ? batteryNet : (safeNum(raw?.battery) || safeNum(raw?.bess));
      
      const normalized = {
        pv: safeNum(raw?.solar) / 1000,           // Convert Watts to kW
        battery: batteryValue / 1000,
        gridImport: safeNum(raw?.grid_import) / 1000,
        load: safeNum(raw?.load) / 1000,
        gridExport: safeNum(raw?.grid_export) / 1000,
      };
      
      console.log('✅ Normalized (from Watts):', normalized);
      return normalized;
    }

    // Day/Month/Lifetime data already in kW (or needs different handling)
    // Check if it's from the mapper (already divided by 1000)
    const alreadyInKw = safeNum(raw?.pv) > 0 || safeNum(raw?.bess) !== undefined;
    
    if (alreadyInKw) {
      // Data from mapper - already in kW with 'pv' and 'bess' fields
      const normalized = {
        pv: safeNum(raw?.pv),
        battery: safeNum(raw?.bess),
        gridImport: safeNum(raw?.grid_import),
        load: safeNum(raw?.load),
        gridExport: safeNum(raw?.grid_export),
      };
      console.log('✅ Normalized (already kW with pv/bess):', normalized);
      return normalized;
    }
    
    // Fallback: raw cumulative data in Watts with 'solar' field
    const normalized = {
      pv: safeNum(raw?.solar) / 1000,
      battery: safeNum(raw?.bess) / 1000,
      gridImport: safeNum(raw?.grid_import) / 1000,
      load: safeNum(raw?.load) / 1000,
      gridExport: safeNum(raw?.grid_export) / 1000,
    };
    console.log('✅ Normalized (from Watts, fallback):', normalized);
    return normalized;
  }

  const normalized = normalizeFields(getSelectedRaw());

  // Auto-scale all values
  const displayData = {
    pv: autoScaleEnergy(normalized.pv),
    battery: autoScaleEnergy(normalized.battery),
    gridImport: autoScaleEnergy(normalized.gridImport),
    load: autoScaleEnergy(normalized.load),
    gridExport: autoScaleEnergy(normalized.gridExport),
  };

  console.log('📺 Display data:', displayData);

  useEffect(() => {
    function updateLines() {
      if (
        !containerRef.current ||
        !solarRef.current ||
        !batteryRef.current ||
        !gridRef.current ||
        !usageRef.current ||
        !exportRef.current ||
        !buildingRef.current
      )
        return;

      const c = containerRef.current.getBoundingClientRect();
      const s = solarRef.current.getBoundingClientRect();
      const b = batteryRef.current.getBoundingClientRect();
      const g = gridRef.current.getBoundingClientRect();
      const u = usageRef.current.getBoundingClientRect();
      const e = exportRef.current.getBoundingClientRect();
      const bl = buildingRef.current.getBoundingClientRect();

      const rel = (x, y) => ({ x: x - c.left, y: y - c.top });

      setLines([
        {
          x1: rel(s.left + s.width / 2, s.bottom).x,
          y1: rel(0, s.bottom).y,
          x2: rel(bl.left + bl.width * 0.33, bl.top).x,
          y2: rel(0, bl.top).y,
          color: COLOR.solar,
        },
        {
          x1: rel(b.left + b.width / 2, b.bottom).x,
          y1: rel(0, b.bottom).y,
          x2: rel(bl.left + bl.width * 0.5, bl.top).x,
          y2: rel(0, bl.top).y,
          color: COLOR.battery,
        },
        {
          x1: rel(g.left + g.width / 2, g.bottom).x,
          y1: rel(0, g.bottom).y,
          x2: rel(bl.left + bl.width * 0.67, bl.top).x,
          y2: rel(0, bl.top).y,
          color: COLOR.power,
        },
        {
          x1: rel(bl.left + bl.width * 0.33, bl.bottom).x,
          y1: rel(0, bl.bottom).y,
          x2: rel(u.left + u.width / 2, u.top).x,
          y2: rel(0, u.top).y,
          color: COLOR.usage,
        },
        {
          x1: rel(bl.left + bl.width * 0.67, bl.bottom).x,
          y1: rel(0, bl.bottom).y,
          x2: rel(e.left + e.width / 2, e.top).x,
          y2: rel(0, e.top).y,
          color: COLOR.export,
        },
      ]);
    }

    const img = buildingRef.current;
    if (img && img.complete) updateLines();
    else if (img) img.addEventListener('load', updateLines);

    window.addEventListener('resize', updateLines);
    const ro = new ResizeObserver(updateLines);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      if (img) img.removeEventListener('load', updateLines);
      window.removeEventListener('resize', updateLines);
      ro.disconnect();
    };
  }, [timeRange, isExpanded]);

  return (
    <div 
      className="bg-white rounded-xl shadow-sm p-4 h-full flex flex-col relative"
      ref={containerRef}
    >
      {/* Header - Matching other widgets */}
      <div 
        className="flex flex-col gap-3 mb-3 pb-3 border-b border-slate-200/60 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-amber-100 to-orange-100 backdrop-blur-sm rounded-xl p-2 shadow-sm border border-amber-200/60">
            <Zap className="w-5 h-5 text-amber-600" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Energy Input & Output</h2>
        </div>

        {/* Time Range Selector - Centered */}
        <div className="flex justify-center">
          <div
            className="inline-flex items-center gap-0.5 rounded-lg bg-gradient-to-b from-slate-50 to-slate-100 p-0.5 shadow-md border border-slate-200/60"
            style={{
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.08)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {TIME_OPTIONS.map((opt) => {
              const active = timeRange === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTimeRange(opt.value)}
                  className={`relative px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                    active
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  style={
                    active
                      ? {
                          boxShadow: '0 2px 8px rgba(251, 146, 60, 0.4), 0 1px 2px rgba(0, 0, 0, 0.1)',
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

      {/* Arrows SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <defs>
          {lines.map((l, i) => (
            <marker
              key={i}
              id={`arrowhead-${i}`}
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="2.5"
              orient="auto"
            >
              <polygon points="0 0, 8 2.5, 0 5" fill={l.color} />
            </marker>
          ))}
        </defs>

        {lines.map((l, i) => (
          <line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke={l.color}
            strokeWidth={isExpanded ? '2' : '1.5'}
            strokeDasharray="5,5"
            markerEnd={`url(#arrowhead-${i})`}
          />
        ))}
      </svg>

      {/* Content */}
      <div
        className="relative flex-1 flex flex-col justify-between min-h-0 overflow-hidden"
        style={{
          zIndex: 2,
          paddingTop: isExpanded ? 30 : 6,
          paddingBottom: isExpanded ? 30 : 6,
          gap: isExpanded ? 24 : 3,
        }}
      >
        {/* Top Row - Energy Sources */}
        <div className="flex justify-between items-center mx-auto w-full max-w-[560px] flex-shrink-0">
          <ValueBlock refEl={solarRef} scaled={displayData.pv} color={COLOR.solar} isExpanded={isExpanded}>
            <SolarSvg style={{ fill: COLOR.solar }} /> solar cells
          </ValueBlock>
          <ValueBlock refEl={batteryRef} scaled={displayData.battery} color={COLOR.battery} isExpanded={isExpanded}>
            <BatterySvg style={{ fill: COLOR.battery }} /> battery
          </ValueBlock>
          <ValueBlock refEl={gridRef} scaled={displayData.gridImport} color={COLOR.power} isExpanded={isExpanded}>
            <PowerSvg style={{ fill: COLOR.power }} /> power grid
          </ValueBlock>
        </div>

        {/* Building Image */}
        <div className="flex justify-center items-center" style={{ margin: 'clamp(1rem, 3vh, 1.5rem) 0 clamp(0.25rem, 2vh, 0.75rem) 0' }}>
          <img
            ref={buildingRef}
            src="toyota_building.png"
            alt="toyota building"
            className="w-auto h-auto object-contain transition-transform hover:scale-105"
            style={{ maxWidth: '60%', maxHeight: 'clamp(120px, 25vh, 220px)' }}
          />
        </div>

        {/* Bottom Row - Usage & Export */}
        <div className="flex justify-between items-center mx-auto w-full max-w-[560px] flex-shrink-0" style={{ gap: 'clamp(2rem, 10vw, 4rem)' }}>
          <ValueBlock refEl={usageRef} scaled={displayData.load} color={COLOR.usage} isExpanded={isExpanded}>
            <OutletSvg style={{ fill: COLOR.usage }} /> usage
          </ValueBlock>
          <ValueBlock refEl={exportRef} scaled={displayData.gridExport} color={COLOR.export} isExpanded={isExpanded}>
            <RoundRightArrowSvg style={{ fill: COLOR.export }} /> export
          </ValueBlock>
        </div>
      </div>
    </div>
  );
}

/* ---------- Value Block Component ---------- */
function ValueBlock({ refEl, scaled, color, children, isExpanded = false }) {
  const valueFontSize = isExpanded ? 'clamp(1.125rem, 2cqh, 1.5rem)' : 'clamp(0.85rem, 1.5cqh, 1rem)';
  const unitFontSize = isExpanded ? 'clamp(0.75rem, 1.4cqh, 0.875rem)' : 'clamp(0.6rem, 1.1cqh, 0.7rem)';
  const labelFontSize = isExpanded ? 'clamp(0.75rem, 1.4cqh, 0.875rem)' : 'clamp(0.65rem, 1.2cqh, 0.75rem)';
  
  return (
    <div 
      ref={refEl} 
      className="flex flex-col items-center text-center justify-center"
      style={{ 
        color, 
        minHeight: isExpanded ? '60px' : '40px'
      }}
    >
      {/* Value */}
      <span
        style={{
          fontSize: valueFontSize,
          fontWeight: 900,
          marginBottom: '2px',
          color: '#000',
          lineHeight: 1.1,
        }}
      >
        {scaled.value}{' '}
        <span
          style={{
            fontSize: unitFontSize,
            fontWeight: 700,
            color: '#475569',
          }}
        >
          {scaled.unit}
        </span>
      </span>

      {/* Icon + Label */}
      <div
        className="flex items-center justify-center gap-1"
        style={{
          fontSize: labelFontSize,
          fontWeight: 600,
          color: '#000',
        }}
      >
        {children}
      </div>
    </div>
  );
}