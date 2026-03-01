import { ImageResponse } from "next/og";

export const alt = "CelebBoard — Team Celebration Software for Office TVs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0A0A0A 0%, #1a1a1a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "#FAFAFA",
              letterSpacing: "-0.02em",
            }}
          >
            CelebBoard
          </span>
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#A3A3A3",
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          Team Celebration Software for Office TVs
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 32,
            padding: "12px 24px",
            backgroundColor: "#F59E0B",
            borderRadius: 8,
            color: "#0F172A",
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          Wins happen. Make sure your team sees them.
        </div>
      </div>
    ),
    { ...size }
  );
}
