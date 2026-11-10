import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { Observable, of } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { PrismaService } from "../../prisma/prisma.service";
import * as crypto from "crypto";
import { hashPayload } from "../utils/idempotency.util";

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(private prisma: PrismaService) { }

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

    // 🔥 TAMBAHKAN SCOPE USER ID
    const user = request.user; 
    if (!user) {
      return next.handle();
    }

    const keyString = String(idempotencyKey);
    if (keyString.length > 255) {
      throw new BadRequestException("Idempotency Key tidak boleh melebihi 255 karakter.");
    }

    // 🔥 HASH KEY + USER ID (Mencegah User B melihat cache User A)
    const hashedKey = crypto.createHash("sha256").update(`${user.id}-${keyString}`).digest("hex");
    const currentPayloadHash = hashPayload(request.body);

    const existingRecord = await this.prisma.idempotencyRecord.findUnique({
      where: { key: hashedKey },
    });

    if (existingRecord) {
      if (existingRecord.payload_hash !== currentPayloadHash) {
        throw new ConflictException("Payload berbeda dengan request sebelumnya (Idempotency Conflict).");
      }

      this.logger.debug(`[IDEMPOTENCY-CACHE] Replay: ${hashedKey}`);

      context.switchToHttp().getResponse().status(existingRecord.status_code);

      return of(existingRecord.response);
    }

    return next.handle().pipe(
      mergeMap(async (response) => {
        try {
          await this.prisma.idempotencyRecord.upsert({
            where: { key: hashedKey },
            update: {},
            create: {
              key: hashedKey,
              payload_hash: currentPayloadHash,
              response: JSON.parse(JSON.stringify(response)),
              status_code: context.switchToHttp().getResponse().statusCode || 201,
            },
          });
        } catch (error: any) {
        }
        return response;
      }),
    );
  }
}