export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-2xl bg-surface-muted ${className}`} />
}

export function SkeletonGrid({
  cards,
  cardClassName,
  gridClassName,
}: {
  cards: number
  cardClassName: string
  gridClassName: string
}) {
  return (
    <div className={gridClassName}>
      {Array.from({ length: cards }, (_, i) => (
        <Skeleton key={i} className={cardClassName} />
      ))}
    </div>
  )
}
