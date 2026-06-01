import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

interface CreatePostBody {
  title: string;
  content?: string | null;
}

interface UpdatePostBody {
  title: string;
  content?: string | null;
}

interface PostParams {
  id: string;
}

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

// Get all posts
fastify.get('/posts', async (request, reply) => {
  const posts = await prisma.post.findMany();
  return posts;
});

// Get single post
fastify.get<{ Params: PostParams }>('/posts/:id', async (request, reply) => {
  const { id } = request.params;
  const post = await prisma.post.findUnique({
    where: { id: parseInt(id) }
  });
  if (!post) {
    reply.code(404);
    return { error: 'Post not found' };
  }
  return post;
});

// Create post
fastify.post<{ Body: CreatePostBody }>('/posts', async (request, reply) => {
  const { title, content } = request.body;
  const post = await prisma.post.create({
    data: {
      title,
      content: content || null
    }
  });
  reply.code(201);
  return post;
});

// Update post
fastify.put<{ Params: PostParams; Body: UpdatePostBody }>('/posts/:id', async (request, reply) => {
  const { id } = request.params;
  const { title, content } = request.body;
  const post = await prisma.post.update({
    where: { id: parseInt(id) },
    data: { title, content }
  });
  return post;
});

// Delete post
fastify.delete<{ Params: PostParams }>('/posts/:id', async (request, reply) => {
  const { id } = request.params;
  await prisma.post.delete({
    where: { id: parseInt(id) }
  });
  reply.code(204);
});

const start = async (): Promise<void> => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('✅ Server running at http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  await fastify.close();
  process.exit(0);
});
