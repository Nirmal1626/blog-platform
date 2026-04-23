'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';

export default function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Check auth
  useEffect(() => {
    async function check() {
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

      if (!profile || (profile.role !== 'author' && profile.role !== 'admin')) {
        router.push('/');
      }
    }
    check();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatus('Creating post...');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    // 1. Create the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        title,
        body,
        image_url: imageUrl || null,
        author_id: user.id,
      })
      .select()
      .single();

    if (postError) {
      setError(postError.message);
      setLoading(false);
      return;
    }

    // 2. Generate AI summary
    setStatus('Generating AI summary...');
    setSummaryLoading(true);

    try {
      const res = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `${title}\n\n${body}` }),
      });

      if (res.ok) {
        const { summary } = await res.json();

        // 3. Update post with summary
        await supabase
          .from('posts')
          .update({ summary })
          .eq('id', post.id);

        setStatus('Post created with AI summary!');
      } else {
        setStatus('Post created (summary generation failed, can retry later)');
      }
    } catch {
      setStatus('Post created (summary generation failed, can retry later)');
    }

    setSummaryLoading(false);
    setLoading(false);

    // Redirect to dashboard after a short delay
    setTimeout(() => {
      router.push('/dashboard');
      router.refresh();
    }, 1500);
  };

  return (
    <>
      <Navbar />
      <main className="page-wrapper">
        <div className="container dashboard-create-container">
          <div className="animate-fade-in-up">
            <h1 className="page-title" id="create-post-title">Create New Post</h1>
            <p className="page-subtitle dashboard-create-subtitle">
              Write your blog post. An AI summary will be automatically generated.
            </p>

            {error && <div className="alert alert-error">{error}</div>}
            {status && !error && (
              <div className="alert alert-success alert-status-row">
                {(loading || summaryLoading) && <div className="spinner" />}
                {status}
              </div>
            )}

            <form onSubmit={handleSubmit} id="create-post-form">
              <div className="form-group">
                <label className="form-label" htmlFor="post-title">Title</label>
                <input
                  type="text"
                  id="post-title"
                  className="form-input"
                  placeholder="Enter a compelling title..."
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
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                {imageUrl && (
                  <div className="image-preview-wrapper">
                    <Image
                      src={imageUrl}
                      alt="Preview"
                      className="image-preview"
                      width={700}
                      height={200}
                      onError={() => setImageUrl('')}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="post-body">Body Content</label>
                <textarea
                  id="post-body"
                  className="form-textarea form-textarea-large"
                  placeholder="Write your blog post content here..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                />
              </div>

              <div className="form-action-row">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  id="btn-create-submit"
                >
                  {loading ? (
                    <><div className="spinner" /> Publishing...</>
                  ) : (
                    '✨ Publish Post'
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => router.back()}
                  disabled={loading}
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
