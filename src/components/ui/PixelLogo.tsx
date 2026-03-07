"use client";

const PIXEL_SIZE = 8;
const PIXEL_GAP = 2;
const STEP = PIXEL_SIZE + PIXEL_GAP;

type PixelGrid = number[][];

const CHARS: Record<string, PixelGrid> = {
  R: [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
    [1, 0, 1, 0, 0],
    [1, 0, 0, 1, 0],
    [1, 0, 0, 0, 1],
  ],
  E: [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  P: [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
  ],
  O: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  A: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  C: [
    [0, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1],
  ],
};

function renderWord(
  word: string,
  color: string,
  glowColor: string,
  scale: number = 1
): React.ReactElement {
  const ps = PIXEL_SIZE * scale;
  const gap = PIXEL_GAP * scale;
  const step = ps + gap;
  const letterGap = gap * 3;
  const charWidth = 5 * step + letterGap;
  const totalWidth = word.length * charWidth;
  const totalHeight = 7 * step;

  return (
    <svg
      width={totalWidth}
      height={totalHeight}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      style={{ display: "block", filter: `drop-shadow(0 0 8px ${glowColor})` }}
    >
      {word.split("").map((letter, li) => {
        const pattern = CHARS[letter];
        if (!pattern) return null;
        const offsetX = li * charWidth;
        return pattern.flatMap((row, ri) =>
          row.map((on, ci) =>
            on ? (
              <rect
                key={`${li}-${ri}-${ci}`}
                x={offsetX + ci * step}
                y={ri * step}
                width={ps}
                height={ps}
                fill={color}
                rx={1}
              />
            ) : null
          )
        );
      })}
    </svg>
  );
}

export default function PixelLogo() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        padding: "16px 0 20px 0",
        position: "relative",
      }}
    >
      {/* Scanline overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 9px, rgba(0,0,0,0.15) 10px)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* REPO — amber */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {renderWord("REPO", "#e8a430", "#e8a43088", 1.1)}
      </div>

      {/* RACER — green */}
      <div style={{ position: "relative", zIndex: 1, transform: "skewX(-8deg)" }}>
        {renderWord("RACER", "#7ec85a", "#7ec85a88", 1.4)}
      </div>

      {/* Accent line */}
      <div
        style={{
          width: "100%",
          height: "2px",
          background:
            "linear-gradient(90deg, transparent, #e8a430 30%, #7ec85a 70%, transparent)",
          position: "relative",
          zIndex: 1,
        }}
      />
    </div>
  );
}
