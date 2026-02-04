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

// Auto-scale energy values for display
function autoScaleEnergy(value) {
  const numValue = parseFloat(value);
  if (!Number.isFinite(numValue)) return { value: '0.00', unit: 'kW' };
  
  const absValue = Math.abs(numValue);
  if (absValue >= 1000000) {
    return { 
      value: (numValue / 1000000).toFixed(2), 
      unit: 'GW' 
    };
  } else if (absValue >= 1000) {
    return { 
      value: (numValue / 1000).toFixed(2), 
      unit: 'MW' 
    };
  }
  return { 
    value: numValue.toFixed(2), 
    unit: 'kW' 
  };
}

// Clean label helper - removes "From" prefix and cleans up text
function cleanLabel(label) {
  return label
    .replace(/^from\s+/i, '') // Remove "From" prefix
    .replace(/cells?$/i, 'Cells') // Normalize "cells" to "Cells"
    .replace(/grid$/i, 'Grid') // Normalize "grid" to "Grid"
    .replace(/battery$/i, 'Battery'); // Normalize "battery" to "Battery"
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
        <defs>
          {/* Gradient definitions for each slice */}
          <linearGradient id="gradient-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="gradient-amber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="gradient-green" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          
          {/* Shadow filter */}
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
            <feOffset dx="0" dy="1" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.2"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {fullCircleSlice ? (
          // Show single circle if one slice is 100%
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill={`url(#gradient-${fullCircleSlice.label.includes('solar') ? 'blue' : fullCircleSlice.label.includes('grid') ? 'amber' : 'green'})`}
            stroke='#fff'
            strokeWidth='2'
            filter="url(#shadow)"
            style={{ 
              cursor: 'pointer',
              opacity: hoveredIndex === null || hoveredIndex === 0 ? 1 : 0.6,
              transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: hoveredIndex === 0 ? 'scale(1.05)' : 'scale(1)',
              transformOrigin: 'center',
            }}
            onMouseEnter={() => setHoveredIndex(0)}
            onMouseLeave={() => setHoveredIndex(null)}
            onTouchStart={() => setHoveredIndex(0)}
            onTouchEnd={() => setHoveredIndex(null)}
          />
        ) : (
          // Show pie chart slices
          pieData.map((slice, i) => {
            const gradientId = slice.label.includes('solar') 
              ? 'gradient-blue' 
              : slice.label.includes('grid') 
                ? 'gradient-amber' 
                : 'gradient-green';
            
            return (
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
                strokeWidth='2'
                fill={`url(#${gradientId})`}
                filter="url(#shadow)"
                style={{
                  cursor: 'pointer',
                  opacity: hoveredIndex === null || hoveredIndex === i ? 1 : 0.5,
                  transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: hoveredIndex === i ? 'scale(1.05)' : 'scale(1)',
                  transformOrigin: 'center',
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onTouchStart={() => setHoveredIndex(i)}
                onTouchEnd={() => setHoveredIndex(null)}
              />
            );
          })
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
            backgroundColor: 'rgba(30, 41, 59, 0.98)',
            backdropFilter: 'blur(12px)',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
            zIndex: 1000,
            whiteSpace: 'nowrap',
            textAlign: 'center',
            minWidth: '160px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            animation: 'pieTooltipFadeIn 0.2s ease-out',
          }}
        >
          <div style={{ 
            fontSize: '10px', 
            marginBottom: '8px', 
            fontWeight: '700', 
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            {cleanLabel(pieData[hoveredIndex].label)}
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: '900', 
            marginBottom: '6px',
            color: '#ffffff',
            lineHeight: '1',
          }}>
            {(() => {
              const scaled = autoScaleEnergy(pieData[hoveredIndex].value);
              return `${scaled.value} ${scaled.unit}`;
            })()}
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: '#cbd5e1',
            fontWeight: '600'
          }}>
            {pieData[hoveredIndex].percentage.toFixed(2)}%
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pieTooltipFadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </div>
  );
}