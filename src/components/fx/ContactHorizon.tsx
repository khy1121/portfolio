"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLSL_SIMPLEX_2D, GLSL_FBM_2D, GLSL_FULLSCREEN_VERT } from "@/lib/glsl";
import { mulberry32 } from "@/lib/rng";
import { readCssVar, useCanAnimate, useInView, useTheme } from "@/lib/useEnv";

/* Horizon — 푸터 뒤에 깔리는 등고선 지평선.
   서울 실시간을 읽어 해/달의 고도를 정하고, 7겹 능선이 소실점으로 물러난다.

   ── 색 반전 주의 ──
   푸터는 bg-fg / text-bg 로 뒤집혀 있다. 즉 종이(배경)가 --fg, 글자(잉크)가 --bg다.
   그래서 이 레이어는 --fg 종이 위에 --bg 잉크를 얹는 판화처럼 그린다.
   다크 테마면 크림색 종이에 검은 잉크, 라이트 테마면 먹지에 흰 잉크가 된다.

   ── 대비 보호 ──
   래퍼에 mix-blend-mode darken(다크) / lighten(라이트)를 건다.
   잉크색이 곧 푸터 글자색이라 글자 위에서는 min/max 결과가 글자색 그대로 나온다.
   → 셰이더가 아무리 짙어져도 푸터 텍스트의 대비는 수학적으로 떨어지지 않는다. */

const STAR_COUNT = 18;
const HORIZON = 0.38; // 수평선 높이(uv.y)
const MAX_TILT = (2 * Math.PI) / 180; // 마우스 틸트 ±2도

/* 별자리는 매 렌더 같아야 하므로 시드 난수로 모듈 로드 시 한 번만 만든다. */
const STARS: [number, number, number][] = (() => {
  const rand = mulberry32(0x484f527a);
  return Array.from({ length: STAR_COUNT }, () => {
    const x = 0.04 + rand() * 0.92;
    const y = HORIZON + 0.08 + rand() * 0.44;
    const b = 0.3 + rand() * 0.7;
    return [x, y, b] as [number, number, number];
  });
})();

const H = HORIZON.toFixed(3);

const fragment = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uAspect;
uniform float uTilt;
uniform vec3 uInk;
uniform vec3 uAccent;
uniform vec2 uDisc;
uniform float uRadius;
uniform float uNight;
uniform float uWarm;
uniform float uPale;
uniform float uMoonOff;
uniform float uInkScale;
uniform vec3 uStars[${STAR_COUNT}];
varying vec2 vUv;

${GLSL_SIMPLEX_2D}
${GLSL_FBM_2D}

// 프리멀티플라이드 src-over: front를 back 위에 얹는다
vec4 over(vec4 front, vec4 back){ return front + back * (1.0 - front.a); }

