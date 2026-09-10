import React from 'react';

/**
 * Barcode component rendering a deterministic, sharp vector barcode
 * for tickets, wristbands, and mobile scanning.
 */
export default function Barcode({ value = '', height = 48, className = '', showText = true }) {
  if (!value) return null;

  // Generate deterministic bar widths based on char codes of value
  const bars = [];
  let currentX = 10;
  
  // Guard bars start (quiet zone + start pattern)
  bars.push({ x: currentX, width: 2 }); currentX += 3;
  bars.push({ x: currentX, width: 1 }); currentX += 2;
  bars.push({ x: currentX, width: 3 }); currentX += 5;

  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    const w1 = (code % 3) + 1;
    const s1 = ((code >> 1) % 2) + 1;
    const w2 = ((code >> 2) % 3) + 1;
    const s2 = ((code >> 3) % 2) + 2;
    
    bars.push({ x: currentX, width: w1 });
    currentX += w1 + s1;
    bars.push({ x: currentX, width: w2 });
    currentX += w2 + s2;
  }

  // Guard bars stop
  bars.push({ x: currentX, width: 3 }); currentX += 4;
  bars.push({ x: currentX, width: 1 }); currentX += 2;
  bars.push({ x: currentX, width: 2 }); currentX += 12;

  const totalWidth = currentX;

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full max-w-[240px] h-auto overflow-visible"
        style={{ minHeight: `${height}px` }}
        xmlns="http://www.w3.org/2000/svg"
        aria-label={`Code-barres ${value}`}
      >
        <rect x="0" y="0" width={totalWidth} height={height} fill="transparent" />
        {bars.map((bar, idx) => (
          <rect
            key={idx}
            x={bar.x}
            y="0"
            width={bar.width}
            height={height}
            fill="currentColor"
            rx="0.5"
          />
        ))}
      </svg>
      {showText && (
        <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground mt-1 uppercase font-semibold">
          {value}
        </span>
      )}
    </div>
  );
}
