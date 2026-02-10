import { useState, useEffect, useRef } from 'react';
import { niceScale } from '../../utils/GraphUtil';
import styles from './timelinebarchart.module.css';

/**
 * @param {string} yAxisLabel - label for y-axis
 * @param {Array} data - array of objects with key and value properties
 * @param {string} viewMode - 'day' | 'month' | 'lifetime'
 * @param {function} tooltipFormatter - optional formatter for tooltip values
 * @param {function} onRefresh - callback function to refresh data
 * @param {function} onRangeChange - callback when range changes: (startIndex, endIndex) => void
 */
export default function TimelineBarchart({
  yAxisLabel,
  data = [],
  viewMode = 'day',
  tooltipFormatter,
  onRefresh = () => {
    // Default refresh function - just triggers a re-render
    console.log('Refresh clicked - provide onRefresh prop for custom behavior');
  },
  onRangeChange,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Range filter state
  const totalDataPoints = data.length;
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(totalDataPoints - 1);
  const [isDragging, setIsDragging] = useState(null); // 'start' or 'end'
  const sliderRef = useRef(null);

  // Update rangeEnd when data changes
  useEffect(() => {
    if (totalDataPoints > 0) {
      setRangeEnd(totalDataPoints - 1);
    }
  }, [totalDataPoints]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!onRefresh) return;

    const intervalId = setInterval(() => {
      onRefresh();
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [onRefresh]);

  // Notify parent of range changes
  useEffect(() => {
    if (onRangeChange && rangeEnd !== null) {
      onRangeChange(rangeStart, rangeEnd);
    }
  }, [rangeStart, rangeEnd, onRangeChange]);

  // Handle manual refresh button click - ALWAYS WORKS
  const handleRefreshClick = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      // Reset animation after a brief delay
      setTimeout(() => {
        setIsRefreshing(false);
      }, 600);
    }
  };

  // Range slider handlers
  function handleSliderMouseDown(e, handle) {
    e.preventDefault();
    setIsDragging(handle);
  }

  function handleSliderMove(e) {
    if (!isDragging || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const index = Math.round((percent / 100) * (totalDataPoints - 1));

    if (isDragging === 'start') {
      setRangeStart(Math.min(index, rangeEnd - 1));
    } else if (isDragging === 'end') {
      setRangeEnd(Math.max(index, rangeStart + 1));
    }
  }

  function handleSliderMouseUp() {
    setIsDragging(null);
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleSliderMove);
      window.addEventListener('mouseup', handleSliderMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleSliderMove);
        window.removeEventListener('mouseup', handleSliderMouseUp);
      };
    }
  }, [isDragging, rangeStart, rangeEnd, totalDataPoints]);

  // Get range label based on view mode
  function getRangeLabel(index) {
    const dataPoint = data[index];
    if (!dataPoint) return index;

    // Just return the key as-is (x-axis value)
    return dataPoint.key;
  }


  // Filter data based on range
  const filteredData = data.slice(rangeStart, rangeEnd + 1);

  const xTicks = filteredData.map(item => item.key);
  const safeValues = filteredData.map(item => item.value ?? 0);
  const maxY = Math.max(...safeValues, 1);
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

  const startPercent = totalDataPoints > 1 ? (rangeStart / (totalDataPoints - 1)) * 100 : 0;
  const endPercent = totalDataPoints > 1 ? (rangeEnd / (totalDataPoints - 1)) * 100 : 100;

  return (
    <div className={styles.container} style={{ position: 'relative' }}>
      <div className={styles.topSection}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={styles.yAxisLabel} style={{ 
            fontSize: '0.75rem', 
            fontWeight: '700', 
            color: '#475569',
            letterSpacing: '0.025em'
          }}>
            {yAxisLabel}
          </span>
          
          {/* Refresh Button - ALWAYS VISIBLE */}
          <button
            onClick={handleRefreshClick}
            className={styles.refreshButton}
            disabled={isRefreshing}
            aria-label="Refresh data"
            title="Refresh data"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{
                animation: isRefreshing ? 'spin 0.6s linear' : 'none',
              }}
            >
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
        </div>
        
        {/* Range Filter */}
        <div className={styles.rangeFilterContainer}>
          <div className={styles.rangeLabels}>
            <span className={styles.rangeLabel}>
              {getRangeLabel(rangeStart)}
            </span>
            <span className={styles.rangeSeparator}>to</span>
            <span className={styles.rangeLabel}>
              {getRangeLabel(rangeEnd)}
            </span>
          </div>
          
          <div className={styles.sliderContainer} ref={sliderRef}>
            <div className={styles.sliderTrack} />
            <div 
              className={styles.sliderRange}
              style={{
                left: `${startPercent}%`,
                width: `${endPercent - startPercent}%`
              }}
            />
            <div
              className={styles.sliderHandle}
              style={{ left: `${startPercent}%` }}
              onMouseDown={(e) => handleSliderMouseDown(e, 'start')}
            />
            <div
              className={styles.sliderHandle}
              style={{ left: `${endPercent}%` }}
              onMouseDown={(e) => handleSliderMouseDown(e, 'end')}
            />
          </div>
        </div>
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
              {filteredData.map((y, i) => {
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
                  bottom: `${((filteredData[hoveredIndex]?.value || 0) / niceMaximum) * 100}%`,
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
                  {filteredData[hoveredIndex]?.key || ''}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700' }}>
                  {formatValue(filteredData[hoveredIndex]?.value || 0)}
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
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}