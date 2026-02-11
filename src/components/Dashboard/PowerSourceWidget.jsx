import { useEffect, useMemo, useState } from 'react';
import { Battery, Sun } from 'lucide-react';
import SolarPanelWidget from './SolarPanelWidget';
import BatteryWidget from './BatteryWidget';

export default function PowerSourceWidget({ devices = [], isExpanded = false }) {
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  const safeDevices = useMemo(() => {
    return Array.isArray(devices) ? devices : [];
  }, [devices]);

  useEffect(() => {
    if (selectedDeviceId === null && safeDevices.length > 0) {
      const solar = safeDevices.find((d) => d?.role === 'solar');
      const firstDevice = solar?.deviceId ?? safeDevices[0]?.deviceId;
      if (firstDevice) {
        setSelectedDeviceId(firstDevice);
      }
    }
  }, [safeDevices, selectedDeviceId]);

  const deviceOptions = useMemo(
    () =>
      safeDevices
        .filter((d) => d.role === 'solar' || d.role === 'battery')
        .map((d) => ({
          value: d.deviceId,
          label: d.name || (d.role === 'solar' ? 'Solar Panel' : 'Battery'),
          role: d.role,
        })),
    [safeDevices]
  );

  const selectedDevice = safeDevices.find(
    (d) => d.deviceId === selectedDeviceId
  );

  const getIcon = () => {
    if (!selectedDevice) return Battery;
    return selectedDevice.role === 'solar' ? Sun : Battery;
  };

  const Icon = getIcon();

  return (
    <div className={`h-full flex flex-col overflow-hidden ${isExpanded ? 'pt-4' : ''}`} aria-label="Battery & Power Sources">
      {/* Header with Dropdown - Show in compact view only */}
      {!isExpanded && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 flex-shrink-0 bg-gradient-to-r from-slate-50 to-white">
          <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg p-1.5 flex-shrink-0">
            <Icon className="w-4 h-4 text-emerald-600" />
          </div>
          
          {deviceOptions.length > 0 && (
            <div className="relative flex-1 min-w-0">
              <select
                value={selectedDeviceId || ''}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full pl-3 pr-3 py-1.5 text-sm font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:border-emerald-300 hover:bg-emerald-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all duration-200 cursor-pointer truncate"
                style={{
                  backgroundImage: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none'
                }}
              >
                {deviceOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-white text-slate-900 font-medium">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {deviceOptions.length === 0 && (
            <h3 className="text-sm font-semibold text-slate-700 flex-1 truncate">Power Sources</h3>
          )}
        </div>
      )}

      {/* Compact dropdown for expanded view - positioned to avoid close button */}
      {isExpanded && deviceOptions.length > 1 && (
        <div className="flex items-center gap-2 px-4 pb-4 flex-shrink-0">
          <select
            value={selectedDeviceId || ''}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="pl-3 pr-3 py-2 text-sm font-semibold bg-white border-2 border-slate-300 text-slate-700 rounded-lg hover:border-emerald-400 hover:bg-emerald-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all duration-200 cursor-pointer shadow-sm"
            style={{
              maxWidth: 'calc(100% - 70px)',
              backgroundImage: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none'
            }}
          >
            {deviceOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-white text-slate-900 font-medium">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto p-4">
        {safeDevices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Battery className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-xs font-medium text-slate-500">No devices connected</p>
          </div>
        ) : deviceOptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Battery className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-xs font-medium text-slate-500">No compatible devices</p>
          </div>
        ) : !selectedDevice ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-xs font-medium text-slate-500">Select a device</p>
          </div>
        ) : selectedDevice.role === 'solar' ? (
          <SolarPanelWidget data={selectedDevice} />
        ) : (
          <BatteryWidget data={selectedDevice} />
        )}
      </div>
    </div>
  );
}