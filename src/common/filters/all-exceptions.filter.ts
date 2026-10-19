import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/** Fallback global — menyamakan bentuk response untuk semua HttpException,
 * termasuk ZodValidationException (nestjs-zod, sudah bawa {message, errors}
 * sendiri lewat getResponse()) dan error yang tidak ditangkap
 * PrismaExceptionFilter. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? ((exceptionResponse as any).message ??
          (exceptionResponse as any).error)
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    const error =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as any).error
        : exception instanceof Error
          ? exception.name
          : 'InternalServerError';

    const errors =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as any).errors
        : undefined;

    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : exception,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message[0] : message,
      ...(errors && { errors }),
      error,
      path: request.url,
    });
  }
}
