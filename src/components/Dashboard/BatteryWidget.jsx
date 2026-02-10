import { formatWithCommas } from '../../utils/FormatUtil';

export default function BatteryWidget({ data }) {
  const device = data ?? null;

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

  const isActive = device?.status === 'active';
  const statusLabel = isActive ? 'Active' : 'Inactive';
  const statusStyle = STATUS_CONFIG[device?.status] || STATUS_CONFIG.inactive;

  return (
    <div className="h-full flex flex-col gap-1.5 p-1.5 pt-4 overflow-hidden">
      {/* Status Badge */}
      <div className="flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-bold text-slate-900 truncate">
          {device?.name ?? 'Device unavailable'}
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
          <span>{statusLabel}</span>
        </div>
      </div>

      {/* Device Info Grid */}
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <div className="grid grid-cols-2 gap-1.5">
          <MetricCard
            title="Device ID"
            value={device?.deviceId || '-'}
            unit=""
            bgColor="from-emerald-100 to-teal-100"
            borderColor="border-emerald-300/60"
          />
          <MetricCard
            title="Site ID"
            value={device?.siteId || '-'}
            unit=""
            bgColor="from-blue-100 to-cyan-100"
            borderColor="border-blue-300/60"
          />
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <MetricCard
            title="Type"
            value={device?.deviceType || '-'}
            unit=""
            bgColor="from-orange-100 to-amber-100"
            borderColor="border-orange-300/60"
          />
          <MetricCard
            title="Role"
            value={device?.energy?.role || '-'}
            unit=""
            bgColor="from-purple-100 to-fuchsia-100"
            borderColor="border-purple-300/60"
          />
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <MetricCard
            title="Direction"
            value={device?.energy?.direction || '-'}
            unit=""
            bgColor="from-rose-100 to-pink-100"
            borderColor="border-rose-300/60"
          />
          <MetricCard
            title="Source"
            value={device?.energy?.source || '-'}
            unit=""
            bgColor="from-green-100 to-lime-100"
            borderColor="border-green-300/60"
          />
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-1.5 border border-slate-200/60">
            <div className="text-xs font-semibold text-slate-600 mb-0.5">Created</div>
            <div className="text-xs text-slate-500 truncate">
              {device?.createdAt ? new Date(device.createdAt).toLocaleDateString() : '-'}
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-1.5 border border-slate-200/60">
            <div className="text-xs font-semibold text-slate-600 mb-0.5">Updated</div>
            <div className="text-xs text-slate-500 truncate">
              {device?.updatedAt ? new Date(device.updatedAt).toLocaleDateString() : '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, unit, bgColor, borderColor }) {
  return (
    <div className={`bg-gradient-to-br ${bgColor} rounded-lg p-1.5 border-2 ${borderColor} shadow-sm hover:shadow-md transition-all duration-200`}>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-slate-700 truncate">{title}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-black text-slate-900 truncate">{value}</span>
          {unit && <span className="text-xs font-bold text-slate-600">{unit}</span>}
        </div>
      </div>
    </div>
  );
}