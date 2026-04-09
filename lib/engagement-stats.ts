import { doc, increment, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LabMeta } from "@/lib/lab-store";

const OVERVIEW_ID = "overview";

export type EngagementOverview = {
  totalLabSessions: number;
  uniqueSchools: number;
  updatedAt?: unknown;
};

/** region + schoolName 기준 SHA-256(hex 64자) — Firestore stats 문서 ID */
export async function hashSchoolKey(region: string, schoolName: string): Promise<string> {
  const normalized = `${region.trim()}|${schoolName.trim()}`;
  const enc = new TextEncoder().encode(normalized);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * 실험실 생성 직후 호출: 누적 실험실 수·유일 학교(지역+학교명) 수를 갱신합니다.
 * 실패해도 실험실 생성 자체는 유지합니다.
 */
export async function recordLabEngagement(meta: LabMeta): Promise<void> {
  const region = meta.region.trim();
  const schoolName = meta.schoolName.trim();
  const key = await hashSchoolKey(region, schoolName);
  const schoolRef = doc(db, "stats", key);
  const overviewRef = doc(db, "stats", OVERVIEW_ID);

  await runTransaction(db, async (transaction) => {
    const schoolSnap = await transaction.get(schoolRef);

    if (!schoolSnap.exists()) {
      transaction.set(schoolRef, {
        region,
        schoolName,
        sessionCount: 1,
        firstAt: serverTimestamp(),
        lastAt: serverTimestamp(),
      });
      transaction.set(
        overviewRef,
        {
          totalLabSessions: increment(1),
          uniqueSchools: increment(1),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } else {
      transaction.update(schoolRef, {
        sessionCount: increment(1),
        lastAt: serverTimestamp(),
      });
      transaction.set(
        overviewRef,
        {
          totalLabSessions: increment(1),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }
  });
}
