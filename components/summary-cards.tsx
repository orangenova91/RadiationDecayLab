type SummaryCardsProps = {
  teamCount: number;
  roundCount: number;
  sampleCount: number;
};

export function SummaryCards({ teamCount, roundCount, sampleCount }: SummaryCardsProps) {
  const cards = [
    { label: "참여 팀 수", value: `${teamCount}팀` },
    { label: "회차 수", value: `${roundCount}회` },
    { label: "총 샘플 수", value: `${sampleCount}개` },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <article key={card.label} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-zinc-600">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{card.value}</p>
        </article>
      ))}
    </section>
  );
}
