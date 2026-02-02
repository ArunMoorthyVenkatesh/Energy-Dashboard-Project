import { useState } from 'react';
import { niceScale } from '../../utils/GraphUtil';
import styles from './doublelinegraph.module.css';

/**
 * @param {string} yAxisLabel - label for y-axis
 * @param {number[]} upperData - array of numbers matching the time range interval for top section
 * @param {number[]} lowerData - array of numbers matching the time range interval for bottom section
 * @param {string[]} yearLabels - only needed if timeRange is set to 'year'
 * @param {string} timeRange - 'day' | 'month' | 'lifetime'
 */
export default function DoubleLineGraph({
  yAxisLabel,
  upperData,
  lowerData,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const allData = [...upperData, ...lowerData]
    .flatMap(ds => ds.data.map(item => item?.value ?? 0));
  
  const dataMin = Math.min(...allData);
  const dataMax = Math.max(...allData);

  // Find the absolute maximum to make scale symmetric
  const absMax = Math.max(Math.abs(dataMin), Math.abs(dataMax));

  // Use symmetric range: -absMax to +absMax
  const { niceMinimum, niceMaximum, ticks } = niceScale(-absMax, absMax, 5);

  const yLabelMin = niceMinimum;
  const yLabelMax = niceMaximum;

  const positiveTicks = ticks
    .filter((tick) => tick > 0)
    .map((tick) => `+${tick}`);
  const negativeTicks = ticks
    .filter((tick) => tick < 0)
    .map((tick) => `${tick}`);
  const zeroTick = ticks.includes(0) ? ['0'] : [];

  const yTicks = [
    ...positiveTicks.reverse(),
    ...zeroTick,
    ...negativeTicks.reverse(),
  ];

  const yCenterTick = '0';

  const xTicks = (upperData[0]?.data || []).map(item => item.key);

  function calculateYPos(value) {
    return ((value - yLabelMin) / (yLabelMax - yLabelMin)) * 100;
  }

  function generatePoints(data) {
    if (!data || data.length === 0) return "";
    return data
      .map((item, i) => {
        const yValue = item?.value ?? 0;
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - calculateYPos(yValue);
        return `${x},${y}`;
      })
      .join(' ');
  }

  function handleBarHover(event, index) {
    setHoveredIndex(index);
    setTooltipPosition({
      x: event.clientX,
      y: event.clientY,
    });
  }

  function handleBarLeave() {
    setHoveredIndex(null);
  }

  // Get data for the hovered index
  function getTooltipData() {
    if (hoveredIndex === null) return null;
    
    const xLabel = xTicks[hoveredIndex];
    const datasets = [...upperData, ...lowerData];
    const values = datasets.map(dataset => ({
      name: dataset.name,
      value: dataset.data[hoveredIndex]?.value ?? 0,
      color: dataset.color,
    }));

    return { xLabel, values };
  }

  const tooltipData = getTooltipData();

  return (
    <div className={styles.container}>
      <div className={styles.topSection}>
        <span className={styles.yAxisLabel}>{yAxisLabel}</span>
      </div>
      <div className={styles.middleSection}>
        <div className={styles.leftSection}>
          <div className={styles.yAxis}>
            {yTicks.map((tick, i) => (
              <div key={`y-label-${i}`} className={styles.yTickWrapper}>
                <span className={styles.yLabel}>{tick}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.rightSection}>
          <div className={styles.chartArea}>
            <div className={styles.gridLines}>
              {yTicks.map((tick, i) => (
                <div
                  key={`grid-line-${i}`}
                  className={`${styles.gridLine} ${
                    tick === yCenterTick ? styles.baseGridline : ''
                  }`}
                />
              ))}
            </div>
            <svg
              className={styles.lineSvg}
              viewBox='0 0 100 100'
              preserveAspectRatio='none'
            >
              {/* Lines */}
              {[...upperData, ...lowerData].map((dataset) => (
                <polyline
                  key={`line-${dataset.id}`}
                  fill='none'
                  stroke={dataset.color}
                  strokeWidth='1.5'
                  vectorEffect='non-scaling-stroke'
                  points={generatePoints(dataset.data)}
                />
              ))}
            </svg>

            {/* Bars with hover */}
            {[...upperData, ...lowerData].map((dataset) => (
              <div
                key={`bars-${dataset.id}`}
                className={styles.bars}
                style={{ gridTemplateColumns: `repeat(${xTicks.length}, 1fr)` }}
              >
                {dataset.data.map((y, i) => (
                  <div
                    key={`${dataset.id}-bar-${i}`}
                    className={styles.bar}
                    style={{
                      height: `${calculateYPos(y?.value ?? 0)}%`,
                    }}
                    onMouseEnter={(e) => handleBarHover(e, i)}
                    onMouseMove={(e) => handleBarHover(e, i)}
                    onMouseLeave={handleBarLeave}
                  />
                ))}
              </div>
            ))}
          </div>
          <div
            className={styles.xAxis}
            style={{ gridTemplateColumns: `repeat(${xTicks.length}, 1fr)` }}
          >
            {xTicks.map((tickLabel, i) => {
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
      <div className={styles.bottomSection}>
        <div className={styles.legendGrp}>
          <span className={styles.legendTitle}>Input sources: </span>
          {upperData.map((data, i) => (
            <div className={styles.legendWrapper} key={`src-lgd-${i}`}>
              <div
                className={styles.legendColor}
                style={{ backgroundColor: data.color }}
              />
              <span>{data.name}</span>
            </div>
          ))}
        </div>
        <div className={styles.legendGrp}>
          <span className={styles.legendTitle}>Load: </span>
          {lowerData.map((data, i) => (
            <div className={styles.legendWrapper} key={`load-lgd-${i}`}>
              <div
                className={styles.legendColor}
                style={{ backgroundColor: data.color }}
              />
              <span>{data.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltipData && (
        <div
          className={styles.tooltip}
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y + 10}px`,
          }}
        >
          <div className={styles.tooltipHeader}>{tooltipData.xLabel}</div>
          {tooltipData.values.map((item, i) => (
            <div key={i} className={styles.tooltipRow}>
              <div
                className={styles.tooltipColorDot}
                style={{ backgroundColor: item.color }}
              />
              <span className={styles.tooltipLabel}>{item.name}:</span>
              <span className={styles.tooltipValue}>
                {item.value.toFixed(2)} kW
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}