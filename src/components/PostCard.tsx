import Link from 'next/link';

interface PostCardProps {
  id: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  author_name: string;
  created_at: string;
}

export default function PostCard({ id, title, summary, image_url, author_name, created_at }: PostCardProps) {
  const formattedDate = new Date(created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link href={`/posts/${id}`} style={{ textDecoration: 'none' }}>
      <article className="card animate-fade-in-up" id={`post-card-${id}`}>
        {image_url && (
          <img
            src={image_url}
            alt={title}
            className="card-image"
            loading="lazy"
          />
        )}
        {!image_url && (
          <div
            className="card-image"
            style={{
              background: 'linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              opacity: 0.3,
            }}
          >
            ✍️
          </div>
        )}
        <div className="card-body">
          <h2 className="card-title">{title}</h2>
          {summary && (
            <p className="card-summary">{summary}</p>
          )}
          <div className="card-meta">
            <span className="card-author">By {author_name}</span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
