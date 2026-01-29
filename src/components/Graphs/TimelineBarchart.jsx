import { useState } from 'react';
import { niceScale } from '../../utils/GraphUtil';
import styles from './timelinebarchart.module.css';

/**
 * @param {string} yAxisLabel - label for y-axis
 * @param {number[]} data - array of numbers matching the time range interval
 * @param {string[]} yearLabels - only needed if timeRange is set to 'year'
 * @param {string} timeRange - 'day' | 'month' | 'lifetime'
 * @param {function} tooltipFormatter - optional formatter for tooltip values
 */
export default function TimelineBarchart({
  yAxisLabel,
  data = [],
  tooltipFormatter,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const xTicks = data.map(item => item.key);
  const safeValues = data.map(item => item.value ?? 0);
  const maxY = Math.max(...safeValues);
  const { ticks, niceMaximum } = niceScale(0, maxY);
  const yTicks = ticks.reverse();

  const handleBarHover = (index) => {
    setHoveredIndex(index);
  };

  const handleBarLeave = () => {
    setHoveredIndex(null);
  };

  const formatValue = (value) => {
    if (tooltipFormatter) {
      return tooltipFormatter(value);
    }
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  return (
    <div className={styles.container} style={{ position: 'relative' }}>
      <div className={styles.topSection}>
        <span className={styles.yAxisLabel}>{yAxisLabel}</span>
      </div>
      <div className={styles.bottomSection}>
        <div className={styles.leftSection}>
          <div className={styles.yAxis}>
            {yTicks.map((tick, i) => (
              <div key={`y-label-${i}`} className={styles.yTickWrapper}>
                <span className={styles.yLabel}>{tick}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.rightSection} style={{ position: 'relative' }}>
          <div className={styles.chartArea}>
            <div className={styles.gridLines}>
              {yTicks.map((_, i) => (
                <div key={`grid-line-${i}`} className={styles.gridLine} />
              ))}
            </div>
            <div
              className={styles.bars}
              style={{ gridTemplateColumns: `repeat(${xTicks.length}, 1fr)` }}
            >
              {data.map((y, i) => (
                <div
                  key={i}
                  className={styles.bar}
                  style={{
                    height: `${((y?.value || 0) / niceMaximum) * 100}%`,
                    opacity: hoveredIndex === null || hoveredIndex === i ? 1 : 0.5,
                    transition: 'opacity 0.15s ease, transform 0.15s ease',
                    cursor: 'pointer',
                    transform: hoveredIndex === i ? 'scaleY(1.02)' : 'scaleY(1)',
                  }}
                  onMouseEnter={() => handleBarHover(i)}
                  onMouseLeave={handleBarLeave}
                  onTouchStart={() => handleBarHover(i)}
                  onTouchEnd={handleBarLeave}
                />
              ))}
            </div>

            {/* Tooltip - positioned relative to chartArea */}
            {hoveredIndex !== null && (
              <div
                style={{
                  position: 'absolute',
                  left: `calc((100% / ${xTicks.length}) * ${hoveredIndex} + (100% / ${xTicks.length}) / 2)`,
                  bottom: `${((data[hoveredIndex]?.value || 0) / niceMaximum) * 100}%`,
                  transform: 'translate(-50%, -8px)',
                  backgroundColor: 'rgba(0, 0, 0, 0.85)',
                  color: 'white',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  pointerEvents: 'none',
                  zIndex: 1000,
                  whiteSpace: 'nowrap',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                {formatValue(data[hoveredIndex]?.value || 0)}
              </div>
            )}
          </div>
          <div
            className={styles.xAxis}
            style={{ gridTemplateColumns: `repeat(${xTicks.length}, 1fr)` }}
          >
            {xTicks.map((_, i) => {
              const tickLabel = xTicks[i];
              return (
                <div key={`x-tick-${i}`} className={styles.tickWrapper}>
                  {tickLabel && <div className={styles.tick} />}
                  <div className={styles.label}>{tickLabel}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}