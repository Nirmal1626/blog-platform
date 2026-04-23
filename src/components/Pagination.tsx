'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/?${params.toString()}`);
  };

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="pagination" id="pagination">
      <button
        className="pagination-btn"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        id="pagination-prev"
      >
        ← Prev
      </button>

      {start > 1 && (
        <>
          <button className="pagination-btn" onClick={() => goToPage(1)}>1</button>
          {start > 2 && <span className="pagination-ellipsis">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
          onClick={() => goToPage(page)}
          id={`pagination-page-${page}`}
        >
          {page}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
          <button className="pagination-btn" onClick={() => goToPage(totalPages)}>
            {totalPages}
          </button>
        </>
      )}

      <button
        className="pagination-btn"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        id="pagination-next"
      >
        Next →
      </button>
    </div>
  );
}
