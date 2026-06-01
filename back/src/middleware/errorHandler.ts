import { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../core/errors/AppError';

export const errorHandler = (
  error: Error | AppError,
  request: FastifyRequest,
  reply: FastifyReply
): void => {
  if (error instanceof AppError) {
    request.log.warn({
      message: error.message,
      statusCode: error.statusCode,
      errorCode: error.errorCode,
    });
    reply.code(error.statusCode).send({
      success: false,
      error: error.message,
      errorCode: error.errorCode,
    });
  } else if (error instanceof SyntaxError) {
    reply.code(400).send({
      success: false,
      error: 'Invalid JSON',
      errorCode: 'INVALID_JSON',
    });
  } else {
    request.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Internal server error',
      errorCode: 'INTERNAL_SERVER_ERROR',
    });
  }
};
