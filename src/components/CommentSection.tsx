'use client';

import { useState, useEffect, useCallback } from 'react';
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

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
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
  }, [postId, supabase]);

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', user.id)
        .single();
      setCurrentUser(profile);
    }
  }, [supabase]);

  useEffect(() => {
    const initializeData = async () => {
      await fetchComments();
      await checkUser();
    };
    
    initializeData().catch(console.error);
  }, [fetchComments, checkUser]);

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
        <div className="empty-state">
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        comments.map((comment) => (
          <div key={comment.id} className="comment-item animate-fade-in" id={`comment-${comment.id}`}>
            <div className="comment-header">
              <div className="comment-header-author">
                <span className="comment-author">{comment.users?.name || 'Unknown'}</span>
                {comment.users?.role && (
                  <span className="navbar-role comment-role">
                    {comment.users.role}
                  </span>
                )}
              </div>
              <div className="comment-header-actions">
                <span className="comment-date">
                  {new Date(comment.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                {currentUser && (currentUser.id === comment.user_id || currentUser.role === 'admin') && (
                  <button
                    className="btn btn-danger btn-sm comment-delete-btn"
                    onClick={() => handleDelete(comment.id)}
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
        <div className="signin-container">
          <p>Sign in to leave a comment</p>
          <a href="/login" className="btn btn-primary btn-sm">Sign In</a>
        </div>
      )}
    </div>
  );
}
