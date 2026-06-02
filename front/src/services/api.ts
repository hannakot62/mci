import { Post, CreatePostPayload } from '../types/post';

const API_BASE = '/api';

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: string;
  errorCode?: string;
}

function isApiEnvelope(
  body: unknown
): body is ApiSuccessResponse<unknown> | ApiErrorResponse {
  return typeof body === 'object' && body !== null && 'success' in body;
}

async function parseApiResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return undefined as T;
  }

  const body: unknown = await res.json();

  if (!isApiEnvelope(body)) {
    throw new Error(`Unexpected response (${res.status})`);
  }

  if (!res.ok || !body.success) {
    const message =
      !body.success && body.error ? body.error : `Request failed (${res.status})`;
    throw new Error(message);
  }

  if (body.data === undefined) {
    throw new Error('Response missing data');
  }

  return body.data as T;
}

class PostsAPI {
  async fetchAll(): Promise<Post[]> {
    const res = await fetch(`${API_BASE}/posts`);
    return parseApiResponse<Post[]>(res);
  }

  async create(payload: CreatePostPayload): Promise<Post> {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return parseApiResponse<Post>(res);
  }

  async delete(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      method: 'DELETE',
    });
    await parseApiResponse<void>(res);
  }
}

export const postsAPI = new PostsAPI();
