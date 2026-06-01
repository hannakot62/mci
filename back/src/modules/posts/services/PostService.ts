import { Post } from '@prisma/client';
import { getPrismaClient } from '../../../config/database';
import { CreatePostDto } from '../dto/CreatePostDto';
import { UpdatePostDto } from '../dto/UpdatePostDto';
import { NotFoundError } from '../../../core/errors/AppError';

export class PostService {
  private prisma = getPrismaClient();

  async getAllPosts(): Promise<Post[]> {
    return this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPostById(id: number): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundError(`Post with id ${id} not found`);
    }

    return post;
  }

  async createPost(data: CreatePostDto): Promise<Post> {
    return this.prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
      },
    });
  }

  async updatePost(id: number, data: UpdatePostDto): Promise<Post> {
    await this.getPostById(id);

    return this.prisma.post.update({
      where: { id },
      data,
    });
  }

  async deletePost(id: number): Promise<void> {
    await this.getPostById(id);
    await this.prisma.post.delete({
      where: { id },
    });
  }
}
