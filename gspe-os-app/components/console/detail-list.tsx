export function DetailList({
  rows,
}: {
  rows: { label: string; value: React.ReactNode }[]
}) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-[max-content_1fr]">
      {rows.map((r, i) => (
        <div key={i} className="contents">
          <dt className="text-sm text-muted-foreground">{r.label}</dt>
          <dd className="text-sm font-medium break-words">{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}
