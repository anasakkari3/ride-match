'use client';

import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  Sequence,
  useVideoConfig,
} from 'remotion';

// ─── helpers ────────────────────────────────────────────────────────────────

function clamp(v: number, lo = 0, hi = 1) {
  return Math.min(hi, Math.max(lo, v));
}

function fadeIn(frame: number, start: number, dur = 15) {
  return clamp(interpolate(frame, [start, start + dur], [0, 1]));
}

function fadeOut(frame: number, end: number, dur = 15) {
  return clamp(interpolate(frame, [end - dur, end], [1, 0]));
}

function sceneFade(frame: number, totalDur: number) {
  return Math.min(fadeIn(frame, 0), fadeOut(frame, totalDur));
}

function draw(frame: number, start: number, end: number, pathLen: number) {
  const p = clamp(interpolate(frame, [start, end], [0, 1]));
  return `${pathLen} ${pathLen * (1 - p)}`;
}

// ─── Scene 1 — Stressed student ─────────────────────────────────────────────
// "لسا بتتأخر عالجامعة؟"

function Scene1() {
  const frame = useCurrentFrame();
  // No fade-out — scene 2 cuts in hard
  const fadeInOpacity = clamp(interpolate(frame, [0, 6], [0, 1]));
  const wobble = Math.sin(frame * 0.45) * 2;
  const legSwing = Math.sin(frame * 0.38) * 16;

  // Part 1: "لسا بتتأخر" — pops at frame 36
  const text1Scale = spring({ frame: Math.max(0, frame - 36), fps: 30, config: { damping: 10, stiffness: 340 } });
  // Part 2: "عالجامعة؟" — follows 7 frames later (≈0.23s)
  const text2Scale = spring({ frame: Math.max(0, frame - 43), fps: 30, config: { damping: 10, stiffness: 320 } });
  // Shake settles in 12 frames (faster than before)
  const textShake = frame >= 36
    ? Math.sin((frame - 36) * 1.5) * Math.max(0, 1 - (frame - 36) / 12) * 5
    : 0;

  return (
    <AbsoluteFill style={{ opacity: fadeInOpacity, background: '#FAF9F6' }}>
      <svg viewBox="0 0 300 620" width="300" height="620" style={{ overflow: 'visible' }}>

        {/* Clock — top left, fast draw */}
        <circle cx="62" cy="72" r="28"
          fill="none" stroke="#CBD5E1" strokeWidth="2"
          strokeDasharray={draw(frame, 2, 10, 176)}
        />
        <line x1="62" y1="72" x2="62" y2="50"
          stroke="#EF4444" strokeWidth="2.5" opacity={fadeIn(frame, 9, 4)} />
        <line x1="62" y1="72" x2="38" y2="72"
          stroke="#EF4444" strokeWidth="2.5" opacity={fadeIn(frame, 10, 4)} />
        <text x="62" y="112" textAnchor="middle" fontSize="11"
          fill="#EF4444" fontWeight="bold" opacity={fadeIn(frame, 12, 5)}>
          متأخر!
        </text>

        {/* Head — fast draw */}
        <ellipse cx="150" cy="158" rx="29" ry="32"
          fill="#FFF8F0" stroke="#2C2C2C" strokeWidth="2.5"
          strokeDasharray={draw(frame, 3, 14, 193)}
          style={{ transform: `rotate(${wobble * 0.5}deg)`, transformOrigin: '150px 158px' }}
        />

        {/* Messy hair spikes — fast */}
        {[-16, -5, 6, 17].map((dx, i) => (
          <path key={i}
            d={`M ${150 + dx} 127 Q ${150 + dx + (i % 2 === 0 ? -4 : 4)} ${111} ${150 + dx + (i % 2 === 0 ? -7 : 7)} 118`}
            fill="none" stroke="#2C2C2C" strokeWidth="2"
            opacity={fadeIn(frame, 10 + i, 4)}
          />
        ))}

        {/* Worried eyebrows */}
        <path d="M 135 144 Q 141 139 148 144"
          fill="none" stroke="#2C2C2C" strokeWidth="2.5"
          strokeDasharray={draw(frame, 12, 18, 20)} />
        <path d="M 153 144 Q 159 139 165 144"
          fill="none" stroke="#2C2C2C" strokeWidth="2.5"
          strokeDasharray={draw(frame, 12, 18, 20)} />

        {/* × eyes */}
        <text x="141" y="158" textAnchor="middle" fontSize="13"
          fill="#2C2C2C" opacity={fadeIn(frame, 16, 5)}>×</text>
        <text x="159" y="158" textAnchor="middle" fontSize="13"
          fill="#2C2C2C" opacity={fadeIn(frame, 16, 5)}>×</text>

        {/* Sweat drops */}
        <path d="M 181 136 Q 187 125 183 132"
          fill="#93C5FD" stroke="#93C5FD" strokeWidth="1.5"
          opacity={fadeIn(frame, 17, 4) * 0.9} />
        <path d="M 189 150 Q 195 139 191 146"
          fill="#93C5FD" stroke="#93C5FD" strokeWidth="1.5"
          opacity={fadeIn(frame, 19, 4) * 0.9} />

        {/* Stress lines — fast flicker */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const flicker = interpolate((frame + i * 5) % 14, [0, 7, 14], [0.5, 1, 0.5]);
          return (
            <line key={i}
              x1={150 + Math.cos(rad) * 38}
              y1={158 + Math.sin(rad) * 38}
              x2={150 + Math.cos(rad) * 50}
              y2={158 + Math.sin(rad) * 50}
              stroke="#EF4444" strokeWidth="2"
              opacity={fadeIn(frame, 18, 5) * flicker}
            />
          );
        })}

        {/* Body */}
        <line x1="150" y1="190" x2="150" y2="265"
          stroke="#2C2C2C" strokeWidth="2.5"
          strokeDasharray={draw(frame, 16, 24, 75)} />

        {/* Backpack */}
        <rect x="154" y="198" width="20" height="28" rx="5"
          fill="#E0E7FF" stroke="#2C2C2C" strokeWidth="2"
          opacity={fadeIn(frame, 22, 5)} />

        {/* Running arms */}
        <path d={`M 150 208 L ${122 - legSwing * 0.4} ${226 + legSwing * 0.2}`}
          fill="none" stroke="#2C2C2C" strokeWidth="2.5"
          strokeDasharray={draw(frame, 20, 28, 34)} />
        <path d={`M 150 208 L ${178 + legSwing * 0.4} ${220 - legSwing * 0.2}`}
          fill="none" stroke="#2C2C2C" strokeWidth="2.5"
          strokeDasharray={draw(frame, 20, 28, 34)} />

        {/* Running legs */}
        <path d={`M 150 265 L ${139 + legSwing * 0.6} 308 L ${130 + legSwing * 0.3} 328`}
          fill="none" stroke="#2C2C2C" strokeWidth="2.5"
          strokeDasharray={draw(frame, 22, 32, 75)} />
        <path d={`M 150 265 L ${161 - legSwing * 0.6} 308 L ${170 - legSwing * 0.3} 328`}
          fill="none" stroke="#2C2C2C" strokeWidth="2.5"
          strokeDasharray={draw(frame, 22, 32, 75)} />

        {/* Main text split — reading rhythm */}
        {/* Part 1: "لسا بتتأخر" */}
        <g transform={`translate(${150 + textShake}, 406) scale(${text1Scale})`}>
          <text
            textAnchor="middle" fontSize="25" fontWeight="800"
            fill="#EF4444" fontFamily="'Segoe UI', 'Noto Sans Arabic', Arial">
            لسا بتتأخر
          </text>
        </g>
        {/* Part 2: "عالجامعة؟" — follows 7f later, no shake */}
        <g transform={`translate(150, 434) scale(${text2Scale})`}>
          <text
            textAnchor="middle" fontSize="25" fontWeight="800"
            fill="#EF4444" fontFamily="'Segoe UI', 'Noto Sans Arabic', Arial">
            عالجامعة؟
          </text>
        </g>

        {/* Underline — draws fast after second part */}
        <path d="M 48 448 Q 150 456 252 448"
          fill="none" stroke="#EF4444" strokeWidth="2.5"
          strokeDasharray={draw(frame, 44, 54, 210)}
          opacity={fadeIn(frame, 43, 4)}
        />
      </svg>
    </AbsoluteFill>
  );
}

