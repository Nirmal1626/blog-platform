'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
  users: {
    name: string;
    role: string;
  };
}

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchComments();
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', user.id)
        .single();
      setCurrentUser(profile);
    }
  }

  async function fetchComments() {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        comment_text,
        created_at,
        user_id,
        users (name, role)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (data) {
      setComments(data as unknown as Comment[]);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in to comment.');
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        comment_text: newComment.trim(),
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setNewComment('');
      fetchComments();
    }
    setSubmitting(false);
  }

  async function handleDelete(commentId: string) {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (!error) {
      setComments(comments.filter(c => c.id !== commentId));
    }
  }

  if (loading) {
    return (
      <div className="comments-section">
        <h3 className="comments-title">Comments</h3>
        <div className="loading-container"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="comments-section" id="comments-section">
      <h3 className="comments-title">Comments ({comments.length})</h3>

      {comments.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
          <p style={{ color: 'var(--text-muted)' }}>No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        comments.map((comment) => (
          <div key={comment.id} className="comment-item animate-fade-in" id={`comment-${comment.id}`}>
            <div className="comment-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="comment-author">{comment.users?.name || 'Unknown'}</span>
                {comment.users?.role && (
                  <span className="navbar-role" style={{ fontSize: '0.6rem' }}>
                    {comment.users.role}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="comment-date">
                  {new Date(comment.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                {currentUser && (currentUser.id === comment.user_id || currentUser.role === 'admin') && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(comment.id)}
                    style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            <p className="comment-text">{comment.comment_text}</p>
          </div>
        ))
      )}

      {currentUser ? (
        <form className="comment-form" onSubmit={handleSubmit} id="comment-form">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">Add a Comment</label>
            <textarea
              className="form-textarea"
              placeholder="Write your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
              id="comment-textarea"
              style={{ minHeight: '100px' }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !newComment.trim()}
            id="btn-submit-comment"
          >
            {submitting ? (
              <>
                <div className="spinner" /> Posting...
              </>
            ) : (
              'Post Comment'
            )}
          </button>
        </form>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-lg)',
          background: 'var(--bg-glass)',
          borderRadius: 'var(--radius-md)',
          marginTop: 'var(--space-lg)',
          border: '1px solid var(--border-color)',
        }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
            Sign in to leave a comment
          </p>
          <a href="/login" className="btn btn-primary btn-sm">Sign In</a>
        </div>
      )}
    </div>
  );
}
