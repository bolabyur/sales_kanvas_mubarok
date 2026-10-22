import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { Prisma } from '@prisma/client';
import { ZodValidationException } from 'nestjs-zod';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Terjadi kesalahan pada server';
    let details: any = null;

    // 1. Tangkap Error dari Validasi Zod
    if (exception instanceof ZodValidationException) {
      status = HttpStatus.BAD_REQUEST;
      message = "Validasi Gagal";
      
      const zodError = (exception as any).getZodError ? (exception as any).getZodError() : exception;
      const errorsArray = zodError?.errors || (exception as any).errors || [];
      
      details = errorsArray.map((err: any) => ({
        field: err.path?.join('.') || 'unknown',
        message: err.message || 'Nilai tidak valid'
      }));
      if (details.length === 0) details = "Periksa kembali isian form Anda.";
    } 
    // 2. Tangkap Error dari NestJS (Custom BadRequest, Unauthorized, dll)
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || res;
    } 
    // 3. Tangkap Error dari Database (Prisma Standard)
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      if (exception.code === 'P2002') {
        message = `Data Gagal Disimpan (Duplikat)`;
        details = `Kolom [${exception.meta?.target}] sudah terdaftar di sistem.`;
      } else if (exception.code === 'P2003') {
        message = `Gagal Menghapus Data (Relasi Terkunci)`;
        details = `Data ini tidak bisa dihapus karena masih digunakan oleh data lain.`;
      } else {
        message = `Database Error: ${exception.code}`;
        details = exception.message;
      }
    } 
    // 4. Tangkap Error JavaScript Biasa & Prisma Driver Adapter (PG)
    else if (exception instanceof Error) {
      let rawMsg = exception.message;
      
      // PERBAIKAN: Deteksi jika error dari Prisma Adapter berbentuk JSON string
      if (rawMsg.startsWith('{') && rawMsg.endsWith('}')) {
        try {
          const parsed = JSON.parse(rawMsg);
          // Kode 23001 = Postgres Foreign Key Constraint (Restrict)
          if (parsed.originalCode === '23001' || parsed.originalMessage?.includes('violates RESTRICT setting')) {
             status = HttpStatus.BAD_REQUEST;
             message = "Gagal Menghapus Data";
             details = "Data ini tidak bisa dihapus karena masih digunakan oleh User atau data lain di sistem.";
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
    console.error(`[ERROR] ${request.method} ${request.url}`, { message, details });

    response.status(status).json({
      success: false,
      statusCode: status,
      message: message,
      details: details,
      path: request.url,
    });
  }
}