import React from 'react';
import { PostForm } from './components/PostForm/PostForm';
import { PostList } from './components/PostList/PostList';
import { usePosts } from './hooks/usePosts';
import './styles/globals.scss';

function App(): React.ReactElement {
  const { posts, loading, error, createPost, deletePost } = usePosts();

  return (
    <main className="container">
      <h1>Posts</h1>

      <PostForm onSubmit={createPost} loading={loading} />

      <PostList
        posts={posts}
        loading={loading}
        error={error}
        onDelete={deletePost}
      />
    </main>
  );
}

export default App;
