export default function DashedArrow({ x1, y1, x2, y2, color = 'black' }) {

  const markerId = `arrowhead-${color.replace('#', '')}`;

  return (
    <svg
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible',
        pointerEvents: 'none',
        zIndex: 1,
      }}>
      <defs>
        <marker
          id={markerId}
          markerWidth='6'
          markerHeight='6'
          refX='5'
          refY='3'
          orient='auto'>
          <polygon points='0 0, 6 3, 0 6' fill={color} />
        </marker>
      </defs>

      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth='2'
        strokeDasharray='6 4'
        markerEnd={`url(#${markerId})`}
      />
    </svg>
  );
}
