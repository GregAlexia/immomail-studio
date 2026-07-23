import { ImageResponse } from "next/og";

// Image de partage (OpenGraph/Twitter) générée à la volée — reprend les
// couleurs de marque de globals.css (teal #0d9488).
export const alt = "ImmoMail Studio — Démo automatisations agences immobilières";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0f766e 0%, #0d9488 55%, #14b8a6 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            fontSize: 64,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 88,
              height: 88,
              borderRadius: 20,
              background: "rgba(255,255,255,0.18)",
            }}
          >
            {/* Éclair (icône Zap de lucide) en SVG : les émojis ne sont pas rendus par Satori. */}
            <svg width="52" height="52" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          ImmoMail Studio
        </div>
        <div style={{ marginTop: 36, fontSize: 34, lineHeight: 1.4, opacity: 0.92, maxWidth: 940 }}>
          11 automatisations métier pour agences immobilières — démo interactive avec horloge simulée
        </div>
        <div
          style={{
            marginTop: 48,
            display: "flex",
            gap: "14px",
            fontSize: 24,
          }}
        >
          {["Prise de RDV", "Relances", "Quittances PDF", "Tri des emails IA"].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                padding: "10px 22px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.16)",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