// ─── Scene 2 — Transportation chaos (structured, focused, hard-stops) ────────

function Scene2() {
  const frame = useCurrentFrame();
  const { durationInFrames: dur } = useVideoConfig();

  // Tension zone: dur-12 to dur-4 → slow down (anticipation pause)
  // Hard stop: dur-4 to end → fully frozen
  const tensionStart = dur - 12;
  const freezeStart = dur - 4;
  const isFrozen = frame >= freezeStart;
  const inTension = frame >= tensionStart && !isFrozen;

  // Motion frame: in tension slows to ~80% speed, frozen holds last pre-tension frame
  const motionFrame = isFrozen
    ? tensionStart + 6          // hold a mid-tension frame
    : inTension
      ? tensionStart + (frame - tensionStart) * 0.5  // half-speed tension
      : frame;

  // Chaos rotation: slows during tension, stops when frozen
  const chaosRotate = isFrozen ? 0
    : inTension ? Math.sin(motionFrame * 0.32) * 2   // reduced in tension
    : Math.sin(motionFrame * 0.32) * 5;

  const car1X = interpolate(
    spring({ frame: Math.max(0, motionFrame - 3), fps: 30, config: { damping: 14, stiffness: 110 } }),
    [0, 1], [-180, 0]
  );
  const car2X = interpolate(
    spring({ frame: Math.max(0, motionFrame - 5), fps: 30, config: { damping: 14, stiffness: 110 } }),
    [0, 1], [180, 0]
  );

  // Speed lines fade during tension, gone when frozen
  const speedLineOpacity = isFrozen ? 0 : inTension ? 0.3 : 1;

  // Opacity: instant in, stays solid, NO fade out (hard cut to scene 3)
  const opacity = clamp(interpolate(frame, [0, 4], [0, 1]));

  return (
    <AbsoluteFill style={{ opacity, background: '#FAF9F6' }}>
      <svg viewBox="0 0 300 620" width="300" height="620">

        {/* Road 1 */}
        <rect x="0" y="175" width="300" height="56" rx="0"
          fill="#F1F5F9" opacity={1} />
        <line x1="0" y1="203" x2="300" y2="203"
          stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="20 14" />

        {/* Road 2 */}
        <rect x="0" y="310" width="300" height="56" rx="0"
          fill="#F1F5F9" opacity={1} />
        <line x1="0" y1="338" x2="300" y2="338"
          stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="20 14" />

        {/* Car 1 — coming from left */}
        <g transform={`translate(${20 + car1X}, 178)`} opacity={fadeIn(frame, 3, 6)}>
          <rect x="0" y="0" width="62" height="28" rx="8"
            fill="none" stroke="#FB7185" strokeWidth="2.5" />
          <rect x="14" y="4" width="34" height="14" rx="4"
            fill="none" stroke="#FB7185" strokeWidth="1.5" opacity={0.7} />
          <circle cx="13" cy="30" r="7" fill="none" stroke="#FB7185" strokeWidth="2" />
          <circle cx="49" cy="30" r="7" fill="none" stroke="#FB7185" strokeWidth="2" />
          {/* Speed lines */}
          {[0, 1, 2].map((i) => (
            <line key={i}
              x1={-8 - i * 10} y1={8 + i * 6}
              x2={-20 - i * 10} y2={8 + i * 6}
              stroke="#FECDD3" strokeWidth={2 - i * 0.5}
              opacity={(0.8 - i * 0.2) * speedLineOpacity}
            />
          ))}
        </g>

        {/* Car 2 — coming from right, opposite direction */}
        <g transform={`translate(${220 + car2X}, 313)`} opacity={fadeIn(frame, 5, 6)}>
          <rect x="0" y="0" width="58" height="26" rx="7"
            fill="none" stroke="#60A5FA" strokeWidth="2.5" />
          <rect x="12" y="4" width="32" height="13" rx="4"
            fill="none" stroke="#60A5FA" strokeWidth="1.5" opacity={0.7} />
          <circle cx="12" cy="28" r="6" fill="none" stroke="#60A5FA" strokeWidth="2" />
          <circle cx="46" cy="28" r="6" fill="none" stroke="#60A5FA" strokeWidth="2" />
          {/* Speed lines going right */}
          {[0, 1, 2].map((i) => (
            <line key={i}
              x1={64 + i * 10} y1={7 + i * 5}
              x2={76 + i * 10} y2={7 + i * 5}
              stroke="#BFDBFE" strokeWidth={2 - i * 0.5}
              opacity={(0.8 - i * 0.2) * speedLineOpacity}
            />
          ))}
        </g>

        {/* 3 intentional chaos arrows — centered, clear */}
        <g transform={`translate(150, 268) rotate(${chaosRotate})`}
          opacity={fadeIn(frame, 10, 8)}>
          <line x1={-18} y1={0} x2={18} y2={0} stroke="#F59E0B" strokeWidth="3" />
          <path d="M 9 -7 L 18 0 L 9 7" fill="none" stroke="#F59E0B" strokeWidth="3" strokeLinejoin="round" />
          <path d="M -9 -7 L -18 0 L -9 7" fill="none" stroke="#F59E0B" strokeWidth="3" strokeLinejoin="round" />
        </g>

        <g transform={`translate(72, 250) rotate(${50 + chaosRotate * 1.4})`}
          opacity={fadeIn(frame, 14, 6)}>
          <line x1={-12} y1={0} x2={12} y2={0} stroke="#F59E0B" strokeWidth="2.5" />
          <path d="M 4 -5 L 12 0 L 4 5" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinejoin="round" />
        </g>

        <g transform={`translate(228, 258) rotate(${-40 + chaosRotate * 1.2})`}
          opacity={fadeIn(frame, 16, 6)}>
          <line x1={-12} y1={0} x2={12} y2={0} stroke="#F59E0B" strokeWidth="2.5" />
          <path d="M 4 -5 L 12 0 L 4 5" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinejoin="round" />
        </g>

        {/* Collision warning — dims during tension, freezes */}
        <text x="150" y="300"
          textAnchor="middle" fontSize="26"
          opacity={isFrozen ? 0.7 : inTension ? 0.7 : interpolate((frame + 3) % 18, [0, 9, 18], [0.6, 1, 0.6])}>
          ⚡
        </text>

        {/* Dominant text — fast pop */}
        <g transform={`translate(150, 430)`}
          opacity={fadeIn(frame, 20, 6)}>
          <text textAnchor="middle" fontSize="21" fontWeight="800"
            fill="#1E293B" fontFamily="'Segoe UI', 'Noto Sans Arabic', Arial">
            فوضى… ما في حل؟
          </text>
        </g>

        {/* Scale-snap impact at freeze point — whole scene snaps 1% then back */}
        {/* Implemented as a transform on a transparent rect that SVG can't do directly, */}
        {/* so we use a subtle vignette pulse instead */}
        {isFrozen && (
          <rect x="0" y="0" width="300" height="620"
            fill="#1E293B"
            opacity={interpolate(frame, [freezeStart, freezeStart + 1, freezeStart + 3], [0, 0.08, 0])}
          />
        )}

        {/* Freeze flash — softer, max 0.60 (was 0.85) */}
        {isFrozen && (
          <rect x="0" y="0" width="300" height="620"
            fill="white"
            opacity={interpolate(frame, [freezeStart, freezeStart + 1, dur - 1], [0, 0.60, 0.60])}
          />
        )}
      </svg>
    </AbsoluteFill>
  );
}

