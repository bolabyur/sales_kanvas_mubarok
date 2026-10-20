import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import { ResponseMessage } from "../common/decorators/response-message.decorator";
import { Authenticated } from "../common/decorators/authenticated.decorator";
import { PermissionsGuard } from "../common/guards/permission.guard";
import { AuthenticatedUser } from "../common/interfaces/authenticated-user.interface";
import { AUTH } from "./auth.constants";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(AUTH.LOGIN_SUCCESSFUL)
  async login(@Body() dto: LoginDto) {
    const { user, accessToken, refreshToken } =
      await this.authService.login(dto);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: toSafeUser(user),
    };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(AUTH.TOKEN_REFRESHED)
  async refresh(@Body() dto: RefreshDto) {
    const { accessToken, refreshToken } = await this.authService.refreshToken(
      dto.refresh_token,
    );

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Authenticated()
  @ResponseMessage(AUTH.LOGOUT_SUCCESSFUL)
  async logout(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.logout(user.id);
    return null;
  }

  @Get("me")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Authenticated()
  me(@CurrentUser() user: AuthenticatedUser) {
    return toSafeUser(user);
  }
}

/** Map objek user exclude sensitive data */
function toSafeUser(user: AuthenticatedUser) {
  const { password, refresh_token, role, ...safe } = user;
  return {
    ...safe,
    role: { id: role.id, name: role.name },
    permissions: role.permissionRoles.map((pr) => ({
      id: pr.permission.id,
      name: pr.permission.name,
    })),
  };
}
