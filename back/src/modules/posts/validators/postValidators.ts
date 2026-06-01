import { CreatePostDto } from '../dto/CreatePostDto';
import { UpdatePostDto } from '../dto/UpdatePostDto';
import { ValidationError } from '../../../core/errors/AppError';

export const validateCreatePost = (data: unknown): CreatePostDto => {
  if (typeof data !== 'object' || data === null) {
    throw new ValidationError('Request body must be an object');
  }

  const body = data as Record<string, unknown>;
  const title = body.title;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new ValidationError('Title is required and must be a non-empty string');
  }

  if (body.content !== undefined && body.content !== null && typeof body.content !== 'string') {
    throw new ValidationError('Content must be a string or null');
  }

  return {
    title: title.trim(),
    content: body.content ? (body.content as string).trim() || null : null,
  };
};

export const validateUpdatePost = (data: unknown): UpdatePostDto => {
  if (typeof data !== 'object' || data === null) {
    throw new ValidationError('Request body must be an object');
  }

  const body = data as Record<string, unknown>;
  const result: UpdatePostDto = {};

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length === 0) {
      throw new ValidationError('Title must be a non-empty string');
    }
    result.title = body.title.trim();
  }

  if (body.content !== undefined) {
    if (body.content !== null && typeof body.content !== 'string') {
      throw new ValidationError('Content must be a string or null');
    }
    result.content = body.content ? (body.content as string).trim() || null : null;
  }

  if (Object.keys(result).length === 0) {
    throw new ValidationError('At least one field must be provided');
  }

  return result;
};