// ─── Scene 3 — App appears (clean hard cut from chaos freeze) ────────────────

function Scene3() {
  const frame = useCurrentFrame();
  const { durationInFrames: dur } = useVideoConfig();
  // Clean fade-out only (no fade-in — hard cut from chaos freeze)
  const opacity = fadeOut(frame, dur, 12);

  // Micro-pause: last 15 frames — freeze all motion
  const pauseStart = dur - 15;
  const motionF = Math.min(frame, pauseStart);

  // Phone enters fast with slight overshoot
  const phoneScale = spring({ frame: motionF, fps: 30, config: { damping: 16, stiffness: 160 } });
  const phoneY = interpolate(phoneScale, [0, 1], [40, 0]);
  const uiIn = fadeIn(motionF, 18, 10);
  const cardIn = (delay: number) => fadeIn(motionF, delay, 8);

  // Second text float: rises from +8px to 0, delayed 0.2s (6f) after phone
  const textFloat = interpolate(
    spring({ frame: Math.max(0, motionF - 50), fps: 30, config: { damping: 20, stiffness: 80 } }),
    [0, 1], [8, 0]
  );

  return (
    <AbsoluteFill style={{ opacity, background: '#FFFFFF' }}>
      <svg viewBox="0 0 300 620" width="300" height="620">

        {/* Calm background glow — centered on phone */}
        <defs>
          <radialGradient id="phoneGlow" cx="50%" cy="45%" r="45%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Dim vignette corners — draws eye to center phone */}
        <defs>
          <radialGradient id="vignette" cx="50%" cy="45%" r="55%">
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.55" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="300" height="620"
          fill="url(#vignette)" opacity={phoneScale} />

        <ellipse cx="150" cy="270" rx="130" ry="175"
          fill="url(#phoneGlow)" opacity={phoneScale * 0.9} />

        {/* "في طريقة أسهل." — calm float-in, delayed 0.2s after phone */}
        <g transform={`translate(0, ${textFloat})`}>
          <text x="150" y="528"
            textAnchor="middle" fontSize="19" fontWeight="700"
            fill="#0F172A" fontFamily="'Segoe UI', 'Noto Sans Arabic', Arial"
            opacity={fadeIn(motionF, 50, 16)}>
            في طريقة أسهل.
          </text>
          <text x="150" y="554"
            textAnchor="middle" fontSize="13" fontWeight="400"
            fill="#64748B" fontFamily="'Segoe UI', 'Noto Sans Arabic', Arial"
            opacity={fadeIn(motionF, 58, 14)}>
            بطريقك — رحلات جامعية منظمة
          </text>
        </g>

        {/* Phone frame */}
        <g transform={`translate(0, ${phoneY})`}>
          <rect x="72" y="58" width="156" height="295" rx="20"
            fill="white" stroke="#0F172A" strokeWidth="3"
            opacity={phoneScale} />
          {/* Notch */}
          <rect x="116" y="58" width="68" height="12" rx="6"
            fill="#0F172A" opacity={phoneScale} />

          {/* App header bar */}
          <rect x="72" y="70" width="156" height="38" rx="0"
            fill="#0EA5E9" opacity={uiIn} />
          <text x="150" y="94"
            textAnchor="middle" fontSize="13" fontWeight="700"
            fill="white" fontFamily="'Segoe UI', Arial"
            opacity={uiIn}>
            بطريقك 🚗
          </text>

          {/* Search bar */}
          <rect x="82" y="116" width="136" height="26" rx="13"
            fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1.5"
            opacity={cardIn(28)} />
          <text x="150" y="133"
            textAnchor="middle" fontSize="10" fill="#94A3B8"
            fontFamily="'Segoe UI', Arial"
            opacity={cardIn(28)}>
            🔍  ابحث عن رحلة...
          </text>

          {/* Trip card 1 */}
          <rect x="82" y="150" width="136" height="48" rx="10"
            fill="white" stroke="#E2E8F0" strokeWidth="1.5"
            opacity={cardIn(34)} />
          <rect x="82" y="150" width="4" height="48" rx="2"
            fill="#F59E0B" opacity={cardIn(34)} />
          <circle cx="98" cy="165" r="7"
            fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5"
            opacity={cardIn(34)} />
          <text x="112" y="168" fontSize="9" fontWeight="600"
            fill="#1E293B" fontFamily="'Segoe UI', Arial"
            opacity={cardIn(34)}>محمد أ.</text>
          <text x="112" y="180" fontSize="8" fill="#64748B"
            fontFamily="'Segoe UI', Arial"
            opacity={cardIn(34)}>عمّان ← الجامعة</text>
          <rect x="170" y="157" width="38" height="14" rx="7"
            fill="#0EA5E9" opacity={cardIn(36)} />
          <text x="189" y="167" textAnchor="middle" fontSize="7"
            fontWeight="700" fill="white"
            fontFamily="'Segoe UI', Arial"
            opacity={cardIn(36)}>8:30 ص</text>

          {/* Trip card 2 */}
          <rect x="82" y="206" width="136" height="48" rx="10"
            fill="white" stroke="#E2E8F0" strokeWidth="1.5"
            opacity={cardIn(40)} />
          <rect x="82" y="206" width="4" height="48" rx="2"
            fill="#38BDF8" opacity={cardIn(40)} />
          <circle cx="98" cy="221" r="7"
            fill="#E0F2FE" stroke="#38BDF8" strokeWidth="1.5"
            opacity={cardIn(40)} />
          <text x="112" y="224" fontSize="9" fontWeight="600"
            fill="#1E293B" fontFamily="'Segoe UI', Arial"
            opacity={cardIn(40)}>سارة م.</text>
          <text x="112" y="236" fontSize="8" fill="#64748B"
            fontFamily="'Segoe UI', Arial"
            opacity={cardIn(40)}>الصويفية ← الجامعة</text>
          <rect x="170" y="213" width="38" height="14" rx="7"
            fill="#0EA5E9" opacity={cardIn(42)} />
          <text x="189" y="223" textAnchor="middle" fontSize="7"
            fontWeight="700" fill="white"
            fontFamily="'Segoe UI', Arial"
            opacity={cardIn(42)}>8:45 ص</text>

          {/* Home bar */}
          <rect x="130" y="344" width="40" height="3" rx="2"
            fill="#CBD5E1" opacity={phoneScale} />
        </g>

        {/* Arrow pointing to phone */}
        <g opacity={fadeIn(frame, 55)}>
          <path d="M 48 340 Q 40 310 55 290"
            fill="none" stroke="#0EA5E9" strokeWidth="2"
            strokeDasharray={draw(frame, 55, 68, 65)} />
          <polygon points="55,285 48,298 62,295"
            fill="#0EA5E9" opacity={fadeIn(frame, 68)} />
          <text x="20" y="356"
            fontSize="11" fill="#0EA5E9" fontWeight="600"
            fontFamily="'Segoe UI', Arial"
            opacity={fadeIn(frame, 58)}>تطبيقنا</text>
        </g>

        {/* Bottom text */}
        <text x="150" y="424"
          textAnchor="middle" fontSize="17" fontWeight="700"
          fill="#0F172A" fontFamily="'Segoe UI', 'Noto Sans Arabic', Arial"
          opacity={fadeIn(frame, 60)}>
          رحلات منظمة بنقرة واحدة
        </text>
      </svg>
    </AbsoluteFill>
  );
}

