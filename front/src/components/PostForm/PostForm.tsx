import React, { useState } from 'react';
import { CreatePostPayload } from '../../types/post';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { TextArea } from '../common/Input';
import '../components.scss';

interface PostFormProps {
  onSubmit: (data: CreatePostPayload) => Promise<void>;
  loading?: boolean;
}

export function PostForm({ onSubmit, loading = false }: PostFormProps): React.ReactElement {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      await onSubmit({ title, content });
      setTitle('');
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    }
  };

  return (
    <form className="post-form" onSubmit={handleSubmit}>
      <h2>Create a New Post</h2>

      {error && <div className="error-message">{error}</div>}

      <Input
        label="Title"
        placeholder="Enter post title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={loading}
      />

      <TextArea
        label="Content"
        placeholder="Enter post content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={loading}
      />

      <Button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Post'}
      </Button>
    </form>
  );
}
