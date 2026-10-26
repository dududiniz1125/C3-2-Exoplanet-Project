// "Meet the locals": a stylised, hypothetical C3-2 creature and plants (inline SVG)
export const LOCALS_SVG = `
<svg viewBox="0 0 320 190" role="img" aria-label="Hypothetical C3-2 creature: tall, thin, long-legged with wide membrane wings, among dark red plants">
  <defs>
    <linearGradient id="lsky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2a1a3a"/>
      <stop offset="0.6" stop-color="#b85a2a"/>
      <stop offset="1" stop-color="#ffb35c"/>
    </linearGradient>
    <linearGradient id="lsea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0d5d63"/>
      <stop offset="1" stop-color="#042a33"/>
    </linearGradient>
    <linearGradient id="lwing" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4fd1c5" stop-opacity=".55"/>
      <stop offset="1" stop-color="#ffb36d" stop-opacity=".35"/>
    </linearGradient>
  </defs>
  <rect width="320" height="190" fill="url(#lsky)"/>
  <circle cx="250" cy="118" r="26" fill="#ffcf8a" opacity=".9"/>
  <rect y="132" width="320" height="58" fill="url(#lsea)"/>
  <path d="M0 150 Q60 128 120 146 T230 150 T320 146 V190 H0Z" fill="#1a0a0c"/>
  <!-- dark red / black plants -->
  <g fill="#3b0a12" stroke="#140306" stroke-width="1">
    <path d="M30 152 C26 120 40 104 34 84 C48 104 44 124 40 152Z"/>
    <path d="M42 152 C52 128 70 120 74 100 C76 124 62 136 52 152Z"/>
    <path d="M20 152 C10 134 4 122 6 106 C18 120 24 134 28 152Z"/>
    <path d="M262 150 C258 126 270 112 266 96 C280 114 276 130 272 150Z"/>
    <path d="M276 150 C288 132 300 128 306 112 C306 132 294 142 284 150Z"/>
  </g>
  <g fill="#6b0f1a" opacity=".8">
    <ellipse cx="34" cy="96" rx="4" ry="9"/>
    <ellipse cx="266" cy="104" rx="4" ry="9"/>
  </g>
  <!-- creature -->
  <g transform="translate(150 30)">
    <path d="M-6 52 C-60 30 -96 40 -118 66 C-86 60 -56 66 -8 66Z" fill="url(#lwing)" stroke="#bff5ef" stroke-opacity=".6"/>
    <path d="M6 52 C60 30 96 40 118 66 C86 60 56 66 8 66Z" fill="url(#lwing)" stroke="#bff5ef" stroke-opacity=".6"/>
    <path d="M-60 40 L-8 60 M-96 48 L-8 62 M60 40 L8 60 M96 48 L8 62" stroke="#bff5ef" stroke-opacity=".35" fill="none"/>
    <ellipse cx="0" cy="62" rx="9" ry="20" fill="#2c3550"/>
    <path d="M0 42 C-2 30 0 18 4 10" stroke="#2c3550" stroke-width="5" fill="none" stroke-linecap="round"/>
    <ellipse cx="7" cy="7" rx="9" ry="6" fill="#2c3550"/>
    <circle cx="11" cy="5" r="2" fill="#ffcf8a"/>
    <path d="M15 8 L24 10" stroke="#2c3550" stroke-width="2" stroke-linecap="round"/>
    <g stroke="#2c3550" stroke-width="3" fill="none" stroke-linecap="round">
      <path d="M-4 80 L-12 108 L-8 132"/>
      <path d="M4 80 L12 108 L9 132"/>
    </g>
  </g>
  <text x="10" y="18" fill="#fff" font-family="Space Grotesk, sans-serif" font-size="11" letter-spacing="1.5" opacity=".85">HYPOTHETICAL</text>
</svg>`;
