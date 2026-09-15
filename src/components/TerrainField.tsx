"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* 등고선 지형: 노이즈 높이맵을 일정 간격으로 잘라 선으로 그린다.
   마우스가 지나가면 지형이 솟아 선이 휘고, 스크롤하면 수위가 올라가며 선이 흘러간다. */
const vertex = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragment = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec2 uMouse;      // uv 0..1
uniform float uAspect;
uniform float uScroll;    // 0..1
uniform float uIntro;     // 0..1 (지형이 떠오르는 정도)
uniform vec3 uLine;
uniform vec3 uAccent;
uniform float uLineAlpha;
uniform float uGlow;
varying vec2 vUv;

vec2 hash(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return -1.0 + 2.0 * fract(sin(p) * 43758.5453123); }
float noise(in vec2 p){
  const float K1 = 0.366025404; const float K2 = 0.211324865;
  vec2 i = floor(p + (p.x + p.y) * K1);
  vec2 a = p - i + (i.x + i.y) * K2;
  vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec2 b = a - o + K2; vec2 c = a - 1.0 + 2.0 * K2;
  vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
  vec3 n = h * h * h * h * vec3(dot(a, hash(i)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
  return dot(n, vec3(70.0));
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = r * p * 2.0; a *= 0.5; }
  return v;
}

void main(){
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  vec2 m = vec2(uMouse.x * uAspect, uMouse.y);

  // 지형: 느리게 흐르는 fbm + 마우스 솟음
  float h = fbm(p * 1.6 + vec2(uTime * 0.035, -uTime * 0.02)) * 0.5 + 0.5;
  float d = distance(p, m);
  h += 0.32 * exp(-d * d * 9.0);
  h += uScroll * 0.9;               // 스크롤하면 수위가 올라가 선이 흘러간다
  h = mix(h - 0.6, h, uIntro);      // 인트로 때 지형이 아래서 떠오른다

  // 등고선
  float levels = 14.0;
  float lv = h * levels;
  float f = abs(fract(lv) - 0.5);
  float w = fwidth(lv) * 1.9;
  float line = 1.0 - smoothstep(0.0, w, f - 0.02);

  // 강조선: 시간·스크롤에 따라 한 층이 빛난다
  float target = 7.0 + sin(uTime * 0.25) * 2.0 + uScroll * 6.0;
  float k = floor(lv);
  float accent = (abs(k - floor(target)) < 0.5) ? 1.0 : 0.0;
  float glow = exp(-abs(lv - (floor(target) + 0.5)) * 1.2) * 0.7;

  // 이름이 놓이는 좌하단은 살짝 비워 둔다
  float clear = smoothstep(0.0, 0.55, length((vUv - vec2(0.18, 0.12)) * vec2(1.0, 1.6)));
  float mask = mix(0.35, 1.0, clear);

  vec3 col = mix(uLine, uAccent, accent);
  float a = line * mix(uLineAlpha, 1.0, accent) * mask * uIntro;
  a += glow * accent * mask * uIntro * uGlow;
  gl_FragColor = vec4(col * a, a);
}
`;

function readVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function Quad({ scrollRef, introRef }: { scrollRef: React.RefObject<number>; introRef: React.RefObject<number> }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();
  const mouse = useRef(new THREE.Vector2(0.7, 0.6));
  const target = useRef(new THREE.Vector2(0.7, 0.6));

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.7, 0.6) },
      uAspect: { value: 1.6 },
      uScroll: { value: 0 },
      uIntro: { value: 0 },
      uLine: { value: new THREE.Color("#e6edeb") },
      uAccent: { value: new THREE.Color("#f2b544") },
      uLineAlpha: { value: 0.5 },
      uGlow: { value: 0.6 },
    }),
    [],
  );

  useFrame((state, dt) => {
    if (!mat.current) return;
    const u = mat.current.uniforms;
    u.uTime.value += dt;
    u.uAspect.value = size.width / size.height;
    target.current.set((state.pointer.x + 1) / 2, (state.pointer.y + 1) / 2);
    mouse.current.lerp(target.current, 0.06);
    (u.uMouse.value as THREE.Vector2).copy(mouse.current);
    u.uScroll.value += ((scrollRef.current ?? 0) - u.uScroll.value) * 0.08;
    u.uIntro.value += ((introRef.current ?? 1) - u.uIntro.value) * 0.05;
    (u.uLine.value as THREE.Color).lerp(new THREE.Color(readVar("--fg", "#e6edeb")), 0.08);
    (u.uAccent.value as THREE.Color).lerp(new THREE.Color(readVar("--accent", "#f2b544")), 0.08);
    const light = document.documentElement.getAttribute("data-theme") === "light";
    u.uLineAlpha.value += ((light ? 0.42 : 0.5) - u.uLineAlpha.value) * 0.1;
    u.uGlow.value += ((light ? 0.12 : 0.6) - u.uGlow.value) * 0.1;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={mat} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent depthWrite={false} depthTest={false} />
    </mesh>
  );
}

export default function TerrainField({
  scrollRef,
  introRef,
  active = true,
}: {
  scrollRef: React.RefObject<number>;
  introRef: React.RefObject<number>;
  /* 히어로가 화면 밖이면 false. 풀스크린 셰이더가 페이지 끝까지 도는 것을 막는다. */
  active?: boolean;
}) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance", premultipliedAlpha: true }}
      style={{ position: "absolute", inset: 0 }}
      orthographic
      camera={{ position: [0, 0, 1], zoom: 1 }}
    >
      <Quad scrollRef={scrollRef} introRef={introRef} />
    </Canvas>
  );
}
