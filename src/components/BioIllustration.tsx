/* Animated biology SVG illustration — cell structure with animated elements */
export default function BioIllustration() {
  return (
    <svg
      viewBox="0 0 460 460"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ width: "100%", maxWidth: 650, height: "auto", transform: "scale(1.15)" }}
    >
      <defs>
        {/* Gradients */}
        <radialGradient id="cellGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(196,31,31,0.18)" />
          <stop offset="100%" stopColor="rgba(196,31,31,0.03)" />
        </radialGradient>
        <radialGradient id="nucleusGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(196,31,31,0.35)" />
          <stop offset="100%" stopColor="rgba(90,10,10,0.6)" />
        </radialGradient>
        <radialGradient id="outerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(196,31,31,0.08)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <filter id="blur4">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
        </filter>
        <filter id="blur8">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
        </filter>
      </defs>

      {/* Outer ambient glow */}
      <ellipse cx="230" cy="230" rx="200" ry="200" fill="url(#outerGlow)" filter="url(#blur8)" />

      {/* Cell membrane — outer ring */}
      <ellipse cx="230" cy="230" rx="168" ry="148" stroke="rgba(196,31,31,0.22)" strokeWidth="1.5" fill="url(#cellGrad)" strokeDasharray="6 4">
        <animateTransform attributeName="transform" type="rotate" from="0 230 230" to="360 230 230" dur="60s" repeatCount="indefinite" />
      </ellipse>

      {/* Cell membrane inner edge */}
      <ellipse cx="230" cy="230" rx="156" ry="136" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />

      {/* Cytoplasm background */}
      <ellipse cx="230" cy="230" rx="155" ry="135" fill="rgba(255,255,255,0.03)" />

      {/* Nucleus */}
      <ellipse cx="230" cy="225" rx="56" ry="52" fill="url(#nucleusGrad)" stroke="rgba(196,31,31,0.5)" strokeWidth="1.5">
        <animate attributeName="rx" values="56;60;56" dur="4s" repeatCount="indefinite" />
        <animate attributeName="ry" values="52;56;52" dur="4s" repeatCount="indefinite" />
      </ellipse>

      {/* Nucleolus */}
      <ellipse cx="224" cy="220" rx="18" ry="16" fill="rgba(196,31,31,0.55)" stroke="rgba(232,114,114,0.4)" strokeWidth="1" />

      {/* Nuclear envelope dots */}
      {[0,40,80,120,160,200,240,280,320].map((deg, i) => {
        const r = 56, rx = 230 + r * Math.cos((deg * Math.PI) / 180), ry = 225 + 52 * Math.sin((deg * Math.PI) / 180);
        return (
          <circle key={i} cx={rx} cy={ry} r="2.5" fill="rgba(232,114,114,0.7)">
            <animate attributeName="opacity" values="0.4;1;0.4" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
          </circle>
        );
      })}

      {/* Mitochondria - 3 organelles */}
      <g transform="translate(310, 175) rotate(-20)">
        <ellipse cx="0" cy="0" rx="28" ry="13" fill="rgba(196,31,31,0.25)" stroke="rgba(196,31,31,0.5)" strokeWidth="1.2" />
        <path d="M-16 -3 Q-8 -9 0 -3 Q8 3 16 -3" stroke="rgba(232,114,114,0.6)" strokeWidth="0.8" fill="none" />
        <path d="M-12 3 Q-4 -3 4 3 Q12 9 20 3" stroke="rgba(232,114,114,0.5)" strokeWidth="0.8" fill="none" />
        <animateTransform attributeName="transform" type="translate" values="310,-5 175,0;310,5 175,0;310,-5 175,0" additive="sum" dur="5s" repeatCount="indefinite"/>
      </g>

      <g transform="translate(148, 175) rotate(15)">
        <ellipse cx="0" cy="0" rx="24" ry="11" fill="rgba(196,31,31,0.2)" stroke="rgba(196,31,31,0.45)" strokeWidth="1.2" />
        <path d="M-14 -2 Q-6 -8 2 -2 Q10 4 18 -2" stroke="rgba(232,114,114,0.5)" strokeWidth="0.8" fill="none" />
        <animateTransform attributeName="transform" type="translate" values="0,-6;0,6;0,-6" additive="sum" dur="6s" repeatCount="indefinite"/>
      </g>

      <g transform="translate(270, 305) rotate(-10)">
        <ellipse cx="0" cy="0" rx="26" ry="12" fill="rgba(196,31,31,0.22)" stroke="rgba(196,31,31,0.48)" strokeWidth="1.2" />
        <path d="M-15 -2 Q-7 -8 1 -2 Q9 4 17 -2" stroke="rgba(232,114,114,0.55)" strokeWidth="0.8" fill="none" />
        <animateTransform attributeName="transform" type="translate" values="0,5;0,-5;0,5" additive="sum" dur="4.5s" repeatCount="indefinite"/>
      </g>

      {/* Ribosomes — small dots scattered */}
      {[
        [175, 260], [190, 285], [270, 160], [295, 250],
        [165, 200], [295, 290], [255, 165], [175, 310],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill="rgba(232,114,114,0.45)">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur={`${1.5 + i * 0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* Endoplasmic Reticulum — wavy lines */}
      <path d="M175 255 Q185 245 195 255 Q205 265 215 255 Q225 245 235 255" stroke="rgba(196,31,31,0.35)" strokeWidth="1.2" fill="none">
        <animate attributeName="d" values="M175 255 Q185 245 195 255 Q205 265 215 255 Q225 245 235 255;M175 258 Q185 248 195 258 Q205 268 215 258 Q225 248 235 258;M175 255 Q185 245 195 255 Q205 265 215 255 Q225 245 235 255" dur="3s" repeatCount="indefinite" />
      </path>
      <path d="M175 265 Q185 255 195 265 Q205 275 215 265 Q225 255 235 265" stroke="rgba(196,31,31,0.25)" strokeWidth="1" fill="none" />

      {/* Floating particles outside cell */}
      {[
        [75, 130, 3, "2.5s"], [380, 100, 2.5, "3.5s"], [60, 320, 2, "4s"],
        [400, 340, 3, "2s"], [105, 380, 2.5, "3s"], [350, 390, 2, "4.5s"],
      ].map(([x, y, r, dur], i) => (
        <circle key={i} cx={x as number} cy={y as number} r={r as number} fill="rgba(196,31,31,0.4)">
          <animate attributeName="cy" values={`${y};${(y as number) - 12};${y}`} dur={dur as string} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.7;0.2" dur={dur as string} repeatCount="indefinite" />
        </circle>
      ))}

      {/* DNA double helix strands — right side */}
      <g transform="translate(370,145)">
        {[0,1,2,3,4,5,6,7].map((i) => {
          const y = i * 22, offset = i % 2 === 0 ? 14 : -14;
          return (
            <g key={i}>
              <line x1={-offset} y1={y} x2={offset} y2={y} stroke="rgba(196,31,31,0.5)" strokeWidth="1.2" />
              <circle cx={-offset} cy={y} r="3.5" fill="rgba(196,31,31,0.6)">
                <animate attributeName="r" values="3.5;4.5;3.5" dur={`${1.8 + i*0.2}s`} repeatCount="indefinite"/>
              </circle>
              <circle cx={offset} cy={y} r="3.5" fill="rgba(90,10,10,0.7)">
                <animate attributeName="r" values="3.5;4.5;3.5" dur={`${2 + i*0.2}s`} repeatCount="indefinite"/>
              </circle>
            </g>
          );
        })}
        <path d="M-14,0 Q0,11 14,22 Q0,33 -14,44 Q0,55 14,66 Q0,77 -14,88 Q0,99 14,110 Q0,121 -14,132 Q0,143 14,154" stroke="rgba(196,31,31,0.4)" strokeWidth="1.5" fill="none">
          <animate attributeName="stroke-dashoffset" from="0" to="200" dur="4s" repeatCount="indefinite"/>
        </path>
        <path d="M14,0 Q0,11 -14,22 Q0,33 14,44 Q0,55 -14,66 Q0,77 14,88 Q0,99 -14,110 Q0,121 14,132 Q0,143 -14,154" stroke="rgba(90,10,10,0.5)" strokeWidth="1.5" fill="none" />
      </g>

      {/* Corner label chips removed */}
    </svg>
  );
}
