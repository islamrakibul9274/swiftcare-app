import { ImageResponse } from "next/og";
export const alt = "SwiftCare — Care in focus. Everything connected.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 80,
        background: "#ffffff",
        color: "#1b1b1f",
        fontFamily: "sans-serif",
        border: "1px solid #e8e8ed",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        swiftcare
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 90,
          fontSize: 70,
          fontWeight: 600,
          letterSpacing: -3,
          lineHeight: 1.1,
        }}
      >
        <span>Care in focus.</span>
        <span style={{ color: "#8b8b94" }}>Everything connected.</span>
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 45,
          fontSize: 23,
          color: "#6b6b75",
        }}
      >
        Your connected ABA care workspace.
      </div>
    </div>,
    size,
  );
}
