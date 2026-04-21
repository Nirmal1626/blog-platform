import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import PostCard from '@/components/PostCard';
import SearchBar from '@/components/SearchBar';
import Pagination from '@/components/Pagination';

export const dynamic = 'force-dynamic';

const POSTS_PER_PAGE = 6;

interface HomePageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const search = params.search || '';
  const page = parseInt(params.page || '1', 10);
  const supabase = await createClient();

  // Build query
  let query = supabase
    .from('posts')
    .select(`
      id,
      title,
      summary,
      image_url,
      created_at,
      users!posts_author_id_fkey (name)
    `, { count: 'exact' });

  // Search filter
  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  // Pagination
  const from = (page - 1) * POSTS_PER_PAGE;
  const to = from + POSTS_PER_PAGE - 1;

  const { data: posts, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  const totalPages = Math.ceil((count || 0) / POSTS_PER_PAGE);

  return (
    <>
      <Navbar />
      <main className="page-wrapper">
        <div className="container">
          <div className="page-header animate-fade-in-up">
            <h1 className="page-title">Discover Stories</h1>
            <p className="page-subtitle">
              Explore insightful blog posts with AI-powered summaries
            </p>
          </div>

          <Suspense fallback={<div />}>
            <SearchBar />
          </Suspense>

          {error && (
            <div className="alert alert-error">
              Failed to load posts. Please try again later.
            </div>
          )}

          {posts && posts.length > 0 ? (
            <>
              <div className="post-grid">
                {posts.map((post: Record<string, unknown>) => {
                  const users = post.users as { name: string } | null;
                  return (
                    <PostCard
                      key={post.id as string}
                      id={post.id as string}
                      title={post.title as string}
                      summary={post.summary as string | null}
                      image_url={post.image_url as string | null}
                      author_name={users?.name || 'Unknown'}
                      created_at={post.created_at as string}
                    />
                  );
                })}
              </div>

              <Suspense fallback={<div />}>
                <Pagination currentPage={page} totalPages={totalPages} />
              </Suspense>
            </>
          ) : (
            <div className="empty-state animate-fade-in">
              <div className="empty-state-icon">📝</div>
              <p className="empty-state-text">
                {search
                  ? `No posts found for "${search}"`
                  : 'No posts yet. Be the first to write one!'}
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
