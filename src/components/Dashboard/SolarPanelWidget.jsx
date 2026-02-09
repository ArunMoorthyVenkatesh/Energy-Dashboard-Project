import { formatFixed2 } from '../../utils/FormatUtil';

const STATUS_CONFIG = {
  Online: {
    fg: '#059669',
    bg: '#d1fae5',
    borderColor: '#10b981',
  },
  Offline: {
    fg: '#64748b',
    bg: '#f1f5f9',
    borderColor: '#94a3b8',
  },
};

// Helper function to format and scale energy values
function formatEnergy(kwh) {
  if (kwh == null || !Number.isFinite(Number(kwh))) {
    return { value: '-', unit: 'kWh' };
  }

  const value = Number(kwh);

  if (value < 1000) {
    return { value: formatFixed2(value), unit: 'kWh' };
  }
  return { value: formatFixed2(value / 1000), unit: 'MWh' };
}

/**
 * data: solar device object (from /devices or mapped WS)
 * energyData: wsData.energyData (daily/monthly/lifetime totals)
 */
export default function SolarPanelWidget({ data, energyData }) {
  const pv = data ?? null;

  // Status: support multiple shapes
  const pvOnline =
    pv?.power?.now?.online === true ||
    pv?.status === 'normal' ||
    pv?.status === 'active' ||
    pv?.status === 'Online';

  const pvStatus = pvOnline ? 'Online' : 'Offline';
  const statusStyle = STATUS_CONFIG[pvStatus];

  // ✅ Yield values priority:
  // 1) pv.power.*.import_kwh (if exists)
  // 2) energyData.*.solar (your WS/site totals)
  const todayKwh =
    pv?.power?.day?.import_kwh ??
    energyData?.daily?.solar ??
    energyData?.day?.solar;

  const monthKwh =
    pv?.power?.month?.import_kwh ??
    energyData?.monthly?.solar ??
    energyData?.month?.solar;

  const lifetimeKwh =
    pv?.power?.lifetime?.import_kwh ??
    energyData?.lifetime?.solar;

  const yieldToday = formatEnergy(todayKwh);
  const yieldMonth = formatEnergy(monthKwh);
  const yieldLifetime = formatEnergy(lifetimeKwh);

  return (
    <div className="h-full flex flex-col gap-1.5 p-1.5 pt-4 overflow-hidden">
      {/* Status Badge */}
      <div className="flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-bold text-slate-900 truncate">
          {pv?.name ?? 'PV unavailable'}
        </span>
        <div
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-xs shadow-sm border-2 transition-all duration-200 flex-shrink-0"
          style={{
            backgroundColor: statusStyle.bg,
            color: statusStyle.fg,
            borderColor: statusStyle.borderColor,
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse shadow-sm"
            style={{ backgroundColor: statusStyle.fg }}
          />
          <span>{pvStatus}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-row gap-3 min-h-0 overflow-hidden">
        {/* Panel Section */}
        <div className="flex flex-col items-center justify-center w-20 flex-shrink-0">
          <div className="w-full flex items-center justify-center">
            <img
              src="solar_panel.png"
              alt="solar_panel"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>

        {/* Yield Section */}
        <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
          <YieldMetric
            title="Yield today"
            value={yieldToday.value}
            unit={yieldToday.unit}
            bgColor="from-blue-100 to-cyan-100"
            borderColor="border-blue-300/60"
          />
          <YieldMetric
            title="Yield monthly"
            value={yieldMonth.value}
            unit={yieldMonth.unit}
            bgColor="from-emerald-100 to-teal-100"
            borderColor="border-emerald-300/60"
          />
          <YieldMetric
            title="Yield lifetime"
            value={yieldLifetime.value}
            unit={yieldLifetime.unit}
            bgColor="from-purple-100 to-fuchsia-100"
            borderColor="border-purple-300/60"
          />
        </div>
      </div>
    </div>
  );
}

function YieldMetric({ title, value, unit, bgColor, borderColor }) {
  return (
    <div
      className={`bg-gradient-to-br ${bgColor} rounded-lg p-1.5 border-2 ${borderColor} shadow-sm hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">{title}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-black text-slate-900">{value}</span>
          <span className="text-xs font-bold text-slate-600">{unit}</span>
        </div>
      </div>
    </div>
  );
}
