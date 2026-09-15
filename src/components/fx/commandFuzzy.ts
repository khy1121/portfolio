/* 커맨드 팔레트용 퍼지 매칭.
   부분 수열(subsequence) 방식이라 "bksw" 처럼 띄엄띄엄 쳐도 걸린다.
   한글은 완성된 음절 단위로 비교하므로 "프로"로 "프로젝트"를 찾는다. */

export type Match = { score: number; indices: number[] };

/** 이 글자 뒤에 오는 문자는 "단어의 시작"으로 본다. */
const BOUNDARY = " -/·()[]";

/** query 의 글자를 target 에서 순서대로 찾는다. 하나라도 못 찾으면 null. */
function scan(query: string, target: string): Match | null {
  const t = target.toLowerCase();
  const indices: number[] = [];
  let cursor = 0;
  let prev = -2;
  let score = 0;

  for (const raw of query) {
    if (raw === " ") continue; // 공백은 무시해 "book s" 로도 bookSwap 이 걸리게
    const ch = raw.toLowerCase();
    const at = t.indexOf(ch, cursor);
    if (at === -1) return null;
    if (at === prev + 1) score += 10; // 연속으로 붙은 매칭에 가장 큰 점수
    if (at === 0 || BOUNDARY.includes(t[at - 1])) score += 7; // 단어 첫 글자
    score += Math.max(0, 8 - at * 0.15); // 앞쪽에서 걸릴수록 유리
    indices.push(at);
    prev = at;
    cursor = at + 1;
  }
  return { score, indices };
}

/** 라벨을 먼저 보고, 안 걸리면 영문 별칭(keywords)으로 한 번 더 본다.
 *  하이라이트는 라벨에서 걸렸을 때만 준다(별칭은 화면에 없으므로). */
export function fuzzy(query: string, label: string, keywords: string): Match | null {
  const q = query.trim();
  if (!q) return { score: 0, indices: [] };
  const onLabel = scan(q, label);
  if (onLabel) return onLabel;
  const onKeywords = scan(q, keywords);
  if (onKeywords) return { score: onKeywords.score * 0.55, indices: [] };
  return null;
}
