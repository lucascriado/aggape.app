export function visiblePageNumbers(currentPage: number, pageCount: number, visibleCount = 3) {
  const count = Math.min(visibleCount, pageCount);
  const half = Math.floor(count / 2);
  const start = Math.max(1, Math.min(currentPage - half, pageCount - count + 1));

  return Array.from({ length: count }, (_, index) => start + index);
}
