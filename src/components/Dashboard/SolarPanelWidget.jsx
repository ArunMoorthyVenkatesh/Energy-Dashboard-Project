import { memo, useEffect, useMemo, useRef, useState } from 'react';
import styles from './SolarPanelWidget.module.css';

/* ===== Icons ===== */
const SunIcon = ({ size = 36, className = '', style = {} }) => (
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
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
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

/* ===== Pill Dropdown (same style for both widgets) ===== */
function PillDropdown({ options, value, onChange, placeholder = 'Select' }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    const onDoc = (e) => {
      // close if click outside
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

function StatCard({ label, value, unit, subText, tone = 'neutral' }) {
  return (
    <div className={styles.statCard} data-tone={tone}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValueRow}>
        <div className={styles.statValue}>{value ?? '-'}</div>
        {unit ? <div className={styles.statUnit}>{unit}</div> : null}
      </div>
      {subText ? <div className={styles.statSub}>{subText}</div> : null}
    </div>
  );
}

function SolarPanelWidget({ data = [] }) {
  const [selectedPvId, setSelectedPvId] = useState(null);

  // options
  const pvOptions = useMemo(
    () => (data?.map((d) => ({ value: String(d.id), label: d.name })) ?? []),
    [data]
  );

  // stable default selection (also handles missing id)
  useEffect(() => {
    if (!data?.length) {
      if (selectedPvId !== null) setSelectedPvId(null);
      return;
    }
    const exists =
      selectedPvId != null && data.some((d) => String(d.id) === String(selectedPvId));
    if (!exists) setSelectedPvId(String(data[0]?.id));
  }, [data, selectedPvId]);

  const pv = useMemo(() => {
    if (!data?.length || selectedPvId == null) return null;
    return data.find((d) => String(d.id) === String(selectedPvId)) ?? null;
  }, [data, selectedPvId]);

  const pvStatus = pv?.status === 'normal' ? 'Online' : 'Offline';
  const isOnline = pvStatus === 'Online';

  // ✅ animate only when selected PV values change
  const [animate, setAnimate] = useState(false);
  const lastRef = useRef({ id: null, daily: null, monthly: null, lifetime: null, status: null });

  useEffect(() => {
    const next = {
      id: pv ? String(pv.id) : null,
      daily: pv?.daily ?? null,
      monthly: pv?.monthly ?? null,
      lifetime: pv?.lifetime ?? null,
      status: pv?.status ?? null,
    };
    const prev = lastRef.current;
    const changed =
      prev.id !== next.id ||
      prev.daily !== next.daily ||
      prev.monthly !== next.monthly ||
      prev.lifetime !== next.lifetime ||
      prev.status !== next.status;

    if (!changed) return;

    lastRef.current = next;
    setAnimate(false);
    const t = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(t);
  }, [pv]);

  return (
    <div className={styles.wrap}>
      {/* Top row: icon + title + dropdown */}
      <div className={styles.topRow}>
        <div className={styles.titleLeft}>
          <div className={styles.iconCircle} data-online={isOnline}>
            <SunIcon
              size={34}
              className={styles.solarIcon}
              style={{ color: isOnline ? '#00af1a' : '#9ca3af' }}
            />
          </div>

          <div className={styles.titleText}>
            <div className={styles.mainTitle}>{pv?.name ?? 'Solar panel'}</div>
            <div className={styles.subTitle} data-online={isOnline}>
              <span className={styles.dot} data-online={isOnline} />
              {pvStatus}
            </div>
          </div>
        </div>

        <div className={styles.topRight}>
          <PillDropdown
            options={pvOptions}
            value={selectedPvId ?? ''}
            onChange={setSelectedPvId}
            placeholder="Select PV"
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className={styles.statsGrid} data-animate={animate}>
        <StatCard label="Yield Today" value={pv?.daily ?? '-'} unit="kW" />
        <StatCard label="Yield Monthly" value={pv?.monthly ?? '-'} unit="kW" />
        <StatCard label="Yield Lifetime" value={pv?.lifetime ?? '-'} unit="kW" />
      </div>
    </div>
  );
}

export default memo(SolarPanelWidget);
