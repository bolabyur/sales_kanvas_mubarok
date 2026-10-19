import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { User } from "@prisma/client";
import { StringValue } from "ms";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { AUTH } from "./auth.constants";
import { AuthenticatedUser } from "../common/interfaces/authenticated-user.interface";

const WITH_ROLE_PERMISSIONS = {
  role: { include: { permissionRoles: { include: { permission: true } } } },
} as const;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const username = dto.username?.trim();
    const password = dto.password;

    if (!username || !password) {
      throw new UnauthorizedException(AUTH.INVALID_CREDENTIALS);
    }

    const user = await this.prisma.user.findUnique({
      where: { username },
      include: WITH_ROLE_PERMISSIONS,
    });
    if (!user) {
      throw new UnauthorizedException(AUTH.INVALID_CREDENTIALS);
    }
    if (!user.is_active) {
      throw new UnauthorizedException(AUTH.ACCOUNT_DISABLED);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(AUTH.INVALID_CREDENTIALS);
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user),
    ]);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        last_login_at: new Date(),
        refresh_token: await bcrypt.hash(refreshToken, 10),
      },
    });

    return { user, accessToken, refreshToken };
  }

  /** Verifikasi refresh token lalu rotate: token baru diterbitkan, yang lama tak bisa dipakai lagi. */
  async refreshToken(token: string) {
    let payload: { sub: number };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException(AUTH.INVALID_REFRESH_TOKEN);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: WITH_ROLE_PERMISSIONS,
    });
    if (!user || !user.refresh_token) {
      throw new UnauthorizedException(AUTH.INVALID_REFRESH_TOKEN);
    }

    const isTokenValid = await bcrypt.compare(token, user.refresh_token);
    if (!isTokenValid) {
      // token lama dipakai ulang -> kemungkinan dicuri, revoke sesi
      await this.revokeRefreshToken(user.id);
      throw new UnauthorizedException(AUTH.REFRESH_TOKEN_REUSE_DETECTED);
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user),
    ]);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refresh_token: await bcrypt.hash(refreshToken, 10) },
    });

    return { accessToken, refreshToken };
  }

  async logout(userId: number): Promise<void> {
    await this.revokeRefreshToken(userId);
  }

  /** Dipakai JwtStrategy untuk memvalidasi user dari access token. */
  async validateUser(userId: number): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: WITH_ROLE_PERMISSIONS,
    });
    if (!user || !user.is_active) {
      throw new UnauthorizedException(AUTH.USER_NOT_FOUND);
    }
    return user;
  }

  private generateAccessToken(user: User): Promise<string> {
    return this.jwtService.signAsync(
      { sub: user.id, username: user.username },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? "15m") as StringValue,
      },
    );
  }

  private generateRefreshToken(user: User): Promise<string> {
    return this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? "30d") as StringValue,
      },
    );
  }

  private async revokeRefreshToken(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refresh_token: null },
    });
  }
}