void main(){
  // 마우스 틸트: 종횡비 공간에서 수평선 중앙을 축으로 돌려 지평선 전체를 기울인다
  vec2 c = vec2(0.5 * uAspect, ${H});
  vec2 p = vec2(vUv.x * uAspect, vUv.y) - c;
  float st = sin(uTilt), ct = cos(uTilt);
  p = mat2(ct, -st, st, ct) * p + c;
  vec2 uv = vec2(p.x / uAspect, p.y);

  float py = max(fwidth(uv.y), 1e-5);

  // ── 하늘 ─────────────────────────────────────────────
  vec4 sky = vec4(0.0);

  // 별: 밤에만. 자리는 시드로 고정하고 반짝임만 시간에 따라 흔들린다.
  float starA = 0.0;
  for (int i = 0; i < ${STAR_COUNT}; i++) {
    vec3 s = uStars[i];
    float d = length((uv - s.xy) * vec2(uAspect, 1.0));
    float tw = 0.7 + 0.3 * sin(uTime * (0.9 + s.z) + float(i) * 2.399);
    starA += exp(-d * 300.0) * s.z * tw;
  }
  starA = min(starA, 1.0) * 0.32 * uNight;
  sky = over(vec4(uInk * starA, starA), sky);

  // 원반: 여명·노을이면 호박색, 한낮이면 잉크에 가깝게 창백, 밤이면 차갑게
  float dd = length((uv - uDisc) * vec2(uAspect, 1.0));
  float aa = max(fwidth(dd), 1e-5) * 1.2;
  vec3 dayCol = mix(uInk, uAccent, mix(0.92, 0.28, uPale));
  vec3 discCol = mix(dayCol, mix(uInk, uAccent, 0.14), uNight);

  float halo = exp(-dd / max(uRadius * 1.9, 1e-4)) * mix(0.13, 0.09, uNight);
  sky = over(vec4(discCol * halo, halo), sky);

  // 낮은 꽉 찬 원, 밤은 실제 월령에 맞춰 그림자 원을 빼 초승달을 만든다
  float disc = 1.0 - smoothstep(uRadius - aa, uRadius + aa, dd);
  float sd = length((uv - uDisc - vec2(uMoonOff * uRadius / uAspect, 0.0)) * vec2(uAspect, 1.0));
  float moon = clamp(disc - (1.0 - smoothstep(uRadius - aa, uRadius + aa, sd)), 0.0, 1.0);
  float body = mix(disc, moon, uNight) * mix(0.20, 0.17, uNight);
  // 원반 테두리도 등고선으로: 히어로 셰이더의 선 언어를 그대로 쓴다
  float ring = (1.0 - smoothstep(0.0, aa * 1.5, abs(dd - uRadius))) * mix(0.10, 0.26, uNight);
  float discA = min(body + ring, 0.30);
  sky = over(vec4(discCol * discA, discA), sky);

  // ── 능선 7겹 ─────────────────────────────────────────
  // 먼 능선부터 그린다. 가까울수록 낮게 깔리고 진폭이 크며 잉크가 짙다.
  float sx = uv.x * uAspect;
  float fill = 0.0, edge = 0.0, cov = 0.0;
  for (int i = 0; i < 7; i++) {
    float d = float(i) / 6.0;                    // 0 = 가장 먼 능선, 1 = 가장 가까운 능선
    float amp = mix(0.032, 0.100, d);            // 먼 능선은 잔잔하고 가까울수록 굴곡이 크다
    float freq = mix(3.4, 1.35, d);
    float drift = uTime * mix(0.004, 0.014, d);  // 시차: 가까운 능선이 더 빨리 흐른다
    float top = ${H} - d * 0.25 + fbm(vec2(sx * freq + drift, float(i) * 7.31 + 2.0)) * amp;
    float s = 1.0 - smoothstep(top - py * 0.5, top + py * 0.5, uv.y); // 능선 아래면 1
    float rim = 1.0 - clamp((top - uv.y) / (py * 2.6), 0.0, 1.0);     // 능선 바로 안쪽이 가장 밝다
    fill = mix(fill, mix(0.028, 0.130, d), s);
    edge = mix(edge, rim * mix(0.11, 0.24, d), s);                    // 가까운 능선이 먼 능선의 선을 덮는다
    cov = max(cov, s);
  }

  sky *= 1.0 - cov;                              // 해는 산 뒤로 진다

  // 골짜기 안개: 아래 13%는 잉크를 걷어 푸터 하단 크레딧 줄을 비워 둔다
  float mist = smoothstep(0.0, 0.13, uv.y);
  float ridgeA = min(fill + edge, 0.26) * mist;
  // 능선의 윗선만 여명·노을 색으로 물든다
  float warmMix = clamp(edge / max(fill + edge, 1e-4), 0.0, 1.0) * (0.10 + 0.75 * uWarm);
  vec3 ridgeCol = mix(uInk, uAccent, warmMix);

  vec4 col = over(vec4(ridgeCol * ridgeA, ridgeA), sky);
  col *= uInkScale * (1.0 - smoothstep(0.86, 1.0, uv.y)); // 상단 마퀴 띠는 건드리지 않는다
  gl_FragColor = col;
}
`;

type Sky = {
  x: number;
  y: number;
  radius: number;
  night: number;
  warm: number;
  pale: number;
  moonOff: number;
};

function smooth01(x: number, a: number, b: number) {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
}

const SYNODIC = 29.530588853; // 삭망월(일)
const NEW_MOON = 947182440000; // 2000-01-06 18:14 UTC, 기준 삭

/* 서울 시각(t = 시 + 분/60) → 하늘 상태.
   태양 고도를 alt = sin(π·(t-6)/12) 로 근사한다. 일출 06시 alt 0, 남중 12시 alt 1,
   일몰 18시 alt 0, 자정 alt -1 (자정에서 연속).
     alt > 0  낮   : 해가 동(왼쪽)에서 떠 서(오른쪽)로 진다. 남중에 가까울수록 높고 창백하다.
     alt ≈ 0  여명·노을: 원반이 수평선에 걸리고 능선 윗선까지 호박색으로 물든다.
     alt < 0  밤   : 해는 수평선 아래라 그리지 않고 대신 달을 띄운다.
                     달은 18시에 떠서 06시에 지는 같은 호를 그린다. */
function skyAt(t: number, now: number): Sky {
  const alt = Math.sin(((t - 6) / 12) * Math.PI);
  const night = smooth01(-alt, -0.02, 0.1);
  const isNight = night >= 0.5;
  const warm = 1 - smooth01(Math.abs(alt), 0.04, 0.42);
  const pale = smooth01(alt, 0.35, 0.85);

  const raw = isNight ? ((((t - 18) % 24) + 24) % 24) : t - 6;
  const phase = Math.min(Math.max(raw / 12, 0), 1); // 뜬 때부터 질 때까지의 진행도 0..1
  const h = Math.sin(Math.PI * phase); // 0 = 수평선, 1 = 남중

  // 월령으로 초승달 모양을 만든다. 그림자 원을 반지름의 0.5~2.25배만큼 밀어낸다
  // (2배를 넘기면 겹치지 않아 보름달, 삭에도 실루엣이 남도록 최소 0.5는 남긴다).
  const age = (((now - NEW_MOON) / 86400000) % SYNODIC + SYNODIC) % SYNODIC;
  const ph = age / SYNODIC;
  const lit = (1 - Math.cos(ph * 2 * Math.PI)) / 2; // 조명 비율 0(삭)~1(망)
  const moonOff = (0.5 + lit * 1.75) * (ph < 0.5 ? 1 : -1);

  return {
    x: 0.13 + phase * 0.74,
    y: HORIZON + h * 0.3,
    radius: isNight ? 0.038 : 0.048,
    night,
    warm,
    pale,
    moonOff,
  };
}

function Horizon({
  sky,
  tiltRef,
  animate,
  visible,
  theme,
}: {
  sky: Sky;
  tiltRef: React.RefObject<number>;
  animate: boolean;
  visible: boolean;
  theme: "dark" | "light";
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAspect: { value: 1.8 },
      uTilt: { value: 0 },
      uInk: { value: new THREE.Color("#071013") },
      uAccent: { value: new THREE.Color("#f2b544") },
      uDisc: { value: new THREE.Vector2(0.5, HORIZON + 0.2) },
      uRadius: { value: 0.048 },
      uNight: { value: 0 },
      uWarm: { value: 0 },
      uPale: { value: 0 },
      uMoonOff: { value: 1.5 },
      uInkScale: { value: 1 },
      uStars: { value: STARS.map(([x, y, b]) => new THREE.Vector3(x, y, b)) },
    }),
    [],
  );

  /* 정지 모드(모션 최소화·터치)에서는 frameloop가 demand다.
     시각·테마·크기가 바뀔 때만 한 프레임 그리고 멈춘다.
     rAF로 미뤄 R3F가 frameloop 변경을 적용한 뒤에 호출되게 한다. */
  useEffect(() => {
    if (animate || !visible) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      invalidate();
      second = requestAnimationFrame(() => invalidate());
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [animate, visible, invalidate, sky, theme, size.width, size.height]);

  useFrame((_, dt) => {
    if (!mat.current) return;
    const u = mat.current.uniforms;
    if (animate) u.uTime.value += Math.min(dt, 0.05);
    u.uAspect.value = size.width / Math.max(size.height, 1);

    // 잉크는 --bg, 종이는 --fg. 푸터가 반전돼 있으니 여기서도 뒤집어 읽는다.
    (u.uInk.value as THREE.Color).set(readCssVar("--bg", "#071013"));
    (u.uAccent.value as THREE.Color).set(readCssVar("--accent", "#f2b544"));
    // 라이트 테마는 먹지에 흰 잉크라 같은 알파가 더 세게 보인다. 살짝 죽인다.
    const scale = document.documentElement.getAttribute("data-theme") === "light" ? 0.86 : 1;
    u.uInkScale.value = animate ? u.uInkScale.value + (scale - u.uInkScale.value) * 0.1 : scale;

    (u.uDisc.value as THREE.Vector2).set(sky.x, sky.y);
    u.uRadius.value = sky.radius;
    u.uNight.value = sky.night;
    u.uWarm.value = sky.warm;
    u.uPale.value = sky.pale;
    u.uMoonOff.value = sky.moonOff;

    // 틸트 감쇠. 정지 모드에서는 0으로 고정한다.
    const target = animate ? -(tiltRef.current ?? 0) * MAX_TILT : 0;
    u.uTilt.value = animate ? u.uTilt.value + (target - u.uTilt.value) * 0.06 : 0;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        vertexShader={GLSL_FULLSCREEN_VERT}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

export function ContactHorizon() {
  const ref = useRef<HTMLDivElement>(null);
  const tilt = useRef(0);
  const animate = useCanAnimate();
  const theme = useTheme();
  const visible = useInView(ref, "160px");
  const [sky, setSky] = useState<Sky | null>(null);

  /* 서울 시각은 렌더가 아니라 이펙트에서만 읽는다(React 컴파일러 규칙). 1분마다 갱신. */
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    const read = () => {
      const now = Date.now();
      let h = 0;
      let m = 0;
      for (const part of fmt.formatToParts(new Date(now))) {
        if (part.type === "hour") h = Number(part.value);
        else if (part.type === "minute") m = Number(part.value);
      }
      setSky(skyAt((h % 24) + m / 60, now));
    };
    const first = requestAnimationFrame(read);
    const id = window.setInterval(read, 60_000);
    return () => {
      cancelAnimationFrame(first);
      window.clearInterval(id);
    };
  }, []);

  /* 캔버스가 pointer-events:none이라 R3F는 포인터를 못 받는다. 창 단위로 직접 듣는다. */
  useEffect(() => {
    if (!animate) return;
    const onMove = (e: PointerEvent) => {
      tilt.current = (e.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [animate]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      // 잉크색이 곧 푸터 글자색이라 darken/lighten 아래에서 글자 픽셀은 값이 바뀌지 않는다
      style={{ mixBlendMode: theme === "light" ? "lighten" : "darken" }}
    >
      {/* WebGL이 없거나 캔버스가 뜨기 전에도 땅의 존재감은 남긴다 */}
      <div
        className="absolute inset-x-0 bottom-0 h-[42%]"
        style={{
          background:
            "linear-gradient(to top, transparent 0%, color-mix(in srgb, var(--bg) 8%, transparent) 26%, transparent 100%)",
        }}
      />
      {sky ? (
        <Canvas
          frameloop={!visible ? "never" : animate ? "always" : "demand"}
          dpr={[1, 1.5]}
          gl={{ antialias: false, alpha: true, powerPreference: "low-power", premultipliedAlpha: true }}
          style={{ position: "absolute", inset: 0 }}
          orthographic
          camera={{ position: [0, 0, 1], zoom: 1 }}
        >
          <Horizon sky={sky} tiltRef={tilt} animate={animate} visible={visible} theme={theme} />
        </Canvas>
      ) : null}
    </div>
  );
}

export default ContactHorizon;
