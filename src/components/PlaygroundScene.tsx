"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { ASCII_DPR, AsciiPass } from "./fx/AsciiPass";

type Input = { throttle: number; steer: number };
type CarState = { x: number; z: number; heading: number; speed: number };

const BASE_DPR: [number, number] = [1, 1.5];
const BOUND = 13;
const MAX_SPEED = 9;
const CAR_PUSH_RADIUS = 1.7;

const signs: { label: string; href: string; pos: [number, number] }[] = [
  { label: "프로젝트", href: "#work", pos: [-8, -6] },
  { label: "소개", href: "#about", pos: [8, -6] },
  { label: "연락", href: "#contact", pos: [0, 8] },
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function useCssColor(name: string, fallback: string) {
  const [c, setC] = useState(fallback);
  useEffect(() => {
    const read = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      if (v) setC(v);
    };
    const id = requestAnimationFrame(read);
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      cancelAnimationFrame(id);
      obs.disconnect();
    };
  }, [name]);
  return c;
}

function Car({ inputRef, carRef }: { inputRef: React.RefObject<Input>; carRef: React.RefObject<CarState> }) {
  const group = useRef<THREE.Group>(null);
  const wheels = useRef<(THREE.Mesh | null)[]>([]);
  const frontPivots = useRef<(THREE.Group | null)[]>([]);
  const accent = useCssColor("--accent", "#f2b544");

  useFrame((_, dt) => {
    const s = carRef.current;
    const inp = inputRef.current;
    if (!s || !inp || !group.current) return;
    const step = Math.min(dt, 0.05);

    // kinematic car: throttle → speed, steer scaled by speed
    s.speed += inp.throttle * 14 * step;
    s.speed *= inp.throttle === 0 ? 0.94 : 0.985;
    s.speed = THREE.MathUtils.clamp(s.speed, -MAX_SPEED * 0.5, MAX_SPEED);
    const turn = inp.steer * 2.4 * step * THREE.MathUtils.clamp(s.speed / MAX_SPEED, -1, 1);
    s.heading -= turn;
    s.x += Math.sin(s.heading) * s.speed * step;
    s.z += Math.cos(s.heading) * s.speed * step;

    // soft walls
    if (Math.abs(s.x) > BOUND) {
      s.x = Math.sign(s.x) * BOUND;
      s.speed *= -0.35;
    }
    if (Math.abs(s.z) > BOUND) {
      s.z = Math.sign(s.z) * BOUND;
      s.speed *= -0.35;
    }

    group.current.position.set(s.x, 0, s.z);
    group.current.rotation.y = s.heading;
    // body lean into the turn
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, -inp.steer * 0.06 * (s.speed / MAX_SPEED), 0.15);

    const spin = (s.speed * step) / 0.3;
    wheels.current.forEach((w) => w && (w.rotation.x += spin));
    frontPivots.current.forEach((p) => p && (p.rotation.y = THREE.MathUtils.lerp(p.rotation.y, inp.steer * 0.45, 0.2)));
  });

  const wheel = (i: number, x: number, z: number, front: boolean) => (
    <group key={i} position={[x, 0.3, z]} ref={(el) => (front ? (frontPivots.current[i] = el) : undefined)}>
      <mesh ref={(el) => (wheels.current[i] = el)} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 0.26, 14]} />
        <meshStandardMaterial color="#1a1f24" roughness={0.9} />
      </mesh>
    </group>
  );

  return (
    <group ref={group}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.3, 0.5, 2.3]} />
        <meshStandardMaterial color={accent} roughness={0.45} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.98, -0.15]}>
        <boxGeometry args={[1.05, 0.42, 1.15]} />
        <meshStandardMaterial color="#e6edeb" roughness={0.3} />
      </mesh>
      <mesh position={[0.4, 0.62, 1.16]}>
        <boxGeometry args={[0.22, 0.14, 0.05]} />
        <meshStandardMaterial color="#fff6d6" emissive="#fff0b0" emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[-0.4, 0.62, 1.16]}>
        <boxGeometry args={[0.22, 0.14, 0.05]} />
        <meshStandardMaterial color="#fff6d6" emissive="#fff0b0" emissiveIntensity={1.4} />
      </mesh>
      {wheel(0, 0.68, 0.8, true)}
      {wheel(1, -0.68, 0.8, true)}
      {wheel(2, 0.68, -0.8, false)}
      {wheel(3, -0.68, -0.8, false)}
    </group>
  );
}

