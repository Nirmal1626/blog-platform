'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const { id } = use(params);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadPost() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      const { data: post } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (!post) {
        router.push('/dashboard');
        return;
      }

      // Check permission
      if (profile?.role === 'author' && post.author_id !== user.id) {
        router.push('/dashboard');
        return;
      }

      setTitle(post.title);
      setBody(post.body);
      setImageUrl(post.image_url || '');
      setSummary(post.summary || '');
      setLoading(false);
    }

    loadPost();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        title,
        body,
        image_url: imageUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess('Post updated successfully!');
      setTimeout(() => router.push('/dashboard'), 1500);
    }
    setSaving(false);
  };

  const handleRegenerateSummary = async () => {
    setRegenerating(true);
    setError('');

    try {
      const res = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `${title}\n\n${body}` }),
      });

      if (res.ok) {
        const { summary: newSummary } = await res.json();
        setSummary(newSummary);

        await supabase
          .from('posts')
          .update({ summary: newSummary })
          .eq('id', id);

        setSuccess('Summary regenerated!');
      } else {
        setError('Failed to regenerate summary');
      }
    } catch {
      setError('Failed to regenerate summary');
    }

    setRegenerating(false);
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
        <div className="container" style={{ maxWidth: '700px' }}>
          <div className="animate-fade-in-up">
            <h1 className="page-title" id="edit-post-title">Edit Post</h1>
            <p className="page-subtitle" style={{ marginBottom: 'var(--space-xl)' }}>
              Update your blog post content
            </p>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit} id="edit-post-form">
              <div className="form-group">
                <label className="form-label" htmlFor="post-title">Title</label>
                <input
                  type="text"
                  id="post-title"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="post-image">Featured Image URL</label>
                <input
                  type="url"
                  id="post-image"
                  className="form-input"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                {imageUrl && (
                  <div style={{ marginTop: 'var(--space-sm)' }}>
                    <img
                      src={imageUrl}
                      alt="Preview"
                      style={{
                        maxHeight: '200px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="post-body">Body Content</label>
                <textarea
                  id="post-body"
                  className="form-textarea"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  style={{ minHeight: '300px' }}
                />
              </div>

              {summary && (
                <div className="form-group">
                  <label className="form-label">AI Summary</label>
                  <div className="post-summary-box">
                    <p className="post-summary-text">{summary}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleRegenerateSummary}
                    disabled={regenerating}
                    style={{ marginTop: 'var(--space-sm)' }}
                    id="btn-regenerate-summary"
                  >
                    {regenerating ? (
                      <><div className="spinner" /> Regenerating...</>
                    ) : (
                      '✨ Regenerate Summary'
                    )}
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  id="btn-edit-submit"
                >
                  {saving ? (
                    <><div className="spinner" /> Saving...</>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => router.push('/dashboard')}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
