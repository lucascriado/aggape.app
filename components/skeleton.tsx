export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`skeleton ${className}`} aria-hidden="true" />;
}

export function NumberSkeleton({ className = "" }: { className?: string }) {
  return <Skeleton className={`skeleton-number ${className}`} />;
}

export function ActivitySkeleton({ count = 5 }: { count?: number }) {
  return <div className="activity-skeleton-list" aria-label="Carregando atividades">{Array.from({ length: count }, (_, index) => <div className="activity-skeleton" key={index}><Skeleton className="skeleton-circle" /><span><Skeleton className="skeleton-title" /><Skeleton className="skeleton-text" /></span></div>)}</div>;
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return <div className="table-skeleton" aria-label="Carregando registros">{Array.from({ length: rows }, (_, row) => <div className="table-skeleton-row" key={row}>{Array.from({ length: columns }, (_, column) => <Skeleton className={column === 0 ? "skeleton-table-name" : "skeleton-table-cell"} key={column} />)}</div>)}</div>;
}