class PileSim {
  readonly count: number;
  readonly home: Float32Array;
  readonly pos: Float32Array;
  readonly vel: Float32Array;
  constructor(count: number) {
    this.count = count;
    const rand = mulberry32(7);
    this.home = new Float32Array(count * 3);
    this.pos = new Float32Array(count * 3);
    this.vel = new Float32Array(count * 3);
    const R = 2.6;
    for (let i = 0; i < count; i++) {
      // points inside a sphere resting on the ground at (0, R, -1)
      const u = rand(), v = rand(), w = Math.cbrt(rand());
      const th = 2 * Math.PI * u;
      const ph = Math.acos(2 * v - 1);
      const r = R * w;
      const x = r * Math.sin(ph) * Math.cos(th);
      const y = r * Math.cos(ph) + R * 0.85;
      const z = r * Math.sin(ph) * Math.sin(th) - 1;
      this.home.set([x, Math.max(0.05, y), z], i * 3);
    }
    this.pos.set(this.home);
  }
  step(s: CarState, step: number, t: number) {
    const { home, pos, vel, count } = this;
    for (let i = 0; i < count; i++) {
      const j = i * 3;
      const hx = home[j], hy = home[j + 1], hz = home[j + 2];
      let px = pos[j], py = pos[j + 1], pz = pos[j + 2];
      // spring back home, slight breathing
      const breathe = 1 + Math.sin(t * 0.8 + i * 0.01) * 0.03;
      let ax = (hx * breathe - px) * 6;
      let ay = (hy * breathe - py) * 6;
      let az = (hz * breathe - pz) * 6;
      // car pushes particles outward and up
      const dx = px - s.x, dz = pz - s.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < CAR_PUSH_RADIUS * CAR_PUSH_RADIUS && py < 2.2) {
        const d = Math.sqrt(d2) + 0.001;
        const f = (1 - d / CAR_PUSH_RADIUS) * (40 + Math.abs(s.speed) * 12);
        ax += (dx / d) * f;
        az += (dz / d) * f;
        ay += f * 0.9;
      }
      vel[j] = (vel[j] + ax * step) * 0.9;
      vel[j + 1] = (vel[j + 1] + ay * step) * 0.9;
      vel[j + 2] = (vel[j + 2] + az * step) * 0.9;
      px += vel[j] * step;
      py += vel[j + 1] * step;
      pz += vel[j + 2] * step;
      if (py < 0.05) py = 0.05;
      pos[j] = px; pos[j + 1] = py; pos[j + 2] = pz;
    }
  }
}

