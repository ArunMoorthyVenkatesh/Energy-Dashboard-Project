import { useMemo } from "react";
import PropTypes from "prop-types";
import { Battery } from "lucide-react";

export default function PowerSourceWidget({
  devices = [],
  title = "Battery & Power Sources",
  className = "",
}) {
  const hasData = useMemo(() => Array.isArray(devices) && devices.length > 0, [devices]);
  
  // Alternating color palette
  const colorPalette = [
    {
      bg: 'bg-gradient-to-br from-blue-100 via-indigo-100 to-violet-100',
      badge: 'bg-blue-100 text-blue-700 border-blue-200',
      border: 'border-blue-300/60',
      hover: 'hover:border-blue-400',
    },
    {
      bg: 'bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100',
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      border: 'border-emerald-300/60',
      hover: 'hover:border-emerald-400',
    },
    {
      bg: 'bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100',
      badge: 'bg-amber-100 text-amber-700 border-amber-200',
      border: 'border-orange-300/60',
      hover: 'hover:border-orange-400',
    },
    {
      bg: 'bg-gradient-to-br from-purple-100 via-fuchsia-100 to-pink-100',
      badge: 'bg-purple-100 text-purple-700 border-purple-200',
      border: 'border-purple-300/60',
      hover: 'hover:border-purple-400',
    },
    {
      bg: 'bg-gradient-to-br from-green-100 via-lime-100 to-emerald-100',
      badge: 'bg-green-100 text-green-700 border-green-200',
      border: 'border-green-300/60',
      hover: 'hover:border-green-400',
    },
    {
      bg: 'bg-gradient-to-br from-rose-100 via-pink-100 to-fuchsia-100',
      badge: 'bg-rose-100 text-rose-700 border-rose-200',
      border: 'border-rose-300/60',
      hover: 'hover:border-rose-400',
    },
  ];
  
  // Get alternating color based on index
  const getDeviceStyle = (index) => {
    return colorPalette[index % colorPalette.length];
  };
  
  // Get status badge color based on status value
  const getStatusBadgeStyle = (status) => {
    const normalizedStatus = status?.toLowerCase() || '';
    
    if (normalizedStatus === 'normal' || normalizedStatus === 'online' || normalizedStatus === 'active') {
      return 'bg-emerald-500 text-white border-emerald-600';
    }
    
    if (normalizedStatus === 'warning' || normalizedStatus === 'charging') {
      return 'bg-amber-500 text-white border-amber-600';
    }
    
    if (normalizedStatus === 'error' || normalizedStatus === 'offline' || normalizedStatus === 'fault') {
      return 'bg-red-500 text-white border-red-600';
    }
    
    // Default
    return 'bg-slate-500 text-white border-slate-600';
  };
  
  return (
    <div 
      className={`p-4 h-full flex flex-col ${className}`.trim()} 
      aria-label={title}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 flex-shrink-0">
        <div className="bg-gradient-to-br from-green-100 to-emerald-100 backdrop-blur-sm rounded-xl p-2 shadow-sm border border-green-200/60">
          <Battery className="w-5 h-5 text-green-600" />
        </div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {hasData ? (
          <div className="space-y-2">
            {devices.map((device, index) => {
              const deviceStyle = getDeviceStyle(index);
              const statusBadgeStyle = getStatusBadgeStyle(device.status);
              
              return (
                <div 
                  key={device.id || index} 
                  className={`${deviceStyle.bg} rounded-lg p-3 border-2 ${deviceStyle.border} ${deviceStyle.hover} hover:shadow-lg transition-all duration-300`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-900">
                      {device.name}
                    </span>
                    <span className={`text-xs font-bold ${statusBadgeStyle} px-2.5 py-1 rounded-md border shadow-sm`}>
                      {device.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Battery className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">No device data available</p>
          </div>
        )}
      </div>
    </div>
  );
}

PowerSourceWidget.propTypes = {
  devices: PropTypes.array,
  title: PropTypes.string,
  className: PropTypes.string,
};