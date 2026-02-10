import { useEffect, useMemo, useState } from 'react';
import { Battery } from 'lucide-react';
import SolarPanelWidget from './SolarPanelWidget';
import BatteryWidget from './BatteryWidget';

export default function PowerSourceWidget({ devices = [] }) {
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  // Debug logging
  console.log('🔋 PowerSourceWidget received devices:', devices);

  // Ensure devices is always an array and memoize it
  const safeDevices = useMemo(() => {
    return Array.isArray(devices) ? devices : [];
  }, [devices]);

  useEffect(() => {
    // Only set initial device if we don't have one selected yet
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
          label: `${d.name} (${d.role})`,
        })),
    [safeDevices]
  );

  console.log('📋 Device options after filter:', deviceOptions);

  const selectedDevice = safeDevices.find(
    (d) => d.deviceId === selectedDeviceId
  );

  return (
    <div className="p-4 h-full flex flex-col overflow-hidden" aria-label="Battery & Power Sources">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 flex-shrink-0">
        <div className="bg-gradient-to-br from-green-100 to-emerald-100 backdrop-blur-sm rounded-xl p-2 shadow-sm border border-green-200/60 flex-shrink-0">
          <Battery className="w-5 h-5 text-green-600" />
        </div>
        <h3 className="text-base font-bold text-slate-900 flex-shrink-0">Device Status</h3>

        {/* Custom Dropdown - Left aligned with better styling */}
        {deviceOptions.length > 0 && (
          <div className="relative w-full md:flex-1 md:max-w-xs">
            <select
              value={selectedDeviceId || ''}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full appearance-none px-4 py-2 pr-10 text-sm font-bold bg-gradient-to-br from-violet-100 to-purple-100 border-2 border-violet-300/70 text-violet-900 rounded-xl shadow-sm hover:border-violet-400 hover:shadow-md hover:from-violet-200 hover:to-purple-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all duration-200 cursor-pointer"
            >
              {deviceOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-white text-slate-900 font-semibold py-2">
                  {option.label}
                </option>
              ))}
            </select>
            {/* Custom dropdown arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-violet-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Content - Remove scroll */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {safeDevices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Battery className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">No devices available</p>
            <p className="text-xs mt-2 text-slate-400">Please check your device configuration</p>
          </div>
        ) : deviceOptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Battery className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">No solar or battery devices found</p>
            <p className="text-xs mt-2 text-slate-400">Devices available: {safeDevices.map(d => d.role).join(', ')}</p>
          </div>
        ) : !selectedDevice ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p className="text-sm font-medium">Select a device</p>
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