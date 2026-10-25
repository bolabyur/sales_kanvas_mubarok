import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response, Request } from 'express';
import { Prisma } from '@prisma/client';
import { ZodValidationException } from 'nestjs-zod';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Terjadi kesalahan pada server (Internal Server Error)';
    let details: any = null;

    if (exception instanceof ZodValidationException) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validasi Gagal';
      
      const zodError = (exception as any).getZodError ? (exception as any).getZodError() : exception;
      const errorsArray = zodError?.errors || (exception as any).errors || [];
      
      details = errorsArray.map((err: any) => ({
        field: err.path?.join('.') || 'unknown',
        message: err.message || 'Nilai tidak valid'
      }));
      if (details.length === 0) details = 'Periksa kembali isian form Anda.';
    } 
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || res;
    } 
    else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validasi Database Gagal';
      const lines = exception.message.split('\n');
      details = lines[lines.length - 1].trim(); 
    }
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      if (exception.code === 'P2002') {
        message = 'Data Gagal Disimpan (Duplikat)';
        details = `Kolom [${exception.meta?.target}] sudah terdaftar di sistem.`;
      } else if (exception.code === 'P2003') {
        message = 'Gagal Memproses Data (Relasi Terkunci)';
        details = 'Data ini tidak bisa diproses karena masih digunakan oleh data lain.';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Data Tidak Ditemukan';
        details = exception.meta?.cause || 'Data yang Anda cari tidak ada di database.';
      } else {
        message = `Database Error: ${exception.code}`;
        details = exception.message;
      }
    } 
    else if (exception instanceof Error) {
      let rawMsg = exception.message;
      
      if (rawMsg.startsWith('{') && rawMsg.endsWith('}')) {
        try {
          const parsed = JSON.parse(rawMsg);
          if (parsed.originalCode === '23001' || parsed.originalMessage?.includes('violates RESTRICT setting')) {
             status = HttpStatus.BAD_REQUEST;
             message = 'Gagal Menghapus Data';
             details = 'Data ini tidak bisa dihapus karena masih terikat dengan transaksi lain.';
          } else {
             message = parsed.originalMessage || parsed.message || rawMsg;
          }
        } catch (e) {
          message = rawMsg;
        }
      } else {
        message = rawMsg;
      }
    }

    this.logger.error(
      `[${request.method}] ${request.url} -> ${status} : ${message}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      message: message,
      details: details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}