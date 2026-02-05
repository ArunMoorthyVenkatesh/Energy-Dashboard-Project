import { useState } from 'react';
import { niceScale } from '../../utils/GraphUtil';
import styles from './doublelinegraph.module.css';

/**
 * @param {string} yAxisLabel
 * @param {Array} upperData
 * @param {Array} lowerData
 */
export default function DoubleLineGraph({
  yAxisLabel,
  upperData,
  lowerData,
}) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const datasets = [...upperData, ...lowerData];

  const allValues = datasets.flatMap(ds =>
    ds.data.map(d => d?.value ?? 0)
  );

  const absMax = Math.max(...allValues.map(v => Math.abs(v)));

  const { niceMinimum, niceMaximum, ticks } = niceScale(
    -absMax,
    absMax,
    5
  );

  const yMin = niceMinimum;
  const yMax = niceMaximum;

  const xTicks = upperData[0]?.data.map(d => d.key) ?? [];

  function yPercent(value) {
    return ((value - yMin) / (yMax - yMin)) * 100;
  }

  function svgY(value) {
    return 100 - yPercent(value);
  }

  function generatePoints(data) {
    return data
      .map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = svgY(d?.value ?? 0);
        return `${x},${y}`;
      })
      .join(' ');
  }

  function getTooltipPosition() {
    if (hoverIndex === null) return null;

    const values = datasets.map(
      ds => ds.data[hoverIndex]?.value ?? 0
    );

    // visually highest point (inverted Y axis)
    const highestValue = Math.min(...values);

    return {
      left: `${(hoverIndex / (xTicks.length - 1)) * 100}%`,
      top: `${svgY(highestValue) - 8}%`,
    };
  }

  const tooltipPos = getTooltipPosition();

  return (
    <div className={styles.container}>
      <div className={styles.topSection}>
        <span className={styles.yAxisLabel}>{yAxisLabel}</span>
      </div>

      <div className={styles.middleSection}>
        <div className={styles.leftSection}>
          <div className={styles.yAxis}>
            {ticks.map((t, i) => (
              <div key={i} className={styles.yTickWrapper}>
                <span className={styles.yLabel}>
                  {t > 0 ? `+${t}` : t}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.chartArea}>
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

            {/* VERTICAL HOVER LINE */}
            {hoverIndex !== null && (
              <div
                className={styles.hoverLine}
                style={{
                  left: `${(hoverIndex / (xTicks.length - 1)) * 100}%`,
                }}
              />
            )}

            {/* HOVER COLUMNS */}
            <div
              className={styles.hoverCols}
              style={{
                gridTemplateColumns: `repeat(${xTicks.length}, 1fr)`,
              }}
            >
              {xTicks.map((_, i) => (
                <div
                  key={i}
                  className={styles.hoverCol}
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
              ))}
            </div>

            {/* TOOLTIP */}
            {hoverIndex !== null && tooltipPos && (
              <div
                className={styles.tooltip}
                style={tooltipPos}
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
                      className={styles.tooltipDot}
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
            )}
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
                {t && <div className={styles.tick} />}
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
    </div>
  );
}
