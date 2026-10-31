import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import * as crypto from "crypto"; 

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(private prisma: PrismaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    if (request.method !== "POST") {
      return next.handle();
    }

    const idempotencyKey = request.headers["x-idempotency-key"];
    if (!idempotencyKey) {
      return next.handle();
    }

    const keyString = String(idempotencyKey);

    if (keyString.length > 255) {
      throw new BadRequestException("Idempotency Key tidak boleh melebihi 255 karakter.");
    }

    let hashedKey = keyString;
    try {
      hashedKey = crypto.createHash("sha256").update(keyString).digest("hex");
      this.logger.debug(`[IDEMPOTENCY] Key hashed: ${keyString} -> ${hashedKey}`);
    } catch (err: any) {
      this.logger.error(`[IDEMPOTENCY] Gagal hash key: ${err.message}`);
      throw new BadRequestException("Idempotency Key tidak valid.");
    }

    const existingRecord = await this.prisma.idempotencyRecord.findUnique({
      where: { key: hashedKey },
    });

    if (existingRecord) {
      this.logger.debug(`[IDEMPOTENCY] Duplikasi terdeteksi: ${hashedKey}`);
      return of(existingRecord.response);
    }

    return next.handle().pipe(
      tap(async (response) => {
        try {
          await this.prisma.idempotencyRecord.upsert({
            where: { key: hashedKey },
            update: {},
            create: {
              key: hashedKey,
              response: JSON.parse(JSON.stringify(response)),
              status_code: context.switchToHttp().getResponse().statusCode || 201,
            },
          });
        } catch (error: any) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            return;
          }
          this.logger.error(`[IDEMPOTENCY] Gagal simpan key: ${error.message}`);
        }
      }),
    );
  }
}