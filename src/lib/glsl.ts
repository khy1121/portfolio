/* 셰이더에서 공유하는 GLSL 조각. 템플릿 문자열로 붙여 쓴다.
   예: const frag = `${GLSL_SIMPLEX_2D}\n${GLSL_FBM_2D}\nvoid main(){...}` */

/** 2D 심플렉스 노이즈. noise(vec2) -> [-1, 1] */
export const GLSL_SIMPLEX_2D = /* glsl */ `
vec2 hash2(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return -1.0 + 2.0 * fract(sin(p) * 43758.5453123); }
float noise(in vec2 p){
  const float K1 = 0.366025404; const float K2 = 0.211324865;
  vec2 i = floor(p + (p.x + p.y) * K1);
  vec2 a = p - i + (i.x + i.y) * K2;
  vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec2 b = a - o + K2; vec2 c = a - 1.0 + 2.0 * K2;
  vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
  vec3 n = h * h * h * h * vec3(dot(a, hash2(i)), dot(b, hash2(i + o)), dot(c, hash2(i + 1.0)));
  return dot(n, vec3(70.0));
}`;

/** GLSL_SIMPLEX_2D 필요. fbm(vec2) -> 대략 [-1, 1] */
export const GLSL_FBM_2D = /* glsl */ `
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = r * p * 2.0; a *= 0.5; }
  return v;
}`;

/** 높이값 h를 등고선(선 굵기 자동 보정)으로 바꾼다. levels는 등고선 개수. */
export const GLSL_CONTOUR = /* glsl */ `
float contour(float h, float levels, float width){
  float lv = h * levels;
  float f = abs(fract(lv) - 0.5);
  float w = fwidth(lv) * width;
  return 1.0 - smoothstep(0.0, w, f - 0.02);
}`;

/** 전체 화면 쿼드용 정점 셰이더. varying vUv 제공. */
export const GLSL_FULLSCREEN_VERT = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;
