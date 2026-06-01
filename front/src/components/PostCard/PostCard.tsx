import React from 'react';
import { Post } from '../../types/post';
import { Button } from '../common/Button';
import '../components.scss';

interface PostCardProps {
  post: Post;
  onDelete: (id: number) => Promise<void>;
}

export function PostCard({ post, onDelete }: PostCardProps): React.ReactElement {
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (confirm('Are you sure?')) {
      setDeleting(true);
      try {
        await onDelete(post.id);
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <article className="post-card">
      <div className="post-card__header">
        <h2 className="post-card__title">{post.title}</h2>
        <time className="post-card__date">
          {new Date(post.createdAt).toLocaleString()}
        </time>
      </div>

      {post.content && <p className="post-card__content">{post.content}</p>}

      <div className="post-card__footer">
        <Button
          variant="danger"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </article>
  );
}
