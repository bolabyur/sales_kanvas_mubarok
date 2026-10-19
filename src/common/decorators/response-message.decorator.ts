import { SetMetadata } from '@nestjs/common';

export const RESPONSE_MESSAGE = 'response_message';

/**
 * Tetapkan pesan sukses untuk sebuah handler, dibaca oleh ResponseInterceptor
 * dan dimasukkan ke field `message` pada envelope response.
 *
 * @example
 * @ResponseMessage(AUTH.LOGIN_SUCCESSFUL)
 * login() { ... }
 */
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE, message);
