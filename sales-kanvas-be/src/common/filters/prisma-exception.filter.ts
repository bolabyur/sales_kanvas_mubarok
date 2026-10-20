import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';


@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientValidationError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = 400;
    let message = 'Database error';
    let error = 'BadRequest';

    if (exception instanceof Prisma.PrismaClientValidationError) {
      status = 400;
      message = 'Invalid data provided';
      error = 'ValidationError';
    } else {
      switch (exception.code) {
        case 'P2025':
          status = 404;
          message = 'Record not found';
          error = 'NotFound';
          break;

        case 'P2002': {
          status = 409;
          const target = exception.meta?.target as
            | string
            | string[]
            | undefined;
          const field = Array.isArray(target)
            ? target.join(', ')
            : (target ?? 'value');
          message = `${field} already exists`;
          error = 'Conflict';
          break;
        }

        case 'P2003':
          status = 400;
          message = 'Invalid reference';
          error = 'BadRequest';
          break;

        default:
          status = 400;
          message = `Database error: ${exception.message}`;
          error = 'BadRequest';
      }
    }

    this.logger.error(
      `${request.method} ${request.url} -> ${error}`,
      exception.stack,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      error,
      path: request.url,
    });
  }
}
