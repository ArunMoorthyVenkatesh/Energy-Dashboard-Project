import { useState } from 'react';
import styles from './piegraph.module.css';

// Svg helpers
function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  const d = [
    `M ${x} ${y}`, // Move to center
    `L ${start.x} ${start.y}`, // Line to start of arc
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`, // Arc
    'Z', // Close path
  ].join(' ');
  return d;
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

/**
 * @param {object} data
 * @param {string | number} line1 - line 1 text in center
 * @param {string | number} line2 - line 2 text in center
 * @param {string | number} line3 - line 3 text in center
 */
export default function PieGraph({ data, line1, line2, line3 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativeAngle = 0;
  const pieData = data.map((item) => {
    const startAngle = cumulativeAngle;
    const angle = (item.value / total) * 360;
    const percentage = (item.value / total) * 100;
    cumulativeAngle += angle;
    return { ...item, startAngle, angle, percentage };
  });

  const radius = 50; // 50% of viewBox
  const center = 50; // center of viewBox
  const fullCircleSlice = pieData.find((slice) => slice.angle >= 359.9);

  return (
    <div className={styles.container} style={{ position: 'relative' }}>
      <div className={styles.centerSection}>
        <span className={styles.centerLine1}>{line1}</span>
        <span className={styles.centerLine2}>{line2}</span>
        <span className={styles.centerLine3}>{line3}</span>
      </div>
      <svg width='100%' height='100%' viewBox='0 0 100 100'>
        {fullCircleSlice ? (
          // Show single circle if one slice is 100%
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill={fullCircleSlice.color}
            stroke='#fff'
            strokeWidth='1'
            style={{ 
              cursor: 'pointer',
              opacity: hoveredIndex === null || hoveredIndex === 0 ? 1 : 0.5,
              transition: 'opacity 0.2s ease'
            }}
            onMouseEnter={() => setHoveredIndex(0)}
            onMouseLeave={() => setHoveredIndex(null)}
            onTouchStart={() => setHoveredIndex(0)}
            onTouchEnd={() => setHoveredIndex(null)}
          />
        ) : (
          // Show pie chart slices
          pieData.map((slice, i) => (
            <path
              key={`path-${i}`}
              d={describeArc(
                center,
                center,
                radius,
                slice.startAngle,
                slice.startAngle + slice.angle
              )}
              stroke='#fff'
              strokeWidth='1'
              fill={slice.color}
              style={{
                cursor: 'pointer',
                opacity: hoveredIndex === null || hoveredIndex === i ? 1 : 0.5,
                transition: 'opacity 0.2s ease, transform 0.2s ease',
                transform: hoveredIndex === i ? 'scale(1.03)' : 'scale(1)',
                transformOrigin: 'center',
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onTouchStart={() => setHoveredIndex(i)}
              onTouchEnd={() => setHoveredIndex(null)}
            />
          ))
        )}
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '10px 14px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            zIndex: 1000,
            whiteSpace: 'nowrap',
            textAlign: 'center',
            minWidth: '120px',
          }}
        >
          <div style={{ fontSize: '13px', marginBottom: '4px', fontWeight: '600', color: '#E5E7EB' }}>
            {pieData[hoveredIndex].label}
          </div>
          <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '2px' }}>
            {pieData[hoveredIndex].value.toLocaleString(undefined, { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })} {pieData[hoveredIndex].unit || ''}
          </div>
          <div style={{ fontSize: '12px', color: '#D1D5DB' }}>
            ({pieData[hoveredIndex].percentage.toFixed(2)}%)
          </div>
        </div>
      )}
    </div>
  );
}