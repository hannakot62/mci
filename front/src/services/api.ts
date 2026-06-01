import { Post, CreatePostPayload } from '../types/post';

const API_BASE = '/api';

class PostsAPI {
  async fetchAll(): Promise<Post[]> {
    const res = await fetch(`${API_BASE}/posts`);
    if (!res.ok) throw new Error('Failed to fetch posts');
    return res.json();
  }

  async create(payload: CreatePostPayload): Promise<Post> {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create post');
    return res.json();
  }

  async delete(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete post');
  }
}

export const postsAPI = new PostsAPI();
