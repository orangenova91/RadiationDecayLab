"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Radiation } from "lucide-react";
import { createLabRoom, labExists } from "@/lib/lab-store";

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [manualOpen, setManualOpen] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const code = await createLabRoom();
      router.push(`/lab/${code}`);
    } catch {
      setError("실험실 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const code = roomCode.trim().toUpperCase();
    if (!code) {
      setError("실험실 코드를 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const exists = await labExists(code);
      if (!exists) {
        setError("실험실 코드를 찾을 수 없습니다.");
        return;
      }
      router.push(`/lab/${code}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-y-auto px-6 pb-10 pt-4 sm:pt-6">
      {/* 고정 높이 영역 하단에 카드 정렬 → 설명서와 간격을 줄이고, 펼침 시에도 카드 위치 유지 */}
      <div className="flex w-full shrink-0 flex-col items-center justify-end pb-1 min-h-[min(520px,calc(100dvh-12rem))]">
        <section className="w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <Radiation className="h-7 w-7 shrink-0 text-amber-600" aria-hidden />
            <h1 className="text-2xl font-bold text-zinc-900">방사성 동위 원소 붕괴 실험실</h1>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:items-end sm:justify-center">
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              실험실 생성
            </button>

            <div className="flex items-center justify-center gap-2">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="실험실 입장하기 (코드 입력)"
                className="w-50 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={handleJoin}
                disabled={loading}
                className="whitespace-nowrap rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400"
              >
                입장
              </button>
            </div>
          </div>

          {error ? <p className="mt-3 text-center text-sm text-red-600">{error}</p> : null}
        </section>
      </div>

      <section
        className="mt-4 w-full shrink-0 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8"
        aria-labelledby="manual-heading"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2
            id="manual-heading"
            className="flex min-w-0 flex-wrap items-center gap-2 text-xl font-semibold text-zinc-900"
          >
            <span className="shrink-0 rounded-md bg-red-100 px-2.5 py-1 text-xs font-bold text-red-900 ring-1 ring-inset ring-red-300/80">
              필독
            </span>
            <span className="min-w-0">실험실 사용 주의사항</span>
          </h2>
          <button
            type="button"
            onClick={() => setManualOpen((open) => !open)}
            aria-expanded={manualOpen}
            aria-controls="manual-content"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          >
            <ChevronDown
              className={`size-4 shrink-0 transition-transform duration-200 ${manualOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
            {manualOpen ? "접기" : "펼치기"}
          </button>
        </div>
        {manualOpen ? (
        <div
          id="manual-content"
          className="space-y-4 text-left text-sm leading-relaxed text-zinc-700"
        >
          <div>
            <h3 className="mb-1.5 font-medium text-zinc-900">1. 실험실 만들기·들어가기</h3>
            <ul className="list-inside list-disc space-y-1 pl-0.5">
              <li>
                <strong className="font-medium text-zinc-800">실험실 생성</strong>을 누르면 새 코드가 만들어지며 바로 실험실 화면으로 이동합니다.
              </li>
              <li>
              학생들은 생성된 실험실의 상단에 표시된 <strong className="font-medium text-zinc-800">실험실 코드</strong>를 입력하고 <strong className="font-medium text-zinc-800">입장</strong>을 눌러 실험실에 입장합니다.
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-1.5 font-medium text-zinc-900">2. 조별 데이터 입력</h3>
            <ul className="mb-1.5 list-inside list-disc space-y-1 pl-0.5">
              <li>실험실에는 각 조(팀)에 해당하는 실험대가 있습니다.</li>
              <li>
                자신의 실험대에서 각 회차에서 <strong className="font-medium text-zinc-800">빼낸 동전 수</strong>를 입력합니다.
              </li>
              <li>누적값이 초기 동전 수를 넘지 않도록 입력해야 합니다.</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-1.5 font-medium text-zinc-900">3. 상단 설정 패널</h3>
            <ul className="list-inside list-disc space-y-1 pl-0.5">
              <li>
                <strong className="font-medium text-zinc-800">보기 모드</strong>: 실시간 반영은 입력 즉시 차트에 반영됩니다. 합산 반영은 조에서 데이터를 제출한 뒤 통합됩니다.
              </li>
              <li>
                <strong className="font-medium text-zinc-800">라운드 수·조 수·초기 동전(주사위) 수</strong>는 실험 설계에 맞게 조정합니다.
              </li>
              <li>
                <strong className="font-medium text-zinc-800">동전 사러가기</strong>는 동전 구매 안내 페이지로 이동합니다. 끝나면 같은 실험실로 돌아올 수 있습니다.
              </li>
              <li>
                <strong className="font-medium text-zinc-800">전체 초기화</strong>는 설정과 모든 조의 입력을 처음 상태로 되돌립니다.
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-1.5 font-medium text-zinc-900">4. 고급 설정(붕괴 확률 p)</h3>
            <p className="mb-1.5">
              <strong className="font-medium text-zinc-800">고급 설정</strong>을 펼치면 한 라운드에서 개체 하나가 붕괴할 확률 <strong className="font-medium text-zinc-800">p</strong>를 바꿀 수 있습니다. 동전(50%)·주사위(면 수에 따른 분수) 등에 맞추면 이론 곡선이 그에 맞게 그려집니다.
            </p>
          </div>
          <div>
            <h3 className="mb-1.5 font-medium text-zinc-900">5. 차트·나가기</h3>
            <ul className="list-inside list-disc space-y-1 pl-0.5">
              <li>통합 차트에서 조별 결과와 이론값(파란선 등)을 비교할 수 있습니다. 범례·체크박스로 표시 여부를 조절할 수 있습니다.</li>
              <li>
                <strong className="font-medium text-zinc-800">실험실 나가기</strong>를 누르면 이 화면(로비)으로 돌아옵니다.
              </li>
            </ul>
          </div>
        </div>
        ) : null}
      </section>
    </main>
  );
}
