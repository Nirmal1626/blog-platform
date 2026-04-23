'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set('search', query);
        params.delete('page'); // Reset page on new search
      } else {
        params.delete('search');
      }
      router.push(`/?${params.toString()}`);
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="search-container" id="search-container">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        className="search-input"
        placeholder="Search blog posts..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        id="search-input"
      />
    </div>
  );
}
