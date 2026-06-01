import { useState, useEffect, useCallback } from 'react';
import { Post, CreatePostPayload } from '../types/post';
import { postsAPI } from '../services/api';

interface UsePostsReturn {
  posts: Post[];
  loading: boolean;
  error: string | null;
  createPost: (payload: CreatePostPayload) => Promise<void>;
  deletePost: (id: number) => Promise<void>;
  refreshPosts: () => Promise<void>;
}

export function usePosts(): UsePostsReturn {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPosts = useCallback(async () => {
    try {
      setError(null);
      const data = await postsAPI.fetchAll();
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  useEffect(() => {
    refreshPosts();
  }, [refreshPosts]);

  const createPost = useCallback(
    async (payload: CreatePostPayload) => {
      setLoading(true);
      try {
        setError(null);
        const newPost = await postsAPI.create(payload);
        setPosts((prev) => [...prev, newPost]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create post');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deletePost = useCallback(async (id: number) => {
    try {
      setError(null);
      await postsAPI.delete(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
      throw err;
    }
  }, []);

  return { posts, loading, error, createPost, deletePost, refreshPosts };
}
