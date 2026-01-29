import { memo, useEffect, useMemo, useRef, useState } from 'react';
import PieGraph from '../Graphs/PieGraph';
import styles from './batterywidget.module.css';

/* ===== Icons ===== */
const BatteryIcon = ({ size = 34, className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <rect x="2" y="7" width="18" height="10" rx="2" ry="2" />
    <path d="M22 11v2" />
  </svg>
);

const ChevronIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M6 9l6 6 6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ===== Same pill dropdown ===== */
function PillDropdown({ options, value, onChange, placeholder = 'Select' }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    const onDoc = (e) => {
      if (!e.target.closest?.('[data-pill="root"]')) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className={styles.pillDropdown} data-pill="root">
      <button
        type="button"
        className={styles.pillTrigger}
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={styles.pillLabel}>{selected?.label ?? placeholder}</span>
        <span className={styles.pillChevron} aria-hidden="true">
          <ChevronIcon />
        </span>
      </button>

      {open && (
        <div className={styles.pillMenu} role="listbox">
          {options.map((opt) => {
            const isActive = String(opt.value) === String(value);
            return (
              <button
                key={String(opt.value)}
                type="button"
                className={`${styles.pillOption} ${isActive ? styles.pillOptionActive : ''}`}
                onClick={() => {
                  onChange(String(opt.value));
                  setOpen(false);
                }}
              >
                <span>{opt.label}</span>
                {isActive ? <span className={styles.pillTick}>✓</span> : <span />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, unit, subText }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValueRow}>
        <div className={styles.statValue}>{value ?? '-'}</div>
        {unit ? <div className={styles.statUnit}>{unit}</div> : null}
      </div>
      {subText ? <div className={styles.statSub}>{subText}</div> : null}
    </div>
  );
}

function BatteryWidget({ data = [] }) {
  const [selectedBatteryId, setSelectedBatteryId] = useState(null);

  const batteryOptions = useMemo(
    () => (data?.map((d) => ({ value: String(d.id), label: d.name })) ?? []),
    [data]
  );

  // stable default selection + handle missing id
  useEffect(() => {
    if (!data?.length) {
      if (selectedBatteryId !== null) setSelectedBatteryId(null);
      return;
    }
    const exists =
      selectedBatteryId != null && data.some((d) => String(d.id) === String(selectedBatteryId));
    if (!exists) setSelectedBatteryId(String(data[0]?.id));
  }, [data, selectedBatteryId]);

  const battery = useMemo(() => {
    if (!data?.length || selectedBatteryId == null) return null;
    return data.find((d) => String(d.id) === String(selectedBatteryId)) ?? null;
  }, [data, selectedBatteryId]);

  const chargePercentageRaw = battery?.battery_percent;
  const chargePercentage = Number.isFinite(chargePercentageRaw)
    ? Math.max(0, Math.min(100, chargePercentageRaw))
    : null;

  const activePower = battery?.active_power;
  const chargingText = Number.isFinite(activePower)
    ? activePower < 0
      ? 'discharging'
      : 'charging'
    : '-';

  const showPie =
    battery &&
    chargePercentage != null &&
    chargePercentage >= 0 &&
    chargePercentage <= 100;

  const pieData = useMemo(() => {
    const cp = chargePercentage ?? 0;
    return [
      { label: 'Empty', value: 100 - cp, unit: '%', color: '#D0D0D0' },
      { label: 'Charged', value: cp, unit: '%', color: '#37F040' },
    ];
  }, [chargePercentage]);

  // ✅ animate only when key values change
  const [animate, setAnimate] = useState(false);
  const lastRef = useRef({
    id: null,
    voltage: null,
    current: null,
    temperature: null,
    active_power: null,
    daily: null,
    monthly: null,
    lifetime: null,
    battery_percent: null,
  });

  useEffect(() => {
    const next = {
      id: battery ? String(battery.id) : null,
      voltage: battery?.voltage ?? null,
      current: battery?.current ?? null,
      temperature: battery?.temperature ?? null,
      active_power: battery?.active_power ?? null,
      daily: battery?.daily ?? null,
      monthly: battery?.monthly ?? null,
      lifetime: battery?.lifetime ?? null,
      battery_percent: battery?.battery_percent ?? null,
    };
    const prev = lastRef.current;

    const changed = Object.keys(next).some((k) => next[k] !== prev[k]);
    if (!changed) return;

    lastRef.current = next;
    setAnimate(false);
    const t = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(t);
  }, [battery]);

  return (
    <div className={styles.wrap} style={{ padding: 0, margin: 0 }}>
      {/* Top row: icon + title + dropdown */}
      <div className={styles.topRow} style={{ flexWrap: 'wrap', gap: '8px', padding: '12px' }}>
        <div className={styles.titleLeft}>
          <div className={styles.iconCircle}>
            <BatteryIcon size={34} className={styles.battIcon} />
          </div>

          <div className={styles.titleText}>
            <div className={styles.mainTitle}>{battery?.name ?? 'Battery'}</div>
            <div className={styles.subTitle}>
              {showPie ? `${chargePercentage}% charged` : 'Charge unavailable'}
            </div>
          </div>
        </div>

        <div className={styles.topRight}>
          <PillDropdown
            options={batteryOptions}
            value={selectedBatteryId ?? ''}
            onChange={setSelectedBatteryId}
            placeholder="Select battery"
          />
        </div>
      </div>

      {/* Body grid */}
      <div className={styles.bodyGrid} data-animate={animate} style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '12px',
        padding: '0 12px 12px 12px'
      }}>
        <div className={styles.statsGrid} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '8px'
        }}>
          <StatCard label="Voltage" value={battery?.voltage ?? '-'} unit="V" />
          <StatCard label="Current" value={battery?.current ?? '-'} unit="A" />
          <StatCard label="Temperature" value={battery?.temperature ?? '-'} unit="°C" />
          <StatCard
            label="Power"
            value={battery?.active_power ?? '-'}
            unit="kW"
            subText={`(${chargingText})`}
          />
          <StatCard label="Daily charging" value={battery?.daily ?? '-'} unit="kWh" />
          <StatCard label="Monthly charging" value={battery?.monthly ?? '-'} unit="kWh" />
          <StatCard label="Lifetime charging" value={battery?.lifetime ?? '-'} unit="kWh" />
        </div>

        <div className={styles.graphBox} style={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px'
        }}>
          {showPie ? (
            <PieGraph
              data={pieData}
              line1={`${chargePercentage}%`}
              line2="charged"
              line3=""
            />
          ) : (
            <div className={styles.piePlaceholder}>
              <div className={styles.piePlaceholderTitle}>Battery charge</div>
              <div className={styles.piePlaceholderText}>No pie data available</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(BatteryWidget);