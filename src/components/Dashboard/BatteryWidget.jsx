import PieGraph from '../Graphs/PieGraph';
import { formatWithCommas } from '../../utils/FormatUtil';

export default function BatteryWidget({ data }) {
  const battery = data ?? null;

  // Match old code data structure
  const chargePercentage =
    Number.isFinite(Number(battery?.battery_percent))
      ? Number(battery.battery_percent)
      : 0;

  const pieData = [
    {
      label: 'Empty',
      value: 100 - chargePercentage,
      unit: '%',
      color: '#e2e8f0',
    },
    {
      label: 'Charged',
      value: chargePercentage,
      unit: '%',
      color: '#10b981',
    },
  ];

  const isDischarging =
    Number.isFinite(Number(battery?.active_power)) &&
    Number(battery.active_power) < 0;

  return (
    <div className="h-full flex flex-row gap-3 p-1.5 pt-4 overflow-hidden">
      {/* Metrics Section - Ultra Compact */}
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        {/* Row 1: Voltage, Current, Temperature */}
        <div className="grid grid-cols-3 gap-1.5">
          <MetricCard
            title="Voltage"
            value={formatWithCommas(battery?.voltage)}
            unit="V"
            bgColor="from-emerald-100 to-teal-100"
            borderColor="border-emerald-300/60"
          />
          <MetricCard
            title="Current"
            value={formatWithCommas(battery?.current)}
            unit="A"
            bgColor="from-blue-100 to-cyan-100"
            borderColor="border-blue-300/60"
          />
          <MetricCard
            title="Temp"
            value={formatWithCommas(battery?.temperature)}
            unit="°C"
            bgColor="from-orange-100 to-amber-100"
            borderColor="border-orange-300/60"
          />
        </div>

        {/* Row 2: Power */}
        <div className="bg-gradient-to-br from-purple-100 to-fuchsia-100 rounded-lg p-1.5 border-2 border-purple-300/60 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <span className="text-xs font-semibold text-slate-700">Power</span>
            <div className="flex items-baseline gap-1">
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black text-slate-900">
                  {formatWithCommas(battery?.active_power)}
                </span>
                <span className="text-xs font-bold text-slate-600">kW</span>
              </div>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${
                isDischarging 
                  ? 'bg-red-500 text-white border-red-600' 
                  : 'bg-green-500 text-white border-green-600'
              }`}>
                {isDischarging ? 'discharge' : 'charge'}
              </span>
            </div>
          </div>
        </div>

        {/* Row 3: Daily, Monthly, Lifetime */}
        <div className="grid grid-cols-3 gap-1.5">
          <MetricCard
            title="Daily"
            value={formatWithCommas(battery?.daily)}
            unit="kWh"
            bgColor="from-rose-100 to-pink-100"
            borderColor="border-rose-300/60"
          />
          <MetricCard
            title="Monthly"
            value={formatWithCommas(battery?.monthly)}
            unit="kWh"
            bgColor="from-green-100 to-lime-100"
            borderColor="border-green-300/60"
          />
          <MetricCard
            title="Lifetime"
            value={formatWithCommas(battery?.lifetime)}
            unit="kWh"
            bgColor="from-indigo-100 to-purple-100"
            borderColor="border-indigo-300/60"
          />
        </div>
      </div>

      {/* Pie Chart Section - Compact */}
      <div className="w-20 flex-shrink-0 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-md border border-blue-200/40 w-full">
          <PieGraph
            data={pieData}
            line1={`${formatWithCommas(chargePercentage)} %`}
            line2='charged'
            line3=''
          />
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
          <span className="text-sm font-black text-slate-900">{value}</span>
          <span className="text-xs font-bold text-slate-600">{unit}</span>
        </div>
      </div>
    </div>
  );
}