function ParticlePile({ carRef, count }: { carRef: React.RefObject<CarState>; count: number }) {
  const geo = useRef<THREE.BufferGeometry>(null);
  const fg = useCssColor("--fg", "#e6edeb");
  const [sim] = useState(() => new PileSim(count));

  useFrame((state, dt) => {
    const s = carRef.current;
    if (!s || !geo.current) return;
    sim.step(s, Math.min(dt, 0.05), state.clock.elapsedTime);
    const attr = geo.current.getAttribute("position") as THREE.BufferAttribute;
    attr.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={geo}>
        <bufferAttribute attach="attributes-position" args={[sim.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial color={fg} size={0.06} sizeAttenuation transparent opacity={0.85} depthWrite={false} />
    </points>
  );
}

function Signposts({ carRef, ascii }: { carRef: React.RefObject<CarState>; ascii: boolean }) {
  const last = useRef(0);
  const accent = useCssColor("--accent", "#f2b544");
  useFrame((state) => {
    const s = carRef.current;
    if (!s) return;
    const now = state.clock.elapsedTime;
    if (now - last.current < 3) return;
    for (const sg of signs) {
      const dx = s.x - sg.pos[0], dz = s.z - sg.pos[1];
      if (dx * dx + dz * dz < 1.6) {
        last.current = now;
        document.querySelector(sg.href)?.scrollIntoView({ behavior: "smooth" });
        break;
      }
    }
  });
  return (
    <>
      {signs.map((sg) => (
        <group key={sg.href} position={[sg.pos[0], 0, sg.pos[1]]}>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 1.8, 8]} />
            <meshStandardMaterial color="#8c9c98" />
          </mesh>
          <mesh position={[0, 1.9, 0]}>
            <boxGeometry args={[1.5, 0.5, 0.08]} />
            <meshStandardMaterial color={accent} />
          </mesh>
          <Html position={[0, 1.9, 0.06]} center transform distanceFactor={6} style={{ pointerEvents: "none" }}>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 22,
                color: "#071013",
                whiteSpace: "nowrap",
                letterSpacing: "-0.02em",
                /* Html 라벨은 문자 표보다 위에 뜬다. 아스키 모드에서는 뒤의 표지판이 문자로 바뀌어
                   어두운 글자만 남으므로, 라벨 자체에 accent 칩을 깔아 계속 읽히게 한다. */
                background: ascii ? accent : undefined,
                padding: ascii ? "2px 10px" : undefined,
                borderRadius: ascii ? 6 : undefined,
              }}
            >
              {sg.label}
            </div>
          </Html>
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.9, 1.05, 32]} />
            <meshBasicMaterial color={accent} transparent opacity={0.5} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function ChaseCamera({ carRef }: { carRef: React.RefObject<CarState> }) {
  const target = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    const s = carRef.current;
    if (!s) return;
    const cam = camera;
    target.set(s.x - Math.sin(s.heading) * 7.5, 4.6, s.z - Math.cos(s.heading) * 7.5);
    cam.position.lerp(target, 0.06);
    look.set(s.x, 0.6, s.z);
    cam.lookAt(look);
  });
  return null;
}

function SceneFog() {
  const bg = useCssColor("--bg", "#071013");
  return <fog attach="fog" args={[bg, 18, 34]} />;
}

function Ground() {
  const line = useCssColor("--muted", "#8c9c98");
  const bg = useCssColor("--card", "#0c181c");
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[BOUND * 2 + 4, BOUND * 2 + 4]} />
        <meshStandardMaterial color={bg} roughness={1} />
      </mesh>
      <gridHelper args={[BOUND * 2, 26, line, line]} position={[0, 0, 0]}>
        <meshBasicMaterial attach="material" color={line} transparent opacity={0.25} />
      </gridHelper>
    </group>
  );
}

export default function PlaygroundScene({
  inputRef,
  active,
  isMobile,
  ascii,
}: {
  inputRef: React.RefObject<Input>;
  active: boolean;
  isMobile: boolean;
  ascii: boolean;
}) {
  const carRef = useRef<CarState>({ x: 0, z: 5, heading: Math.PI, speed: 0 });
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 4.6, 12.5], fov: 45 }}
      dpr={ascii ? ASCII_DPR : BASE_DPR}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <ambientLight intensity={0.9} />
      {/* 아스키에서는 밝기가 곧 문자 밀도라 빛을 조금 올려 면과 면을 갈라 준다. */}
      <directionalLight position={[5, 8, 3]} intensity={ascii ? 2.1 : 1.6} />
      {/* 안개는 먼 면의 밝기를 배경색으로 눌러 문자 격자를 뭉갠다. 아스키에서는 끈다. */}
      {!ascii && <SceneFog />}
      <Ground />
      <ParticlePile carRef={carRef} count={isMobile ? 1200 : 2600} />
      <Signposts carRef={carRef} ascii={ascii} />
      <Car inputRef={inputRef} carRef={carRef} />
      <ChaseCamera carRef={carRef} />
      {ascii && <AsciiPass />}
    </Canvas>
  );
}
