import React from 'react';
import { Post } from '../../types/post';
import { PostCard } from '../PostCard/PostCard';
import '../components.scss';

interface PostListProps {
  posts: Post[];
  loading?: boolean;
  error?: string | null;
  onDelete: (id: number) => Promise<void>;
}

export function PostList({ posts, loading, error, onDelete }: PostListProps): React.ReactElement {
  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (posts.length === 0) {
    return <div className="empty-state">No posts yet. Create one!</div>;
  }

  return (
    <div className="post-list">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onDelete={onDelete} />
      ))}
    </div>
  );
}
