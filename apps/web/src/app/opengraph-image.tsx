import { ImageResponse } from "next/og";

export const alt = "Skin Hearten";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#f7efe7",
          color: "#1f1a17",
          padding: "72px 78px",
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              maxWidth: 760,
            }}
          >
            <div
              style={{
                fontSize: 26,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontFamily: "Arial, sans-serif",
                color: "#6a5d53",
              }}
            >
              Skin Hearten
            </div>
            <div
              style={{
                fontSize: 88,
                lineHeight: 0.92,
              }}
            >
              Skincare premium con direccion clara.
            </div>
          </div>

          <div
            style={{
              width: 260,
              height: 360,
              borderRadius: 56,
              background: "linear-gradient(180deg, #fffaf6 0%, #eadfd6 100%)",
              border: "1px solid rgba(31, 26, 23, 0.12)",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 18,
            fontSize: 26,
            color: "#4f463f",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <span>Manchas</span>
          <span>Antiedad</span>
          <span>Hidratacion</span>
          <span>Sensibilidad</span>
          <span>Proteccion solar</span>
        </div>
      </div>
    ),
    size,
  );
}
