import AirconSvg from '../../assets/svg/AirconSvg';
import Co2Svg from '../../assets/svg/Co2Svg';
import ComputerSvg from '../../assets/svg/ComputerSvg';
import HumidSvg from '../../assets/svg/HumiditySvg';
import SensorSvg from '../../assets/svg/SensorSvg';
import LinkedCameraSvg from '../../assets/svg/LinkedCameraSvg';
import AirSvg from '../../assets/svg/AirSvg';
import ThermostatSvg from '../../assets/svg/ThermostatSvg';
import styles from './usagegraph.module.css';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import SolarSvg from '../../assets/svg/SolarSvg';
import BatterySvg from '../../assets/svg/BatterySvg';
import EvStationSvg from '../../assets/svg/EvStationSvg';
import ElectricMeterSvg from '../../assets/svg/ElectricMeterSvg';

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

export default function UsageGraph({ data }) {
  const totalUsage = data.reduce((sum, d) => sum + (Number.isFinite(d.usage) ? d.usage : 0), 0);
  return (
    <div className={styles.container} style={{ color: '#000000' }}>
      <div className={styles.header}>
        <div>Group</div>
        <div>Energy usage</div>
        <div>IoT devices</div>
      </div>
      <div className={styles.content}>
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
    <div className={styles.row} style={{ color: '#000000' }}>
      <div>{data.name}</div>
      <div className={styles.barWrapper}>
        <div
          className={styles.bar}
          style={{ width: `${percentage}%` }}
          ref={barRef}>
          <span
            className={`${styles.usagePercent} ${
              percentOutside ? styles.outside : ''
            }`}
            ref={percentRef}
            style={{ color: '#000000' }}>
            {percentage}%{' '}
            <span className={styles.usageValue}>({usageValue.toFixed(2)} kWh)</span>
          </span>
        </div>
      </div>
      <div className={styles.devices}>
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
            className={styles.deviceButton}
            onMouseEnter={(e) => handleMouseEnter(e, group.type)}
            onMouseLeave={handleMouseLeave}
          >
            {ICON[group.type]}

            {overlayPos &&
              hoveredDevice === group.type &&
              createPortal(
                <div
                  className={styles.deviceOverlay}
                  style={{ top: overlayPos.top, left: overlayPos.left, color: '#000000' }}
                >
                  {group.names.map((name, i) => (
                    <span key={i}>{name}</span>
                  ))}
                </div>,
                document.body
              )}
          </button>
        ))}
      </div>

    </div>
  );
}