// ─── Scene 4 — Trip selection & booking ─────────────────────────────────────

function Scene4() {
  const frame = useCurrentFrame();
  const { durationInFrames: dur } = useVideoConfig();
  const opacity = sceneFade(frame, dur);

  const tapPulse = spring({ frame: Math.max(0, frame - 42), fps: 30, config: { damping: 8, stiffness: 200 } });
  const buttonScale = 1 + tapPulse * 0.08;
  const confirmOpacity = fadeIn(frame, 52);
  const checkScale = spring({ frame: Math.max(0, frame - 54), fps: 30, config: { damping: 12, stiffness: 180 } });

  return (
    <AbsoluteFill style={{ opacity, background: '#FAF9F6' }}>
      <svg viewBox="0 0 300 620" width="300" height="620">

        {/* Header */}
        <text x="150" y="48"
          textAnchor="middle" fontSize="16" fontWeight="700"
          fill="#1E293B" fontFamily="'Segoe UI', 'Noto Sans Arabic', Arial"
          opacity={fadeIn(frame, 5)}>
          اختر رحلتك 🎯
        </text>

        {/* Large trip card */}
        <rect x="30" y="68" width="240" height="170" rx="18"
          fill="white" stroke="#E2E8F0" strokeWidth="2"
          opacity={fadeIn(frame, 8)}
          style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))' }} />
        <rect x="30" y="68" width="6" height="170" rx="3"
          fill="#F59E0B" opacity={fadeIn(frame, 8)} />

        {/* Driver info */}
        <circle cx="68" cy="105" r="18"
          fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2"
          opacity={fadeIn(frame, 12)} />
        <text x="68" y="111" textAnchor="middle" fontSize="18"
          opacity={fadeIn(frame, 12)}>👦</text>
        <text x="96" y="102" fontSize="13" fontWeight="700"
          fill="#1E293B" fontFamily="'Segoe UI', Arial"
          opacity={fadeIn(frame, 14)}>أحمد السيد</text>
        <text x="96" y="118" fontSize="11" fill="#64748B"
          fontFamily="'Segoe UI', Arial"
          opacity={fadeIn(frame, 14)}>⭐ 4.9  |  40 رحلة</text>

        {/* Route */}
        <circle cx="55" cy="150" r="5" fill="#38BDF8"
          opacity={fadeIn(frame, 18)} />
        <line x1="55" y1="155" x2="55" y2="178"
          stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 3"
          opacity={fadeIn(frame, 18)} />
        <circle cx="55" cy="183" r="5" fill="none" stroke="#10B981" strokeWidth="2"
          opacity={fadeIn(frame, 20)} />
        <text x="68" y="155" fontSize="11" fontWeight="600"
          fill="#1E293B" fontFamily="'Segoe UI', Arial"
          opacity={fadeIn(frame, 18)}>عمّان الغربية</text>
        <text x="68" y="187" fontSize="11" fontWeight="600"
          fill="#1E293B" fontFamily="'Segoe UI', Arial"
          opacity={fadeIn(frame, 20)}>الجامعة الأردنية</text>

        {/* Time & seats */}
        <rect x="50" y="200" width="68" height="22" rx="11"
          fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="1.5"
          opacity={fadeIn(frame, 22)} />
        <text x="84" y="214" textAnchor="middle" fontSize="10" fontWeight="600"
          fill="#0EA5E9" fontFamily="'Segoe UI', Arial"
          opacity={fadeIn(frame, 22)}>🕗  8:30 ص</text>
        <rect x="130" y="200" width="68" height="22" rx="11"
          fill="#F0FDF4" stroke="#BBF7D0" strokeWidth="1.5"
          opacity={fadeIn(frame, 24)} />
        <text x="164" y="214" textAnchor="middle" fontSize="10" fontWeight="600"
          fill="#10B981" fontFamily="'Segoe UI', Arial"
          opacity={fadeIn(frame, 24)}>💺  مقعدان</text>
        <rect x="210" y="200" width="48" height="22" rx="11"
          fill="#FFF7ED" stroke="#FED7AA" strokeWidth="1.5"
          opacity={fadeIn(frame, 26)} />
        <text x="234" y="214" textAnchor="middle" fontSize="10" fontWeight="600"
          fill="#F59E0B" fontFamily="'Segoe UI', Arial"
          opacity={fadeIn(frame, 26)}>3 ₪</text>

        {/* Confirm booking button */}
        <g transform={`translate(150, 310) scale(${buttonScale}) translate(-110, -22)`}>
          <rect x="0" y="0" width="220" height="44" rx="22"
            fill="#0EA5E9" opacity={fadeIn(frame, 32)}
            style={{ filter: tapPulse > 0 ? `drop-shadow(0 0 ${tapPulse * 12}px rgba(14,165,233,0.6))` : 'none' }} />
          <text x="110" y="27" textAnchor="middle"
            fontSize="15" fontWeight="700" fill="white"
            fontFamily="'Segoe UI', 'Noto Sans Arabic', Arial"
            opacity={fadeIn(frame, 32)}>
            تأكيد الحجز ✓
          </text>
        </g>

        {/* Tap finger */}
        <g opacity={clamp(interpolate(frame, [38, 44, 52, 58], [0, 1, 1, 0]))}>
          <text x="220" y="335" fontSize="26">👆</text>
        </g>

        {/* Tap ripples */}
        {[0, 1, 2].map((i) => {
          const rFrame = Math.max(0, frame - 42 - i * 6);
          const rProgress = clamp(interpolate(rFrame, [0, 20], [0, 1]));
          return (
            <circle key={i}
              cx="200" cy="312" r={rProgress * 35}
              fill="none" stroke="#0EA5E9"
              strokeWidth={2 - rProgress * 1.5}
              opacity={(1 - rProgress) * 0.5}
            />
          );
        })}

        {/* Confirmation */}
        <g opacity={confirmOpacity}>
          <rect x="60" y="378" width="180" height="66" rx="14"
            fill="#F0FDF4" stroke="#86EFAC" strokeWidth="2" />
          <g transform={`translate(150, 405) scale(${checkScale})`}>
            <circle cx="0" cy="0" r="14" fill="#22C55E" />
            <path d="M -7 0 L -2 6 L 8 -5" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </g>
          <text x="150" y="432"
            textAnchor="middle" fontSize="13" fontWeight="700"
            fill="#166534" fontFamily="'Segoe UI', 'Noto Sans Arabic', Arial">
            تم الحجز بنجاح! 🎉
          </text>
        </g>

        {/* Bottom encouragement */}
        <text x="150" y="510"
          textAnchor="middle" fontSize="14" fontWeight="600"
          fill="#94A3B8" fontFamily="'Segoe UI', Arial"
          opacity={fadeIn(frame, 62)}>
          بنقرة واحدة وانتهى الأمر 👌
        </text>
      </svg>
    </AbsoluteFill>
  );
}

