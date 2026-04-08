import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "동전 사러가기",
};

function parseRoomFromSearch(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || typeof raw !== "string") {
    return null;
  }
  const code = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length < 4 || code.length > 12) {
    return null;
  }
  return code;
}

export default async function CoinShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const labRoom = parseRoomFromSearch(sp.room);

  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-2xl flex-col items-center justify-center gap-4 p-6">
      <section className="w-full rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-center text-sm text-zinc-600">제품 준비중입니다. 조금만 기다려 주세요.</p>
      </section>
      {labRoom ? (
        <Link
          href={`/lab/${labRoom}`}
          className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
        >
          실험실로 돌아가기
        </Link>
      ) : (
        <Link href="/" className="text-sm font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900">
          로비로 돌아가기
        </Link>
      )}
    </main>
  );
}
