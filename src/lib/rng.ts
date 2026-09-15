/** 결정적 난수. React 컴파일러가 렌더 중 Math.random() 호출을 금지하므로
 *  파티클 배치처럼 "매번 같아야 하는" 값에는 이 시드 기반 생성기를 쓴다. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** [min, max) 범위의 결정적 난수 배열 */
export function seededArray(n: number, seed: number, min = 0, max = 1) {
  const rand = mulberry32(seed);
  return Array.from({ length: n }, () => min + rand() * (max - min));
}
