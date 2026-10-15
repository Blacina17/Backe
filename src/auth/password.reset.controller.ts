import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ForgotPasswordDto } from './dto/forgot.password.dto';
import { ResetPasswordDto } from './dto/reset.password.dto';
import { PasswordResetService } from './password.reset.service';

/**
 * Endpoints publicos (sin token) para que un usuario recupere su
 * contrasena cuando la olvida. Limitados por ThrottlerGuard para
 * frenar fuerza bruta y abuso de envio de correos.
 */
@ApiTags('auth')
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class PasswordResetController {
  constructor(private readonly reset: PasswordResetService) {}

  /** Paso 1: el usuario pide que le enviemos un codigo por correo. */
  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Solicitar un código de recuperación de contraseña por correo' })
  @ApiResponse({ status: 200, description: 'Siempre devuelve el mismo mensaje, exista o no el correo' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos' })
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.reset.request(dto.email);
  }

  /** Paso 2: el usuario envia el codigo recibido junto con la contrasena nueva. */
  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Cambiar la contraseña con el código recibido por correo' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada' })
  @ApiResponse({ status: 400, description: 'Código inválido, expirado o bloqueado' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos' })
  doReset(@Body() dto: ResetPasswordDto) {
    return this.reset.reset(dto.email, dto.code, dto.newPassword);
  }
}