/**
 * lib/20260331_koreaschool.csv (EUC-KR)에서 D열 학교명을 읽어
 * 시·도(지역 드롭다운 값)별로 묶은 lib/korea-schools-by-region.generated.ts 를 생성합니다.
 *
 * 실행: npm run generate:schools
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import iconv from "iconv-lite";
import { parse } from "csv-parse/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

/** lib/korea-admin-regions.ts 와 동일 순서·값 */
const KOREA_ADMIN_REGIONS = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "충청북도",
  "충청남도",
  "경상북도",
  "경상남도",
  "전라남도",
  "강원특별자치도",
  "전북특별자치도",
  "제주특별자치도",
];

/** CSV 시도명 → 지역 드롭다운 값 (구 전라북도는 전북특별자치도로 통합) */
function csvSidoToRegion(sido) {
  if (!sido || typeof sido !== "string") return null;
  const t = sido.trim();
  if (KOREA_ADMIN_REGIONS.includes(t)) return t;
  if (t === "전라북도") return "전북특별자치도";
  return null;
}

const csvPath = path.join(root, "lib", "20260331_koreaschool.csv");
const outPath = path.join(root, "lib", "korea-schools-by-region.generated.ts");

const buffer = fs.readFileSync(csvPath);
const text = iconv.decode(buffer, "euc-kr").replace(/^\uFEFF/, "");

const rows = parse(text, {
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
});

/** @type {Record<string, Set<string>>} */
const byRegion = Object.fromEntries(KOREA_ADMIN_REGIONS.map((r) => [r, new Set()]));

for (const row of rows) {
  const region = csvSidoToRegion(row["시도명"]);
  if (!region) continue;
  const name = String(row["학교명"] ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!name) continue;
  byRegion[region].add(name);
}

const lines = [];
lines.push("/**");
lines.push(" * CSV `lib/20260331_koreaschool.csv` D열(학교명)을 시·도별로 묶은 데이터.");
lines.push(" * `npm run generate:schools` 로 재생성합니다. 직접 수정하지 마세요.");
lines.push(" */");
lines.push("");
lines.push('import type { KoreaAdminRegion } from "./korea-admin-regions";');
lines.push("");
lines.push(
  "export const KOREA_SCHOOLS_BY_REGION: Record<KoreaAdminRegion, readonly string[]> = {",
);

for (const region of KOREA_ADMIN_REGIONS) {
  const names = [...byRegion[region]].sort((a, b) => a.localeCompare(b, "ko"));
  lines.push(`  ${JSON.stringify(region)}: [`);
  for (const n of names) {
    lines.push(`    ${JSON.stringify(n)},`);
  }
  lines.push("  ],");
}

lines.push("};");
lines.push("");

fs.writeFileSync(outPath, lines.join("\n"), "utf8");

const total = KOREA_ADMIN_REGIONS.reduce((sum, r) => sum + byRegion[r].size, 0);
console.log(`Wrote ${outPath}`);
console.log(`Regions: ${KOREA_ADMIN_REGIONS.length}, total school rows (deduped per region): ${total}`);
