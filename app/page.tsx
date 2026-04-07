"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { createLabRoom, labExists } from "@/lib/lab-store";

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center p-6">
      <section className="w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
        <div className="mb-6 flex items-center justify-center gap-3">
          <FlaskConical className="h-6 w-6 text-zinc-700" />
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
    </main>
  );
}
