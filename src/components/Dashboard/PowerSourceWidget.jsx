import { useMemo } from "react";
import PropTypes from "prop-types";
import { Battery } from "lucide-react";

export default function PowerSourceWidget({
  devices = [],
  title = "Battery & Power Sources",
  className = "",
}) {
  const hasData = useMemo(() => Array.isArray(devices) && devices.length > 0, [devices]);

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm p-4 h-full flex flex-col ${className}`.trim()} 
      aria-label={title}
    >
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <Battery className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {hasData ? (
          <div className="space-y-2">
            {devices.map((device, index) => (
              <div key={device.id || index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{device.name}</span>
                  <span className="text-sm text-gray-500">{device.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
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