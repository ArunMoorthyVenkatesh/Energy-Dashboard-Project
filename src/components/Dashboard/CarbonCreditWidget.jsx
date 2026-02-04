import { useMemo } from 'react';
import { Leaf, Zap, TrendingUp } from 'lucide-react';
import { formatWithCommas } from '../../utils/FormatUtil';

export default function CarbonCreditWidget({ data, isExpanded = false }) {
  const safeNumber = (value) => (Number.isFinite(value) ? value : 0);

  // Auto-scale energy values (kW -> MW -> GW)
  const autoScaleEnergy = (value) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return { value: value / 1000000, unit: 'GW' };
    } else if (absValue >= 1000) {
      return { value: value / 1000, unit: 'MW' };
    }
    return { value, unit: 'kW' };
  };

  // Auto-scale CO2 values (kg -> tonnes)
  const autoScaleCO2 = (value) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000) {
      return { value: value / 1000, unit: 'tCO2e' };
    }
    return { value, unit: 'kgCO2e' };
  };

  const sections = useMemo(() => {
    const energy = data?.energy_summary || {};
    const saving = data?.saving_summary || {};

    // Auto-scale values
    const dailyCO2 = autoScaleCO2(safeNumber(saving.today_co2_saving));
    const monthlyCO2 = autoScaleCO2(safeNumber(saving.month_co2_saving));
    const lifetimeCO2 = autoScaleCO2(safeNumber(saving.lifetime_co2_saving));
    const dailyEnergy = autoScaleEnergy(safeNumber(energy.today_pv_energy));
    const monthlyEnergy = autoScaleEnergy(safeNumber(energy.month_pv_energy));
    const lifetimeEnergy = autoScaleEnergy(safeNumber(energy.lifetime_pv_energy));

    return [
      {
        title: 'Daily carbon credit',
        dataValue: dailyCO2.value,
        dataUnit: dailyCO2.unit,
        icon: Leaf,
        gradient: 'from-emerald-100 via-teal-100 to-cyan-100',
        border: 'border-emerald-300/60',
        hoverBorder: 'hover:border-emerald-400',
        iconColor: 'text-emerald-600',
      },
      {
        title: 'Monthly carbon credit',
        dataValue: monthlyCO2.value,
        dataUnit: monthlyCO2.unit,
        icon: Leaf,
        gradient: 'from-green-100 via-emerald-100 to-teal-100',
        border: 'border-green-300/60',
        hoverBorder: 'hover:border-green-400',
        iconColor: 'text-green-600',
      },
      {
        title: 'Lifetime carbon credit',
        dataValue: lifetimeCO2.value,
        dataUnit: lifetimeCO2.unit,
        icon: Leaf,
        gradient: 'from-lime-100 via-green-100 to-emerald-100',
        border: 'border-lime-300/60',
        hoverBorder: 'hover:border-lime-400',
        iconColor: 'text-lime-600',
      },
      {
        title: 'Daily energy saved',
        dataValue: dailyEnergy.value,
        dataUnit: dailyEnergy.unit,
        icon: Zap,
        gradient: 'from-blue-100 via-sky-100 to-cyan-100',
        border: 'border-blue-300/60',
        hoverBorder: 'hover:border-blue-400',
        iconColor: 'text-blue-600',
      },
      {
        title: 'Monthly energy saved',
        dataValue: monthlyEnergy.value,
        dataUnit: monthlyEnergy.unit,
        icon: Zap,
        gradient: 'from-indigo-100 via-blue-100 to-sky-100',
        border: 'border-indigo-300/60',
        hoverBorder: 'hover:border-indigo-400',
        iconColor: 'text-indigo-600',
      },
      {
        title: 'Lifetime energy saved',
        dataValue: lifetimeEnergy.value,
        dataUnit: lifetimeEnergy.unit,
        icon: Zap,
        gradient: 'from-violet-100 via-indigo-100 to-blue-100',
        border: 'border-violet-300/60',
        hoverBorder: 'hover:border-violet-400',
        iconColor: 'text-violet-600',
      },
      {
        title: 'Renewable energy ratio',
        dataValue: safeNumber(energy.lifetime_ratio) * 100,
        dataUnit: '%',
        icon: TrendingUp,
        gradient: 'from-purple-100 via-fuchsia-100 to-pink-100',
        border: 'border-purple-300/60',
        hoverBorder: 'hover:border-purple-400',
        iconColor: 'text-purple-600',
      },
    ];
  }, [data]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-6 border-b border-slate-200/60 mb-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-sm border border-slate-200/60">
          <Leaf className="w-5 h-5 text-green-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Carbon Credit Generation
        </h2>
      </div>

      {/* Grid of Cards */}
      <div
        className={`grid gap-4 transition-all duration-300 ease-in-out ${
          isExpanded ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'
        }`}
      >
        {sections.map((section, i) => {
          const Icon = section.icon;

          return (
            <div
              key={i}
              className={`bg-gradient-to-br ${section.gradient} rounded-lg p-4 border-2 ${section.border} ${section.hoverBorder} hover:shadow-lg transition-all duration-300`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-white/90 rounded-lg shadow-sm">
                  <Icon className={`w-4 h-4 ${section.iconColor}`} />
                </div>
                <span className="text-xs font-bold text-slate-900">
                  {section.title}
                </span>
              </div>

              <div className="flex items-baseline gap-1 flex-wrap">
                <span 
                  className="font-black text-slate-900" 
                  style={{ fontSize: 'clamp(0.875rem, 2vw, 1.25rem)' }}
                >
                  {formatWithCommas(section.dataValue)}
                </span>
                <span className="text-xs text-slate-700 font-bold whitespace-nowrap">
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