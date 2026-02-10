import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { niceScale } from '../../utils/GraphUtil';
import styles from './doublelinegraph.module.css';

/**
 * @param {string} yAxisLabel
 * @param {Array} upperData
 * @param {Array} lowerData
 * @param {Function} onRefresh - Optional callback function to fetch new data
 * @param {number} refreshInterval - Refresh interval in milliseconds (default: 60000 = 1 minute)
 * @param {string} viewMode - 'day', 'month', or 'lifetime' to determine range filter labels
 * @param {Function} onRangeChange - Optional callback when range filter changes: (startIndex, endIndex) => void
 */
export default function DoubleLineGraph({
  yAxisLabel,
  upperData,
  lowerData,
  onRefresh,
  refreshInterval = 60000, // 1 minute default
  viewMode = 'day', // 'day', 'month', or 'lifetime'
  onRangeChange,
}) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  const chartRef = useRef(null);
  const tooltipRef = useRef(null);
  
  // Range filter state
  const totalDataPoints = upperData[0]?.data.length ?? 0;
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

  // Auto-refresh effect
  useEffect(() => {
    if (!onRefresh) return;

    const intervalId = setInterval(() => {
      onRefresh();
    }, refreshInterval);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [onRefresh, refreshInterval]);

  // Notify parent of range changes
  useEffect(() => {
    if (onRangeChange && rangeEnd !== null) {
      onRangeChange(rangeStart, rangeEnd);
    }
  }, [rangeStart, rangeEnd, onRangeChange]);

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
    const originalData = upperData[0]?.data ?? [];
    const dataPoint = originalData[index];
    if (!dataPoint) return index;

    // Just return the key as-is (x-axis value)
    return dataPoint.key;
  }

  // Filter data based on range
  const filteredUpperData = upperData.map(ds => ({
    ...ds,
    data: ds.data.slice(rangeStart, rangeEnd + 1)
  }));

  const filteredLowerData = lowerData.map(ds => ({
    ...ds,
    data: ds.data.slice(rangeStart, rangeEnd + 1)
  }));

  const datasets = [...filteredUpperData, ...filteredLowerData];
  const allValues = datasets.flatMap(ds =>
    ds.data.map(d => d?.value ?? 0)
  );

  const absMax = Math.max(...allValues.map(v => Math.abs(v)), 1);
  const { niceMinimum, niceMaximum, ticks } = niceScale(
    -absMax,
    absMax,
    5
  );

  const yMin = niceMinimum;
  const yMax = niceMaximum;
  const xTicks = filteredUpperData[0]?.data.map(d => d.key) ?? [];

  function yPercent(value) {
    return ((value - yMin) / (yMax - yMin)) * 100;
  }

  function svgY(value) {
    return 100 - yPercent(value);
  }

  function generatePoints(data) {
    if (data.length === 0) return '';
    if (data.length === 1) {
      const y = svgY(data[0]?.value ?? 0);
      return `50,${y}`;
    }
    return data
      .map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = svgY(d?.value ?? 0);
        return `${x},${y}`;
      })
      .join(' ');
  }

  function handleMouseEnter(index, event) {
    setHoverIndex(index);
    if (!chartRef.current) return;

    const chartRect = chartRef.current.getBoundingClientRect();
    const values = datasets.map(ds => ds.data[index]?.value ?? 0);
    const highestValue = Math.max(...values);

    // Calculate x position
    const xPercent = xTicks.length > 1 ? (index / (xTicks.length - 1)) * 100 : 50;
    let xPos = chartRect.left + (chartRect.width * xPercent / 100);

    // Calculate y position (at the highest data point)
    const yPercent = svgY(highestValue);
    let yPos = chartRect.top + (chartRect.height * yPercent / 100);

    // Adjust position to prevent cutoff
    const tooltipWidth = 220; // Approximate tooltip width
    const tooltipHeight = 150; // Approximate tooltip height
    const padding = 16;

    // Prevent horizontal cutoff
    if (xPos - tooltipWidth / 2 < padding) {
      xPos = padding + tooltipWidth / 2;
    } else if (xPos + tooltipWidth / 2 > window.innerWidth - padding) {
      xPos = window.innerWidth - padding - tooltipWidth / 2;
    }

    // Prevent vertical cutoff at top
    if (yPos - tooltipHeight - padding < 0) {
      yPos = yPos + tooltipHeight + 24; // Show below instead of above
    } else {
      yPos = yPos - 12; // Normal offset above
    }

    setTooltipPos({
      x: xPos,
      y: yPos,
      showBelow: yPos > chartRect.top + tooltipHeight
    });
  }

  function handleMouseLeave() {
    setHoverIndex(null);
    setTooltipPos(null);
  }

  // Tooltip component rendered in portal
  const tooltip = hoverIndex !== null && tooltipPos && (
    <div
      ref={tooltipRef}
      className={styles.tooltip}
      style={{
        left: `${tooltipPos.x}px`,
        top: `${tooltipPos.y}px`,
        transform: tooltipPos.showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
      }}
    >
      <div className={styles.tooltipHeader}>
        {xTicks[hoverIndex]}
      </div>
      {datasets.map(ds => (
        <div
          key={ds.id}
          className={styles.tooltipRow}
        >
          <span
            className={styles.tooltipColorDot}
            style={{ backgroundColor: ds.color }}
          />
          <span className={styles.tooltipLabel}>
            {ds.name}
          </span>
          <span className={styles.tooltipValue}>
            {(ds.data[hoverIndex]?.value ?? 0).toFixed(2)} kW
          </span>
        </div>
      ))}
    </div>
  );

  const startPercent = totalDataPoints > 1 ? (rangeStart / (totalDataPoints - 1)) * 100 : 0;
  const endPercent = totalDataPoints > 1 ? (rangeEnd / (totalDataPoints - 1)) * 100 : 100;

  return (
    <div className={styles.container}>
      <div className={styles.topSection}>
        <span className={styles.yAxisLabel}>{yAxisLabel}</span>
        
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

      <div className={styles.middleSection}>
        <div className={styles.leftSection}>
          <div className={styles.yAxis}>
            {/* ✅ FIX: Reverse the ticks so highest values are at top */}
            {[...ticks].reverse().map((t, i) => (
              <div key={i} className={styles.yTickWrapper}>
                <span className={styles.yLabel}>
                  {t > 0 ? `+${t}` : t}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.chartArea} ref={chartRef}>
            {/* GRID */}
            <div className={styles.gridLines}>
              {ticks.map((t, i) => (
                <div
                  key={i}
                  className={`${styles.gridLine} ${
                    t === 0 ? styles.baseGridline : ''
                  }`}
                />
              ))}
            </div>

            {/* LINES */}
            <svg
              className={styles.lineSvg}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {datasets.map(ds => (
                <polyline
                  key={ds.id}
                  fill="none"
                  stroke={ds.color}
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                  points={generatePoints(ds.data)}
                />
              ))}
            </svg>

            {/* DATA POINT DOTS */}
            {hoverIndex !== null && (
              <svg
                className={styles.lineSvg}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {datasets.map(ds => {
                  const value = ds.data[hoverIndex]?.value ?? 0;
                  const x = xTicks.length > 1 ? (hoverIndex / (xTicks.length - 1)) * 100 : 50;
                  const y = svgY(value);
                  return (
                    <circle
                      key={ds.id}
                      cx={x}
                      cy={y}
                      r="1"
                      fill={ds.color}
                      stroke="white"
                      strokeWidth="0.5"
                      vectorEffect="non-scaling-stroke"
                      style={{
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                      }}
                    />
                  );
                })}
              </svg>
            )}

            {/* HOVER BARS */}
            <div
              className={styles.bars}
              style={{
                gridTemplateColumns: `repeat(${xTicks.length}, 1fr)`,
              }}
            >
              {xTicks.map((_, i) => (
                <div
                  key={i}
                  className={styles.bar}
                  onMouseEnter={(e) => handleMouseEnter(i, e)}
                  onMouseLeave={handleMouseLeave}
                />
              ))}
            </div>
          </div>

          {/* X AXIS */}
          <div
            className={styles.xAxis}
            style={{
              gridTemplateColumns: `repeat(${xTicks.length}, 1fr)`,
            }}
          >
            {xTicks.map((t, i) => (
              <div key={i} className={styles.tickWrapper}>
                <div className={styles.tick} />
                <div className={styles.label}>{t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LEGEND */}
      <div className={styles.bottomSection}>
        <div className={styles.legendGrp}>
          <span className={styles.legendTitle}>Input sources:</span>
          {upperData.map(d => (
            <div key={d.id} className={styles.legendWrapper}>
              <span
                className={styles.legendColor}
                style={{ backgroundColor: d.color }}
              />
              <span>{d.name}</span>
            </div>
          ))}
        </div>
        <div className={styles.legendGrp}>
          <span className={styles.legendTitle}>Load:</span>
          {lowerData.map(d => (
            <div key={d.id} className={styles.legendWrapper}>
              <span
                className={styles.legendColor}
                style={{ backgroundColor: d.color }}
              />
              <span>{d.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* TOOLTIP PORTAL - Render outside of chart container to avoid overflow issues */}
      {typeof document !== 'undefined' && createPortal(
        tooltip,
        document.body
      )}
    </div>
  );
}