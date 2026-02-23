import AirconSvg from '../../assets/svg/AirconSvg';
import Co2Svg from '../../assets/svg/Co2Svg';
import ComputerSvg from '../../assets/svg/ComputerSvg';
import HumidSvg from '../../assets/svg/HumiditySvg';
import SensorSvg from '../../assets/svg/SensorSvg';
import LinkedCameraSvg from '../../assets/svg/LinkedCameraSvg';
import AirSvg from '../../assets/svg/AirSvg';
import ThermostatSvg from '../../assets/svg/ThermostatSvg';
import SolarSvg from '../../assets/svg/SolarSvg';
import BatterySvg from '../../assets/svg/BatterySvg';
import EvStationSvg from '../../assets/svg/EvStationSvg';
import ElectricMeterSvg from '../../assets/svg/ElectricMeterSvg';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const ICON = {
  temp: <ThermostatSvg />,
  co2: <Co2Svg />,
  sensor: <SensorSvg />,
  aircon: <AirconSvg />,
  humid: <HumidSvg />,
  wind: <AirSvg />,
  camera: <LinkedCameraSvg />,
  pc: <ComputerSvg />,
  pv: <SolarSvg />,
  bess: <BatterySvg />,
  evse: <EvStationSvg />,
  meter: <ElectricMeterSvg />,
};

function autoScaleEnergy(value) {
  const absValue = Math.abs(value);
  if (absValue >= 1000000) {
    return { value: value / 1000000, unit: 'GWh' };
  } else if (absValue >= 1000) {
    return { value: value / 1000, unit: 'MWh' };
  }
  return { value, unit: 'kWh' };
}

export default function UsageGraph({ data }) {
  const totalUsage = data.reduce((sum, d) => sum + (Number.isFinite(d.usage) ? d.usage : 0), 0);

  return (
    <div className="flex flex-col w-full h-full">
      {}
      <div className="grid grid-cols-[2fr_3fr_2fr] gap-4 px-4 py-3 bg-slate-50/50 rounded-lg border border-slate-200/60 mb-3">
        <div className="text-xs font-bold text-slate-700">Group</div>
        <div className="text-xs font-bold text-slate-700">Energy usage</div>
        <div className="text-xs font-bold text-slate-700">IoT devices</div>
      </div>

      {}
      <div className="flex flex-col gap-3 overflow-y-auto pr-1" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 #f1f5f9'
      }}>
        {data.map((d) => (
          <Row data={d} totalUsage={totalUsage} key={d.deviceId || d.name} />
        ))}
      </div>
    </div>
  );
}

function Row({ data, totalUsage }) {
  const barRef = useRef(null);
  const percentRef = useRef(null);
  const [percentOutside, setPercentOutside] = useState(false);

  useEffect(() => {
    const checkFit = () => {
      if (barRef.current && percentRef.current) {
        const barWidth = barRef.current.offsetWidth;
        const percentWidth = percentRef.current.offsetWidth;
        setPercentOutside(percentWidth + 10 > barWidth);
      }
    };

    checkFit();
    window.addEventListener('resize', checkFit);
    return () => window.removeEventListener('resize', checkFit);
  }, []);

  const usageValue = Number.isFinite(data.usage) ? data.usage : 0;
  const denominator = totalUsage > 0 ? totalUsage : 1;
  const percentage = ((usageValue / denominator) * 100).toFixed(2);
  const scaled = autoScaleEnergy(usageValue);

  const [overlayPos, setOverlayPos] = useState(null);
  const [hoveredDevice, setHoveredDevice] = useState(null);

  function handleMouseEnter(e, deviceId) {
    const rect = e.currentTarget.getBoundingClientRect();
    setOverlayPos({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
    });
    setHoveredDevice(deviceId);
  }

  function handleMouseLeave() {
    setOverlayPos(null);
    setHoveredDevice(null);
  }

  return (
    <div className="grid grid-cols-[2fr_3fr_2fr] gap-4 items-center px-4 py-2 hover:bg-slate-50/50 rounded-lg transition-colors">
      {}
      <div className="text-sm font-semibold text-slate-900 truncate">
        {data.name}
      </div>

      {}
      <div className="flex items-center">
        <div className="relative w-full">
          <div
            ref={barRef}
            className="relative bg-gradient-to-r from-blue-500 to-blue-600 rounded-md min-h-[32px] flex items-center px-2 shadow-sm"
            style={{ width: `${percentage}%` }}
          >
            <span
              ref={percentRef}
              className={`text-xs font-bold whitespace-nowrap ${
                percentOutside
                  ? 'absolute left-full ml-2 text-slate-900'
                  : 'ml-auto text-white'
              }`}
            >
              {percentage}%
              <span className="ml-1 font-normal opacity-90">
                ({scaled.value.toFixed(2)} {scaled.unit})
              </span>
            </span>
          </div>
        </div>
      </div>

      {}
      <div className="flex items-center gap-1 flex-wrap">
        {Object.values(
          (data.devices || []).reduce((acc, device) => {
            if (!acc[device.deviceType]) {
              acc[device.deviceType] = {
                type: device.deviceType,
                names: device.name ? [device.name] : [],
                id: device.deviceId,
              };
            } else {
              if (device.name) {
                acc[device.deviceType].names.push(device.name);
              }
            }
            return acc;
          }, {})
        ).map((group) => (
          <button
            key={group.type}
            className="p-1.5 bg-white rounded-md border border-slate-200/60 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 shadow-sm"
            onMouseEnter={(e) => handleMouseEnter(e, group.type)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="w-5 h-5">
              {ICON[group.type]}
            </div>

            {overlayPos &&
              hoveredDevice === group.type &&
              createPortal(
                <div
                  className="absolute z-[9999] bg-white rounded-lg shadow-lg border border-slate-200 p-3 max-w-xs max-h-[300px] overflow-y-auto"
                  style={{
                    top: overlayPos.top - 10,
                    left: overlayPos.left,
                    transform: 'translate(-50%, -100%)',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e1 #f1f5f9'
                  }}
                >
                  <div className="flex flex-col gap-2">
                    {group.names.map((name, i) => (
                      <span key={i} className="text-sm text-slate-700 whitespace-nowrap">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>,
                document.body
              )}
          </button>
        ))}
      </div>
    </div>
  );
}
