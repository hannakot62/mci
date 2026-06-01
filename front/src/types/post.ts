export interface Post {
  id: number;
  title: string;
  content: string | null;
  createdAt: string;
}

export interface CreatePostPayload {
  title: string;
  content: string;
}
