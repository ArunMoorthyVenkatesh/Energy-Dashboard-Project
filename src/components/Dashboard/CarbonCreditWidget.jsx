import { useMemo } from 'react';
import { Leaf, Zap, TrendingUp } from 'lucide-react';
import { formatWithCommas } from '../../utils/FormatUtil';

export default function CarbonCreditWidget({ data, isExpanded = false }) {
  const safeNumber = (value) => (Number.isFinite(value) ? value : 0);

  const sections = useMemo(() => {
    const energy = data?.energy_summary || {};
    const saving = data?.saving_summary || {};

    return [
      {
        title: 'Daily carbon credit',
        dataValue: safeNumber(saving.today_co2_saving),
        dataUnit: 'kgCO2e',
        icon: Leaf,
        color: 'green',
      },
      {
        title: 'Monthly carbon credit',
        dataValue: safeNumber(saving.month_co2_saving),
        dataUnit: 'kgCO2e',
        icon: Leaf,
        color: 'green',
      },
      {
        title: 'Lifetime carbon credit',
        dataValue: safeNumber(saving.lifetime_co2_saving),
        dataUnit: 'kgCO2e',
        icon: Leaf,
        color: 'green',
      },
      {
        title: 'Daily energy saved',
        dataValue: safeNumber(energy.today_pv_energy),
        dataUnit: 'kW',
        icon: Zap,
        color: 'blue',
      },
      {
        title: 'Monthly energy saved',
        dataValue: safeNumber(energy.month_pv_energy),
        dataUnit: 'kW',
        icon: Zap,
        color: 'blue',
      },
      {
        title: 'Lifetime energy saved',
        dataValue: safeNumber(energy.lifetime_pv_energy),
        dataUnit: 'kW',
        icon: Zap,
        color: 'blue',
      },
      {
        title: 'Renewable energy ratio',
        dataValue: safeNumber(energy.lifetime_ratio) * 100,
        dataUnit: '%',
        icon: TrendingUp,
        color: 'purple',
      },
    ];
  }, [data]);

  const getColorClasses = (color) => {
    const colors = {
      green: {
        bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
        border: 'border-green-200',
        icon: 'text-green-600',
        iconBg: 'bg-green-100',
        text: 'text-green-900',
        value: 'text-green-900',
      },
      blue: {
        bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        iconBg: 'bg-blue-100',
        text: 'text-blue-900',
        value: 'text-blue-900',
      },
      purple: {
        bg: 'bg-gradient-to-br from-purple-50 to-violet-50',
        border: 'border-purple-200',
        icon: 'text-purple-600',
        iconBg: 'bg-purple-100',
        text: 'text-purple-900',
        value: 'text-purple-900',
      },
    };
    return colors[color] || colors.green;
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 ml-auto"
      style={{ width: '100%' }} // ✅ decreases width from the LEFT (right edge stays aligned)
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        <div className="p-1.5 bg-green-50 rounded-md">
          <Leaf className="w-5 h-5 text-green-600" />
        </div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
          Carbon Credit Generation
        </h2>
      </div>

      {/* Grid of Compact Cards */}
      <div
        className={`grid gap-3 sm:gap-4 transition-all duration-300 ease-in-out ${
          isExpanded ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'
        }`}
      >
        {sections.map((section, i) => {
          const Icon = section.icon;
          const colors = getColorClasses(section.color);

          return (
            <div
              key={i}
              className={`${colors.bg} rounded-lg border ${colors.border} p-3 sm:p-4 hover:shadow-md transition-all flex flex-col justify-between`}
              style={{
                height: isExpanded ? '140px' : '110px',
                minWidth: isExpanded ? 'auto' : '200px',
                transform: isExpanded ? 'scale(1)' : 'scale(0.95)',
                transformOrigin: 'center',
              }}
            >
              <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                <span className={`text-[11px] sm:text-xs font-semibold ${colors.text}`}>
                  {section.title}
                </span>
                <div className={`p-1 ${colors.iconBg} rounded-md`}>
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${colors.icon}`} />
                </div>
              </div>

              <div className="flex items-baseline gap-1 sm:gap-1.5">
                <span className={`text-lg sm:text-xl font-bold ${colors.value}`}>
                  {formatWithCommas(section.dataValue)}
                </span>
                <span className={`text-[11px] sm:text-sm font-medium ${colors.text}`}>
                  {section.dataUnit}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
