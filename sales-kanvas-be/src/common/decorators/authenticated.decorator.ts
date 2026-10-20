import { SetMetadata } from '@nestjs/common';

export const AUTH_ONLY_KEY = 'auth_only';


export const Authenticated = () => SetMetadata(AUTH_ONLY_KEY, true);
