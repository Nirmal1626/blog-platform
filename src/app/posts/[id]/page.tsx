import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CommentSection from '@/components/CommentSection';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from('posts')
    .select('title, summary')
    .eq('id', id)
    .single();

  return {
    title: post ? `${post.title} — BlogVerse` : 'Post Not Found',
    description: post?.summary || 'Read this blog post on BlogVerse',
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      users!posts_author_id_fkey (name, role)
    `)
    .eq('id', id)
    .single();

  if (error || !post) {
    notFound();
  }

  const author = post.users as { name: string; role: string } | null;

  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <Navbar />
      <main className="page-wrapper">
        <div className="container">
          <article className="post-detail animate-fade-in-up">
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="post-hero-image"
              />
            )}

            <h1 className="post-title" id="post-title">{post.title}</h1>

            <div className="post-meta">
              <span>By <strong>{author?.name || 'Unknown'}</strong></span>
              <span>•</span>
              <span>{formattedDate}</span>
            </div>

            {post.summary && (
              <div className="post-summary-box" id="post-summary">
                <div className="post-summary-label">
                  ✨ AI-Generated Summary
                </div>
                <p className="post-summary-text">{post.summary}</p>
              </div>
            )}

            <div className="post-body" id="post-body">
              {post.body.split('\n').map((paragraph: string, index: number) => (
                paragraph.trim() ? <p key={index}>{paragraph}</p> : null
              ))}
            </div>

            <CommentSection postId={id} />
          </article>
        </div>
      </main>
    </>
  );
}
