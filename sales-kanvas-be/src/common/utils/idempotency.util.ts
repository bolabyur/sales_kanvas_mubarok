// src/common/utils/idempotency.util.ts
import * as crypto from 'crypto';
import stringify from 'fast-json-stable-stringify';
import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function hashPayload(payload: any): string {
  const normalized = stringify(payload);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export function isIdempotencyError(error: any): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const targets = error.meta?.target as string[];
    // Jika array, cek apakah idempotency_key ada di dalamnya. Jika string, cek langsung.
    if (Array.isArray(targets)) return targets.includes('idempotency_key');
    return targets === 'idempotency_key';
  }
  return false;
}

export function validateReplayPayload(existingHash: string | null, currentHash: string) {
  if (existingHash && existingHash !== currentHash) {
    throw new ConflictException('Payload berbeda dengan request sebelumnya (Idempotency Conflict).');
  }
}