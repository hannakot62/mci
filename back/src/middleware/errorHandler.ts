import { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../core/errors/AppError';

function getHttpStatusCode(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) {
    return undefined;
  }
  const statusCode = (error as { statusCode: unknown }).statusCode;
  return typeof statusCode === 'number' && statusCode >= 400 && statusCode < 600
    ? statusCode
    : undefined;
}

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
    const statusCode = getHttpStatusCode(error);
    if (statusCode !== undefined) {
      request.log.warn({ message: error.message, statusCode });
      reply.code(statusCode).send({
        success: false,
        error: error.message,
        errorCode: 'code' in error && typeof error.code === 'string' ? error.code : 'REQUEST_ERROR',
      });
      return;
    }
    request.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Internal server error',
      errorCode: 'INTERNAL_SERVER_ERROR',
    });
  }
};
