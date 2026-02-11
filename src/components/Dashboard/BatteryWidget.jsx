import { autoScalePower, autoScaleEnergy } from '../../utils/FormatUtil';
import { Battery } from 'lucide-react';

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

export default function BatteryWidget({ data }) {
  const device = data ?? null;
  const statusStyle = STATUS_CONFIG[device?.status] || STATUS_CONFIG.inactive;
  const statusLabel = device?.status === 'active' ? 'Active' : 'Inactive';

  const energyToday = autoScaleEnergy(device?.power?.day?.import_kwh || 0);
  const energyMonthly = autoScaleEnergy(device?.power?.month?.import_kwh || 0);
  const energyLifetime = autoScaleEnergy(device?.power?.lifetime?.import_kwh || 0);
  const currentPower = autoScalePower(device?.power?.now?.import_kw || 0);
  const batteryLevel = device?.power?.now?.soc;

  return (
    <div className="h-full flex items-center gap-3 px-2">
      {/* Battery Icon with Status Badge - Left Side */}
      <div className="flex-shrink-0 flex items-center justify-center relative">
        <div className="relative">
          <Battery
            className="w-24 h-24 text-slate-700"
            strokeWidth={1.5}
          />
          {batteryLevel != null && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-black text-slate-900">
                {batteryLevel}%
              </span>
            </div>
          )}
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
        <MetricCard
          title="Today"
          value={energyToday.value}
          unit={energyToday.unit}
          bgColor="from-blue-50 to-cyan-50"
          borderColor="border-blue-200/70"
          textColor="text-blue-900"
        />
        <MetricCard
          title="Monthly"
          value={energyMonthly.value}
          unit={energyMonthly.unit}
          bgColor="from-emerald-50 to-teal-50"
          borderColor="border-emerald-200/70"
          textColor="text-emerald-900"
        />
        <MetricCard
          title="Lifetime"
          value={energyLifetime.value}
          unit={energyLifetime.unit}
          bgColor="from-purple-50 to-fuchsia-50"
          borderColor="border-purple-200/70"
          textColor="text-purple-900"
        />
        <MetricCard
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

function MetricCard({ title, value, unit, bgColor, borderColor, textColor }) {
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