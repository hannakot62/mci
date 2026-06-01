import { FastifyInstance } from 'fastify';
import { PostService } from '../services/PostService';
import { validateCreatePost, validateUpdatePost } from '../validators/postValidators';

const postService = new PostService();

interface PostParams {
  id: string;
}

export const registerPostRoutes = (fastify: FastifyInstance): void => {
  // Get all posts
  fastify.get('/posts', async (request, reply) => {
    const posts = await postService.getAllPosts();
    return { success: true, data: posts };
  });

  // Get single post
  fastify.get<{ Params: PostParams }>('/posts/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const post = await postService.getPostById(id);
    return { success: true, data: post };
  });

  // Create post
  fastify.post('/posts', async (request, reply) => {
    const data = validateCreatePost(request.body);
    const post = await postService.createPost(data);
    reply.code(201);
    return { success: true, data: post };
  });

  // Update post
  fastify.put<{ Params: PostParams }>('/posts/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const data = validateUpdatePost(request.body);
    const post = await postService.updatePost(id, data);
    return { success: true, data: post };
  });

  // Delete post
  fastify.delete<{ Params: PostParams }>('/posts/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    await postService.deletePost(id);
    reply.code(204);
    return null;
  });
};
