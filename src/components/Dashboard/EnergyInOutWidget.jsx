import { useEffect, useRef, useState } from 'react';
import { Zap } from 'lucide-react';
import BatterySvg from '../../assets/svg/BatterySvg';
import OutletSvg from '../../assets/svg/OutletSvg';
import PowerSvg from '../../assets/svg/PowerSvg';
import RoundRightArrowSvg from '../../assets/svg/RoundRightArrowSvg';
import SolarSvg from '../../assets/svg/SolarSvg';
import styles from './energyinoutwidget.module.css';
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
    return { value: formatWithCommas(numValue / 1000000), unit: 'GW' };
  } else if (absValue >= 1000) {
    return { value: formatWithCommas(numValue / 1000), unit: 'MW' };
  }
  return { value: formatWithCommas(numValue), unit: 'kW' };
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
    if (timeRange === 'live') return pickLiveRow();

    switch (timeRange) {
      case 'day':
        return data?.daily ?? null;
      case 'month':
        return data?.monthly ?? null;
      case 'lifetime':
        return data?.lifetime ?? null;
      default:
        return pickLiveRow();
    }
  }

  function normalizeFields(raw) {
    if (!raw)
      return { pv: 0, battery: 0, gridImport: 0, load: 0, gridExport: 0 };

    const looksLive =
      raw?.solar !== undefined ||
      raw?.grid_import !== undefined ||
      raw?.grid_export !== undefined ||
      raw?.battery_charge !== undefined ||
      raw?.battery !== undefined;

    if (looksLive) {
      return {
        pv: safeNum(raw?.solar),
        battery: safeNum(raw?.battery_charge ?? raw?.battery ?? raw?.bess),
        gridImport: safeNum(raw?.grid_import),
        load: safeNum(raw?.load),
        gridExport: safeNum(raw?.grid_export),
      };
    }

    return {
      pv: safeNum(raw?.pv),
      battery: safeNum(raw?.bess),
      gridImport: safeNum(raw?.grid_import),
      load: safeNum(raw?.load),
      gridExport: safeNum(raw?.grid_export),
    };
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

  const rowGap = isExpanded ? 24 : 3;
  const headerMargin = isExpanded ? 20 : 4;
  const contentPaddingTop = isExpanded ? 30 : 6;
  const contentPaddingBottom = isExpanded ? 30 : 6;

  return (
    <div
      className={styles.container}
      ref={containerRef}
    >
      {/* Header */}
      <div style={{ flexShrink: 0, marginBottom: headerMargin, padding: '0 12px' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 bg-gradient-to-br from-amber-50 to-orange-100 rounded-lg shadow-sm border border-amber-200/60">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <h3 className="text-xs font-bold text-slate-900">
            Energy input &amp; output
          </h3>
        </div>

        <div className="flex justify-center">
          <div
            className="inline-flex items-center gap-0.5 rounded-lg bg-gradient-to-b from-slate-50 to-slate-100 p-0.5 shadow-md border border-slate-200/60"
            style={{
              boxShadow:
                'inset 0 1px 2px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.08)',
            }}
            aria-label="Select time range"
          >
            {TIME_OPTIONS.map((opt) => {
              const active = timeRange === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTimeRange(opt.value)}
                  aria-pressed={active}
                  className={`relative px-2.5 py-1 rounded-md text-[10px] font-bold transition-all duration-200 whitespace-nowrap ${
                    active
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  style={
                    active
                      ? {
                          boxShadow:
                            '0 2px 8px rgba(251, 146, 60, 0.4), 0 1px 2px rgba(0, 0, 0, 0.1)',
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

      {/* Arrows */}
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
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 0,
          overflow: 'hidden',
          paddingTop: contentPaddingTop,
          paddingBottom: contentPaddingBottom,
          gap: rowGap,
          transformOrigin: 'center top',
        }}
      >
        <div className={styles.row} style={{ flexShrink: 0 }}>
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

        <div className={styles.buildingImage}>
          <img
            ref={buildingRef}
            src="toyota_building.png"
            alt="toyota building"
          />
        </div>

        <div className={styles.row} style={{ flexShrink: 0 }}>
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

/* ---------- helper ---------- */
function ValueBlock({ refEl, scaled, color, children, isExpanded = false }) {
  const valueFontSize = isExpanded ? 'clamp(1.125rem, 2cqh, 1.5rem)' : 'clamp(0.85rem, 1.5cqh, 1rem)';
  const unitFontSize = isExpanded ? 'clamp(0.75rem, 1.4cqh, 0.875rem)' : 'clamp(0.6rem, 1.1cqh, 0.7rem)';
  const labelFontSize = isExpanded ? 'clamp(0.75rem, 1.4cqh, 0.875rem)' : 'clamp(0.65rem, 1.2cqh, 0.75rem)';
  
  return (
    <div ref={refEl} className={styles.infoWrapper} style={{ color, minHeight: isExpanded ? '60px' : '40px', justifyContent: 'center' }}>
      <span
        className={styles.infoValue}
        style={{
          fontSize: valueFontSize,
          fontWeight: 900,
          marginBottom: '2px',
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

      <div
        className={styles.energySource}
        style={{
          fontSize: labelFontSize,
          fontWeight: 600,
        }}
      >
        {children}
      </div>
    </div>
  );
}