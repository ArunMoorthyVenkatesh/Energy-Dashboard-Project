import { useMemo, useState, useEffect, memo, useCallback } from 'react';
import styles from './solarbatterywidget.module.css';

import BatteryWidget from './BatteryWidget';
import SolarPanelWidget from './SolarPanelWidget';

function SolarBatteryWidget({ solarData = [], batteryData = [] }) {
  const tabs = useMemo(
    () => [
      { key: 'solar', label: 'Solar panel status' },
      { key: 'battery', label: 'Battery status' },
    ],
    []
  );

  const [activeTab, setActiveTab] = useState('solar');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const hasSolar = (solarData?.length ?? 0) > 0;
    const hasBattery = (batteryData?.length ?? 0) > 0;

    if (activeTab === 'solar' && !hasSolar && hasBattery) setActiveTab('battery');
    if (activeTab === 'battery' && !hasBattery && hasSolar) setActiveTab('solar');
  }, [solarData, batteryData, activeTab]);

  useEffect(() => {
    if (!isExpanded) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isExpanded]);

  const open = useCallback(() => setIsExpanded(true), []);
  const close = useCallback(() => setIsExpanded(false), []);

  const Toggle = () => (
    <div className={styles.toggleRow}>
      <div className={styles.segment}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`${styles.segBtn} ${activeTab === t.key ? styles.active : ''}`}
            aria-pressed={activeTab === t.key}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );

  const Panels = () => (
    <div className={styles.body}>
      <div className={`${styles.panel} ${activeTab === 'solar' ? styles.show : styles.hide}`}>
        <SolarPanelWidget data={solarData} />
      </div>

      <div className={`${styles.panel} ${activeTab === 'battery' ? styles.show : styles.hide}`}>
        <BatteryWidget data={batteryData} />
      </div>
    </div>
  );

  return (
    <>
      {}
      <div className={styles.container}>
        <button
          className={styles.expandBtn}
          type="button"
          aria-label="Expand power sources"
          title="Expand"
          onClick={open}
        >
          ⤢
        </button>

        <div className={styles.header}>
          <div className={styles.title}>Power sources</div>
          <Toggle />
        </div>

        <Panels />
      </div>

      {}
      {isExpanded && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Power sources</div>
              <button
                className={styles.closeBtn}
                type="button"
                aria-label="Close"
                title="Close"
                onClick={close}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <Toggle />
              <Panels />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default memo(SolarBatteryWidget);
