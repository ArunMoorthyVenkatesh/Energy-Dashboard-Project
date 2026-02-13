import { useEffect, useRef, useState } from 'react';
import { Zap } from 'lucide-react';
import BatterySvg from '../../assets/svg/BatterySvg';
import OutletSvg from '../../assets/svg/OutletSvg';
import PowerSvg from '../../assets/svg/PowerSvg';
import RoundRightArrowSvg from '../../assets/svg/RoundRightArrowSvg';
import SolarSvg from '../../assets/svg/SolarSvg';
import { formatWithCommas } from '../../utils/FormatUtil';
import { useIsMobile } from '../../hooks/useMediaQuery';

const COLOR = {
  solar: '#77A668',
  battery: '#4E7EE5',
  power: '#E5A44E',
  usage: '#CE5E49',
  export: '#E5A44E',
};

// Auto-scale energy values with proper units (kW/kWh -> MW/MWh -> GW/GWh)
function autoScaleEnergy(value, isEnergy = false) {
  const numValue = parseFloat(value);
  if (!Number.isFinite(numValue)) return { value: '0.00', unit: isEnergy ? 'kWh' : 'kW' };
  
  const absValue = Math.abs(numValue);
  if (absValue >= 1000000) {
    return { 
      value: formatWithCommas((numValue / 1000000).toFixed(2)), 
      unit: isEnergy ? 'GWh' : 'GW' 
    };
  } else if (absValue >= 1000) {
    return { 
      value: formatWithCommas((numValue / 1000).toFixed(2)), 
      unit: isEnergy ? 'MWh' : 'MW' 
    };
  }
  return { 
    value: formatWithCommas(numValue.toFixed(2)), 
    unit: isEnergy ? 'kWh' : 'kW' 
  };
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
  const isMobile = useIsMobile();

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

  function selectTimeRange(range) {
    setTimeRange(range);
  }

  function getData() {
    let selectedData;
    
    // ✅ Handle Live mode separately
    if (timeRange === 'live') {
      // Live data from power.now or power.row
      selectedData = data?.power?.now || data?.power?.row || null;
      
      if (selectedData) {
        // Live data is in Watts, convert to kW
        return {
          pv: safeNum(selectedData.solar),
          battery: (safeNum(selectedData.battery_discharge) - safeNum(selectedData.battery_charge)),
          gridImport: safeNum(selectedData.grid_import),
          load: safeNum(selectedData.load),
          gridExport: safeNum(selectedData.grid_export),
        };
      }
    }
    
    // ✅ Day/Month/Lifetime from energyData (already in kW from mapper)
    switch (timeRange) {
      case 'day':
        selectedData = data?.daily;
        break;
      case 'month':
        selectedData = data?.monthly;
        break;
      case 'lifetime':
        selectedData = data?.lifetime;
        break;
      default:
        selectedData = data?.daily;
    }

    // Data from mapper is already in kW with pv/bess fields
    return {
      pv: safeNum(selectedData?.pv),
      battery: safeNum(selectedData?.bess),
      gridImport: safeNum(selectedData?.grid_import),
      load: safeNum(selectedData?.load),
      gridExport: safeNum(selectedData?.grid_export),
    };
  }

  const rawData = getData();

  // Determine if we're showing energy (kWh) or power (kW)
  const isEnergy = timeRange !== 'live';

  // Auto-scale all values with appropriate units
  const displayData = {
    pv: autoScaleEnergy(rawData.pv, isEnergy),
    battery: autoScaleEnergy(rawData.battery, isEnergy),
    gridImport: autoScaleEnergy(rawData.gridImport, isEnergy),
    load: autoScaleEnergy(rawData.load, isEnergy),
    gridExport: autoScaleEnergy(rawData.gridExport, isEnergy),
  };

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
      className="h-full flex flex-col relative p-2 sm:p-4"
      ref={containerRef}
    >
      {/* Header - Matching other widgets */}
      <div
        className="flex flex-col gap-2 sm:gap-3 mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-slate-200/60 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-gradient-to-br from-amber-100 to-orange-100 backdrop-blur-sm rounded-lg sm:rounded-xl p-1.5 sm:p-2 shadow-sm border border-amber-200/60 flex-shrink-0">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900">Energy Input & Output</h2>
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
                  onClick={() => selectTimeRange(opt.value)}
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

      {/* Arrows SVG - Hidden on mobile */}
      {!isMobile && (
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
      )}

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
        <div className="flex flex-col md:flex-row justify-between items-center mx-auto w-full max-w-[560px] flex-shrink-0 gap-3 md:gap-4">
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
            style={{ maxWidth: '50%', maxHeight: 'clamp(80px, 20vh, 220px)' }}
          />
        </div>

        {/* Bottom Row - Usage & Export */}
        <div className="flex flex-col sm:flex-row justify-between items-center mx-auto w-full max-w-[560px] flex-shrink-0 gap-3 md:gap-8">
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