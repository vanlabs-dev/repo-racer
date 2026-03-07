"use client";

export default function PixelLogo() {
  return (
    <div style={{
      position: "relative",
      display: "inline-block",
      width: "100%",
      padding: "12px 0 16px 0",
      overflow: "hidden",
    }}>

      {/* Speed lines — horizontal rules behind the text */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{
          position: "absolute",
          left: "-20px",
          right: "-20px",
          top: `${14 + i * 12}px`,
          height: "1px",
          background: "linear-gradient(90deg, transparent 0%, #e8a43008 30%, #e8a43003 70%, transparent 100%)",
          transform: "skewY(-1deg)",
        }} />
      ))}

      {/* REPO */}
      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(40px, 6vw, 64px)",
        fontWeight: 700,
        fontStyle: "italic",
        color: "#e8a430",
        textShadow: "0 0 20px #e8a43066, 0 0 40px #e8a43033",
        letterSpacing: "-0.02em",
        lineHeight: 1,
        textAlign: "center",
        position: "relative",
        zIndex: 1,
      }}>
        REPO
      </div>

      {/* RACER */}
      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(40px, 6vw, 64px)",
        fontWeight: 700,
        fontStyle: "italic",
        color: "#7ec85a",
        textShadow: "0 0 20px #7ec85a55, 0 0 40px #7ec85a22",
        letterSpacing: "-0.02em",
        lineHeight: 1,
        textAlign: "center",
        position: "relative",
        zIndex: 1,
        marginTop: "2px",
      }}>
        RACER
      </div>

      {/* Bottom accent line */}
      <div style={{
        marginTop: "10px",
        height: "2px",
        width: "100%",
        background: "linear-gradient(90deg, #e8a430 0%, #7ec85a 50%, transparent 100%)",
        transform: "skewX(-12deg)",
        position: "relative",
        zIndex: 1,
      }} />

    </div>
  );
}
