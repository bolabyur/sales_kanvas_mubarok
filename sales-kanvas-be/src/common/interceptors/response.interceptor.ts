import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE } from '../decorators/response-message.decorator';
import { ApiResponse } from '../interfaces/api-response.interface';

/** Membungkus semua response sukses jadi envelope standar {success, message,
 * data, statusCode}. Pesan diambil dari @ResponseMessage() di handler. */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<unknown>> {
    const response = context.switchToHttp().getResponse();
    const message = this.reflector.getAllAndOverride<string>(
      RESPONSE_MESSAGE,
      [context.getHandler(), context.getClass()],
    );

    return next.handle().pipe(
      map((data: unknown) => ({
        success: true,
        message: message ?? 'Request successful',
        data: data ?? null,
        statusCode: response.statusCode,
      })),
    );
  }
}
