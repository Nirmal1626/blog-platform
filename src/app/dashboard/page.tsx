'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';

interface Post {
  id: string;
  title: string;
  created_at: string;
  summary: string | null;
}

interface UserProfile {
  id: string;
  name: string;
  role: string;
}

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!profile || (profile.role !== 'author' && profile.role !== 'admin')) {
        router.push('/');
        return;
      }

      setUser(profile);

      // Fetch posts
      let query = supabase
        .from('posts')
        .select('id, title, created_at, summary')
        .order('created_at', { ascending: false });

      // Authors see only their posts; admins see all
      if (profile.role === 'author') {
        query = query.eq('author_id', authUser.id);
      }

      const { data: postsData } = await query;
      setPosts(postsData || []);
      setLoading(false);
    }

    loadData();
  }, []);

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    setDeleting(postId);
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (!error) {
      setPosts(posts.filter(p => p.id !== postId));
    }
    setDeleting(null);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="page-wrapper">
          <div className="container">
            <div className="loading-container"><div className="spinner" /></div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="page-wrapper">
        <div className="container animate-fade-in-up">
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-title" id="dashboard-title">
                {user?.role === 'admin' ? 'Admin Dashboard' : 'My Posts'}
              </h1>
              <p className="page-subtitle">
                {user?.role === 'admin'
                  ? 'Manage all blog posts and content'
                  : 'Create and manage your blog posts'}
              </p>
            </div>
            <Link href="/dashboard/create" className="btn btn-primary" id="btn-create-post">
              + New Post
            </Link>
          </div>

          {posts.length > 0 ? (
            <table className="dashboard-table" id="dashboard-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Summary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <Link href={`/posts/${post.id}`} style={{ fontWeight: 600 }}>
                        {post.title}
                      </Link>
                    </td>
                    <td>
                      {new Date(post.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        color: post.summary ? 'var(--success)' : 'var(--text-muted)',
                      }}>
                        {post.summary ? '✓ Generated' : '— Pending'}
                      </span>
                    </td>
                    <td>
                      <div className="dashboard-actions">
                        <Link
                          href={`/dashboard/edit/${post.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          Edit
                        </Link>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(post.id)}
                          disabled={deleting === post.id}
                        >
                          {deleting === post.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">✍️</div>
              <p className="empty-state-text">You haven&apos;t created any posts yet</p>
              <Link href="/dashboard/create" className="btn btn-primary">
                Write Your First Post
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
