import { useState, useEffect } from 'react';
import { niceScale } from '../../utils/GraphUtil';
import styles from './timelinebarchart.module.css';

/**
 * @param {string} yAxisLabel - label for y-axis
 * @param {number[]} data - array of numbers matching the time range interval
 * @param {string[]} yearLabels - only needed if timeRange is set to 'year'
 * @param {string} timeRange - 'day' | 'month' | 'lifetime'
 * @param {function} tooltipFormatter - optional formatter for tooltip values
 * @param {function} onRefresh - callback function to refresh data
 */
export default function TimelineBarchart({
  yAxisLabel,
  data = [],
  tooltipFormatter,
  onRefresh,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!onRefresh) return;

    const intervalId = setInterval(() => {
      onRefresh();
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [onRefresh]);

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
        <span className={styles.yAxisLabel} style={{ 
          fontSize: '0.75rem', 
          fontWeight: '700', 
          color: '#475569',
          letterSpacing: '0.025em'
        }}>
          {yAxisLabel}
        </span>
      </div>
      <div className={styles.bottomSection}>
        <div className={styles.leftSection}>
          <div className={styles.yAxis}>
            {yTicks.map((tick, i) => (
              <div key={`y-label-${i}`} className={styles.yTickWrapper}>
                <span className={styles.yLabel} style={{
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  color: '#64748b'
                }}>
                  {tick}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.rightSection} style={{ position: 'relative' }}>
          <div className={styles.chartArea}>
            <div className={styles.gridLines}>
              {yTicks.map((_, i) => (
                <div 
                  key={`grid-line-${i}`} 
                  className={styles.gridLine}
                  style={{
                    borderTop: '1px solid rgba(148, 163, 184, 0.15)',
                  }}
                />
              ))}
            </div>
            <div
              className={styles.bars}
              style={{ gridTemplateColumns: `repeat(${xTicks.length}, 1fr)` }}
            >
              {data.map((y, i) => {
                const barHeight = ((y?.value || 0) / niceMaximum) * 100;
                const isHovered = hoveredIndex === i;
                
                return (
                  <div
                    key={i}
                    className={styles.bar}
                    style={{
                      height: `${barHeight}%`,
                      background: isHovered 
                        ? 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)'
                        : 'linear-gradient(180deg, #818cf8 0%, #6366f1 100%)',
                      opacity: hoveredIndex === null || isHovered ? 1 : 0.4,
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      transform: isHovered ? 'scaleY(1.02) scaleX(1.05)' : 'scaleY(1)',
                      boxShadow: isHovered 
                        ? '0 4px 12px rgba(99, 102, 241, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)'
                        : '0 2px 4px rgba(99, 102, 241, 0.1)',
                      borderRadius: '4px 4px 0 0',
                    }}
                    onMouseEnter={() => handleBarHover(i)}
                    onMouseLeave={handleBarLeave}
                    onTouchStart={() => handleBarHover(i)}
                    onTouchEnd={handleBarLeave}
                  />
                );
              })}
            </div>

            {/* Tooltip - positioned relative to chartArea */}
            {hoveredIndex !== null && (
              <div
                style={{
                  position: 'absolute',
                  left: `calc((100% / ${xTicks.length}) * ${hoveredIndex} + (100% / ${xTicks.length}) / 2)`,
                  bottom: `${((data[hoveredIndex]?.value || 0) / niceMaximum) * 100}%`,
                  transform: 'translate(-50%, -12px)',
                  backgroundColor: 'rgba(30, 41, 59, 0.95)',
                  backdropFilter: 'blur(8px)',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1)',
                  pointerEvents: 'none',
                  zIndex: 1000,
                  whiteSpace: 'nowrap',
                  fontSize: '13px',
                  fontWeight: '700',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  animation: 'tooltipFadeIn 0.2s ease-out',
                }}
              >
                <div style={{ marginBottom: '2px', fontSize: '11px', opacity: 0.8, fontWeight: '600' }}>
                  {data[hoveredIndex]?.key || ''}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700' }}>
                  {formatValue(data[hoveredIndex]?.value || 0)}
                </div>
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
                  {tickLabel && <div className={styles.tick} style={{ 
                    backgroundColor: '#94a3b8',
                    width: '1px',
                    height: '4px'
                  }} />}
                  <div className={styles.label} style={{
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    color: '#64748b'
                  }}>
                    {tickLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes tooltipFadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -8px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -12px);
          }
        }
      `}</style>
    </div>
  );
}