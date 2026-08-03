/** 긴 접미사부터 매칭 (방송통신고 등이 고등학에 먹히지 않도록) */
const SCHOOL_TYPE_SUFFIXES = [
  "방송통신고등학교",
  "방송통신중학교",
  "초등학교",
  "중학교",
  "고등학교",
] as const;

/**
 * 통계 공개용 학교명 마스킹: 본문 첫 글자만 남기고 나머지는 ○, 학교급 접미사는 유지.
 * 예) 가락고등학교 → 가○고등학교, 서울가곡초등학교 → 서○○○초등학교
 */
export function maskSchoolName(schoolName: string): string {
  const name = schoolName.trim();
  if (!name) {
    return name;
  }

  let suffix = "";
  let body = name;

  for (const s of SCHOOL_TYPE_SUFFIXES) {
    if (name.endsWith(s)) {
      suffix = s;
      body = name.slice(0, -s.length);
      break;
    }
  }

  if (!suffix && name.endsWith("학교") && name.length > 2) {
    suffix = "학교";
    body = name.slice(0, -2);
  }

  if (body.length === 0) {
    return suffix || name;
  }

  const first = body[0]!;
  // 본문이 1글자여도 최소 1칸은 가림
  const maskedRest = "○".repeat(Math.max(body.length - 1, 1));
  return `${first}${maskedRest}${suffix}`;
}
