"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDocs, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { Users } from "lucide-react";
import { db } from "@/lib/firebase";
import type { EngagementOverview } from "@/lib/engagement-stats";

const OVERVIEW_PATH = ["stats", "overview"] as const;
const SCHOOL_LIST_LIMIT = 500;

type SchoolStatRow = {
  id: string;
  region: string;
  schoolName: string;
  sessionCount: number;
};

export function EngagementStatsBanner() {
  const [data, setData] = useState<EngagementOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [schoolRows, setSchoolRows] = useState<SchoolStatRow[] | null>(null);
  const [schoolRowsLoading, setSchoolRowsLoading] = useState(false);
  const [schoolRowsError, setSchoolRowsError] = useState("");

  useEffect(() => {
    const ref = doc(db, ...OVERVIEW_PATH);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setData(null);
        } else {
          const d = snap.data() as Partial<EngagementOverview>;
          setData({
            totalLabSessions: typeof d.totalLabSessions === "number" ? d.totalLabSessions : 0,
            uniqueSchools: typeof d.uniqueSchools === "number" ? d.uniqueSchools : 0,
            updatedAt: d.updatedAt,
          });
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const loadSchoolRows = async () => {
    if (schoolRowsLoading) {
      return;
    }
    setSchoolRowsLoading(true);
    setSchoolRowsError("");
    try {
      const q = query(
        collection(db, "stats"),
        orderBy("sessionCount", "desc"),
        limit(SCHOOL_LIST_LIMIT),
      );
      const snap = await getDocs(q);
      const rows = snap.docs
        .map((row) => {
          const d = row.data();
          return {
            id: row.id,
            region: typeof d.region === "string" ? d.region : "",
            schoolName: typeof d.schoolName === "string" ? d.schoolName : "",
            sessionCount: typeof d.sessionCount === "number" ? d.sessionCount : 0,
          } satisfies SchoolStatRow;
        })
        .filter((row) => row.region && row.schoolName);
      setSchoolRows(rows);
    } catch (err) {
      console.error("[EngagementStatsBanner] loadSchoolRows", err);
      setSchoolRowsError("학교별 통계를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSchoolRowsLoading(false);
    }
  };

  const handleOpenModal = async () => {
    setModalOpen(true);
    if (schoolRows === null) {
      await loadSchoolRows();
    }
  };

  if (loading) {
    return (
      <div className="mb-5 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-center text-sm text-zinc-500">
        참여 통계를 불러오는 중…
      </div>
    );
  }

  if (!data || (data.totalLabSessions === 0 && data.uniqueSchools === 0)) {
    return (
      <div className="mb-5 rounded-xl border border-amber-100 bg-amber-50/90 px-4 py-3 text-center text-sm text-amber-950">
        실험실이 만들어지면 전국 참여 학교 수가 여기에 표시됩니다.
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-emerald-950 shadow-sm">
        <div className="relative flex min-h-10 items-center justify-end">
          <p className="absolute left-1/2 -translate-x-1/2 text-center text-sm font-medium leading-relaxed">
            전국에서 누적{" "}
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 align-middle text-xs font-bold text-white shadow-sm">
              총
              <strong className="tabular-nums text-sm">
                {data.totalLabSessions.toLocaleString("ko-KR")}
              </strong>
              회
            </span>{" "}
            실험실이 개설되었습니다.
          </p>
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-white/80 px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-white"
          >
            <Users className="h-3.5 w-3.5" aria-hidden />
            통계 보기
          </button>
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-zinc-900">참여 학교별 실험실 개설 횟수</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                닫기
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              누적 참여 학교 수: {data.uniqueSchools.toLocaleString("ko-KR")}개
            </p>

            {schoolRowsLoading ? (
              <p className="mt-4 text-sm text-zinc-500">통계를 불러오는 중…</p>
            ) : null}
            {schoolRowsError ? <p className="mt-4 text-sm text-red-600">{schoolRowsError}</p> : null}

            {schoolRows && schoolRows.length > 0 ? (
              <div className="mt-4 max-h-[50vh] overflow-y-auto rounded-lg border border-zinc-200">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-zinc-50 text-zinc-700">
                    <tr>
                      <th className="px-3 py-2 font-medium">지역</th>
                      <th className="px-3 py-2 font-medium">학교명</th>
                      <th className="px-3 py-2 text-right font-medium">개설 횟수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolRows.map((row) => (
                      <tr key={row.id} className="border-t border-zinc-100">
                        <td className="px-3 py-2 text-zinc-700">{row.region}</td>
                        <td className="px-3 py-2 text-zinc-900">{row.schoolName}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-zinc-900">
                          {row.sessionCount.toLocaleString("ko-KR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