// ─── Scene 5 — Chat screen ───────────────────────────────────────────────────

function Scene5() {
  const frame = useCurrentFrame();
  const { durationInFrames: dur } = useVideoConfig();
  const opacity = sceneFade(frame, dur);

  function ChatBubble({
    text, from, delay, isRight, emoji,
  }: {
    text: string; from: string; delay: number; isRight?: boolean; emoji?: string;
  }) {
    const bubbleOpacity = fadeIn(frame, delay);
    const bubbleX = isRight ? 30 : 12;
    const color = isRight ? '#0EA5E9' : '#F1F5F9';
    const textColor = isRight ? 'white' : '#1E293B';
    const align = isRight ? 'end' : 'start';
    return (
      <g opacity={bubbleOpacity}>
        {!isRight && (
          <circle cx="24" cy={0} r="10" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
        )}
        {isRight && (
          <circle cx="276" cy={0} r="10" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="1.5" />
        )}
        <text x={isRight ? '276' : '24'} y="5"
          textAnchor="middle" fontSize="10" fill="#64748B"
          fontFamily="'Segoe UI', Arial">{isRight ? '👤' : '👦'}</text>
      </g>
    );
  }

  const messages = [
    { text: 'السلام عليكم، متأكد موعد الرحلة؟', isRight: false, delay: 8 },
    { text: 'وعليكم السلام! اكيد الساعة ٨:٣٠ 😊', isRight: true, delay: 20 },
    { text: 'وين موقع التلاقي؟', isRight: false, delay: 32 },
    { text: 'قدام البوابة الرئيسية 📍', isRight: true, delay: 44 },
    { text: 'تمام، شكراً! 👍', isRight: false, delay: 56 },
  ];

  return (
    <AbsoluteFill style={{ opacity, background: '#FAF9F6' }}>
      <svg viewBox="0 0 300 620" width="300" height="620">

        {/* Chat header */}
        <rect x="0" y="0" width="300" height="62" rx="0"
          fill="#0EA5E9" opacity={fadeIn(frame, 3)} />
        <circle cx="36" cy="31" r="16"
          fill="#E0F2FE" opacity={fadeIn(frame, 5)} />
        <text x="36" y="37" textAnchor="middle" fontSize="18"
          opacity={fadeIn(frame, 5)}>👦</text>
        <text x="62" y="26" fontSize="12" fontWeight="700"
          fill="white" fontFamily="'Segoe UI', Arial"
          opacity={fadeIn(frame, 5)}>أحمد السيد</text>
        <text x="62" y="42" fontSize="10" fill="#BAE6FD"
          fontFamily="'Segoe UI', Arial"
          opacity={fadeIn(frame, 6)}>🟢 متصل الآن</text>

        {/* Divider */}
        <rect x="20" y="74" width="260" height="20" rx="10"
          fill="#F1F5F9" opacity={fadeIn(frame, 6)} />
        <text x="150" y="87" textAnchor="middle" fontSize="9" fill="#94A3B8"
          fontFamily="'Segoe UI', Arial"
          opacity={fadeIn(frame, 6)}>اليوم</text>

        {/* Message bubbles */}
        {messages.map((msg, i) => {
          const y = 112 + i * 72;
          const msgOpacity = fadeIn(frame, msg.delay);
          const textX = msg.isRight ? 255 : 46;
          const textAnchor = msg.isRight ? 'end' : 'start';
          const bubbleX = msg.isRight ? 255 - 10 - msg.text.length * 5.5 : 46;
          const bubbleW = Math.min(msg.text.length * 5.8 + 20, 180);
          const bubbleXPos = msg.isRight ? 255 - bubbleW : 46;
          return (
            <g key={i} opacity={msgOpacity}>
              {/* Avatar */}
              <circle cx={msg.isRight ? 268 : 22} cy={y + 16}
                r={10} fill={msg.isRight ? '#E0F2FE' : '#FEF3C7'}
                stroke={msg.isRight ? '#38BDF8' : '#F59E0B'} strokeWidth="1.5" />
              <text x={msg.isRight ? 268 : 22} y={y + 21}
                textAnchor="middle" fontSize="10">{msg.isRight ? '👤' : '👦'}</text>
              {/* Bubble */}
              <rect x={bubbleXPos} y={y}
                width={bubbleW} height={32} rx={12}
                fill={msg.isRight ? '#0EA5E9' : '#F1F5F9'}
                stroke={msg.isRight ? '#0284C7' : '#E2E8F0'} strokeWidth="1.5" />
              <text x={msg.isRight ? bubbleXPos + bubbleW - 10 : bubbleXPos + 10} y={y + 20}
                textAnchor={textAnchor} fontSize="9.5" fontWeight="500"
                fill={msg.isRight ? 'white' : '#1E293B'}
                fontFamily="'Segoe UI', 'Noto Sans Arabic', Arial">
                {msg.text}
              </text>
            </g>
          );
        })}

        {/* Typing indicator */}
        <g opacity={clamp(interpolate(frame, [62, 68, 72, 78], [0, 1, 1, 0]))}>
          <rect x="46" y="478" width="56" height="26" rx="13"
            fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1.5" />
          {[0, 1, 2].map((di) => (
            <circle key={di} cx={63 + di * 13} cy={491} r={3}
              fill="#94A3B8"
              opacity={interpolate((frame + di * 8) % 24, [0, 12, 24], [0.3, 1, 0.3])} />
          ))}
        </g>

        {/* Bottom label */}
        <text x="150" y="550"
          textAnchor="middle" fontSize="15" fontWeight="600"
          fill="#1E293B" fontFamily="'Segoe UI', 'Noto Sans Arabic', Arial"
          opacity={fadeIn(frame, 60)}>
          التنسيق أصبح سهلاً 💬
        </text>
      </svg>
    </AbsoluteFill>
  );
}

