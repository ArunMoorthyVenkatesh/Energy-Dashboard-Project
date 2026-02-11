import { autoScalePower, autoScaleEnergy } from '../../utils/FormatUtil';

const STATUS_CONFIG = {
  active: {
    fg: '#059669',
    bg: '#d1fae5',
    borderColor: '#10b981',
  },
  inactive: {
    fg: '#64748b',
    bg: '#f1f5f9',
    borderColor: '#94a3b8',
  },
};

export default function SolarPanelWidget({ data }) {
  const device = data ?? null;
  const statusStyle = STATUS_CONFIG[device?.status] || STATUS_CONFIG.inactive;
  const statusLabel = device?.status === 'active' ? 'Active' : 'Inactive';

  const yieldToday = autoScaleEnergy(device?.power?.day?.import_kwh || 0);
  const yieldMonthly = autoScaleEnergy(device?.power?.month?.import_kwh || 0);
  const yieldLifetime = autoScaleEnergy(device?.power?.lifetime?.import_kwh || 0);
  const currentPower = autoScalePower(device?.power?.now?.import_kw || 0);

  return (
    <div className="h-full flex items-center gap-3 px-2">
      {/* Solar Panel Image with Status Badge - Left Side */}
      <div className="flex-shrink-0 flex items-center justify-center relative">
        <img
          src="solar_panel.png"
          alt="Solar Panel"
          className="w-24 h-24 object-contain"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div className="hidden w-24 h-24 items-center justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
        {/* Status Badge */}
        <div
          className="absolute -top-1 -right-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-xs shadow-md border-2"
          style={{
            backgroundColor: statusStyle.bg,
            color: statusStyle.fg,
            borderColor: statusStyle.borderColor,
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: statusStyle.fg }}
          />
          <span>{statusLabel}</span>
        </div>
      </div>

      {/* Metrics - Stacked Vertically on Right */}
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <InfoMetric
          title="Today"
          value={yieldToday.value}
          unit={yieldToday.unit}
          bgColor="from-blue-50 to-cyan-50"
          borderColor="border-blue-200/70"
          textColor="text-blue-900"
        />
        <InfoMetric
          title="Monthly"
          value={yieldMonthly.value}
          unit={yieldMonthly.unit}
          bgColor="from-emerald-50 to-teal-50"
          borderColor="border-emerald-200/70"
          textColor="text-emerald-900"
        />
        <InfoMetric
          title="Lifetime"
          value={yieldLifetime.value}
          unit={yieldLifetime.unit}
          bgColor="from-purple-50 to-fuchsia-50"
          borderColor="border-purple-200/70"
          textColor="text-purple-900"
        />
        <InfoMetric
          title="Power"
          value={currentPower.value}
          unit={currentPower.unit}
          bgColor="from-amber-50 to-orange-50"
          borderColor="border-amber-200/70"
          textColor="text-amber-900"
        />
      </div>
    </div>
  );
}

function InfoMetric({ title, value, unit, bgColor, borderColor, textColor }) {
  return (
    <div
      className={`bg-gradient-to-br ${bgColor} rounded-lg px-3 py-1.5 border ${borderColor} shadow-sm hover:shadow transition-all duration-200 flex items-center justify-between`}
    >
      <div className="text-xs font-bold text-slate-700">{title}</div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-base font-black ${textColor}`}>{value}</span>
        {unit && <span className="text-xs font-bold text-slate-600">{unit}</span>}
      </div>
    </div>
  );
}