// ─── Scene 6 — Arrived, relaxed ─────────────────────────────────────────────
// "وصلت بسهولة"

function Scene6() {
  const frame = useCurrentFrame();
  const { durationInFrames: dur } = useVideoConfig();
  const opacity = sceneFade(frame, dur);

  const carSlide = spring({ frame: Math.max(0, frame - 3), fps: 30, config: { damping: 20, stiffness: 80 } });
  const carX = interpolate(carSlide, [0, 1], [-150, 0]);

  const starScale = (delay: number) =>
    spring({ frame: Math.max(0, frame - delay), fps: 30, config: { damping: 12, stiffness: 200 } });

  return (
    <AbsoluteFill style={{ opacity, background: 'linear-gradient(160deg, #F0FDF4 0%, #ECFEFF 100%)' }}>
      <svg viewBox="0 0 300 620" width="300" height="620">
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F0FDF4" />
            <stop offset="100%" stopColor="#ECFEFF" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="300" height="620" fill="url(#bgGrad)" />

        {/* Sun */}
        <circle cx="245" cy="75" r="32"
          fill="#FEF9C3" stroke="#FDE047" strokeWidth="2"
          opacity={fadeIn(frame, 5)} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => {
          const rad = (a * Math.PI) / 180;
          return (
            <line key={i}
              x1={245 + Math.cos(rad) * 36}
              y1={75 + Math.sin(rad) * 36}
              x2={245 + Math.cos(rad) * 46}
              y2={75 + Math.sin(rad) * 46}
              stroke="#FDE047" strokeWidth="2.5"
              opacity={fadeIn(frame, 8 + i)} />
          );
        })}

        {/* Road */}
        <rect x="0" y="360" width="300" height="50" rx="0"
          fill="#E2E8F0" opacity={fadeIn(frame, 4)} />
        <path d="M 0 385 Q 75 380 150 385 Q 225 390 300 385"
          fill="none" stroke="#CBD5E1" strokeWidth="1.5"
          strokeDasharray="18 12" opacity={fadeIn(frame, 4)} />

        {/* Trees */}
        {[30, 240].map((tx, i) => (
          <g key={i} opacity={fadeIn(frame, 10 + i * 5)}>
            <line x1={tx} y1={316} x2={tx} y2={360}
              stroke="#92400E" strokeWidth="4" />
            <circle cx={tx} cy={296} r={22}
              fill="#4ADE80" stroke="#16A34A" strokeWidth="2" />
          </g>
        ))}

        {/* University building sketch */}
        <g opacity={fadeIn(frame, 14)}>
          <rect x="100" y="260" width="100" height="100" rx="4"
            fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
          {[120, 140, 160].map((wx) => (
            <rect key={wx} x={wx} y={295} width={12} height={18} rx="2"
              fill="none" stroke="#94A3B8" strokeWidth="1.5" />
          ))}
          <rect x="136" y="320" width="28" height="40" rx="2"
            fill="none" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="95" y1="260" x2="205" y2="260"
            stroke="#94A3B8" strokeWidth="2" />
          <polygon points="150,238 95,260 205,260"
            fill="none" stroke="#94A3B8" strokeWidth="2" />
          <text x="150" y="255" textAnchor="middle" fontSize="8"
            fill="#94A3B8" fontFamily="'Segoe UI', Arial">الجامعة</text>
        </g>

        {/* Car sliding in */}
        <g transform={`translate(${carX}, 0)`}>
          {/* Car body */}
          <rect x="55" y="322" width="90" height="40" rx="10"
            fill="white" stroke="#0EA5E9" strokeWidth="2.5" />
          {/* Car cabin */}
          <rect x="72" y="308" width="56" height="20" rx="8"
            fill="#E0F2FE" stroke="#0EA5E9" strokeWidth="2" />
          {/* Windows */}
          <rect x="76" y="311" width="20" height="14" rx="4"
            fill="white" stroke="#BAE6FD" strokeWidth="1.5" />
          <rect x="102" y="311" width="20" height="14" rx="4"
            fill="white" stroke="#BAE6FD" strokeWidth="1.5" />
          {/* Wheels */}
          <circle cx="80" cy="362" r="9"
            fill="#1E293B" stroke="#475569" strokeWidth="2" />
          <circle cx="80" cy="362" r="4" fill="#94A3B8" />
          <circle cx="122" cy="362" r="9"
            fill="#1E293B" stroke="#475569" strokeWidth="2" />
          <circle cx="122" cy="362" r="4" fill="#94A3B8" />
          {/* Speed lines */}
          {[0, 1, 2].map((i) => (
            <line key={i}
              x1={42 - i * 8} y1={330 + i * 8}
              x2={20 - i * 10} y2={330 + i * 8}
              stroke="#BAE6FD" strokeWidth={2 - i * 0.4}
              opacity={0.8 - i * 0.25} />
          ))}
          {/* Happy person in car */}
          <text x="90" y="322" textAnchor="middle" fontSize="16">😊</text>
        </g>

        {/* Stars */}
        {[
          { x: 42, y: 145, delay: 20 },
          { x: 258, y: 168, delay: 26 },
          { x: 140, y: 128, delay: 32 },
          { x: 200, y: 140, delay: 24 },
          { x: 75, y: 190, delay: 28 },
        ].map((s, i) => {
          const sc = starScale(s.delay);
          return (
            <text key={i} x={s.x} y={s.y}
              textAnchor="middle" fontSize={14 + i * 2}
              style={{ transform: `scale(${sc})`, transformOrigin: `${s.x}px ${s.y}px` }}>
              ⭐
            </text>
          );
        })}

        {/* Main text */}
        <text x="150" y="440"
          textAnchor="middle" fontSize="28" fontWeight="800"
          fill="#065F46" fontFamily="'Segoe UI', 'Noto Sans Arabic', Arial"
          opacity={fadeIn(frame, 22)}>
          وصلت بسهولة! 🎉
        </text>

        {/* Sub text */}
        <text x="150" y="480"
          textAnchor="middle" fontSize="15" fontWeight="600"
          fill="#047857" fontFamily="'Segoe UI', 'Noto Sans Arabic', Arial"
          opacity={fadeIn(frame, 28)}>
          مع بطريقك كل يوم أحلى
        </text>

        {/* CTA-like badge */}
        <rect x="70" y="508" width="160" height="36" rx="18"
          fill="#0EA5E9" opacity={fadeIn(frame, 38)} />
        <text x="150" y="530"
          textAnchor="middle" fontSize="13" fontWeight="700"
          fill="white" fontFamily="'Segoe UI', Arial"
          opacity={fadeIn(frame, 38)}>
          ابدأ الآن — مجاناً ✨
        </text>
      </svg>
    </AbsoluteFill>
  );
}

// ─── Root Composition ────────────────────────────────────────────────────────

const SCENE_CONFIG = [
  // Scene 1 fades out slightly into Scene 2 (gentle overlap)
  { component: Scene1, from: 0,   duration: 88 },
  // Scene 2 ends with hard freeze — no overlap into Scene 3
  { component: Scene2, from: 76,  duration: 88 },
  // Scene 3 starts at exact end of Scene 2 (hard cut from freeze flash)
  { component: Scene3, from: 164, duration: 94 },
  { component: Scene4, from: 248, duration: 98 },
  { component: Scene5, from: 338, duration: 88 },
  { component: Scene6, from: 418, duration: 82 },
];

export const PHONE_VIDEO_DURATION = 500; // frames
export const PHONE_VIDEO_FPS = 30;
export const PHONE_VIDEO_WIDTH = 300;
export const PHONE_VIDEO_HEIGHT = 620;

export function PhoneVideoComposition() {
  return (
    <AbsoluteFill>
      {SCENE_CONFIG.map(({ component: SceneComp, from, duration }, i) => (
        <Sequence key={i} from={from} durationInFrames={duration}>
          <SceneComp />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
