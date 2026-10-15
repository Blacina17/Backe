import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot.password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset.password.dto';

/**
 * Endpoints de autenticacion de usuarios finales.
 *
 * Todas las rutas son publicas: no requieren token porque son las que
 * lo emiten. El servicio valida credenciales, distingue el rol del
 * usuario y emite access y refresh tokens firmados con HMAC.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  /**
   * Registra un usuario nuevo.
   *
   * @param dto - Nombre, correo, contrasena y pais del usuario.
   * @returns El id y correo del usuario creado.
   */
  @Post('register')
  @ApiOperation({
    summary: 'Registrar un usuario',
    description:
      'Crea una cuenta con rol "usuario". El correo debe ser unico en el sistema. ' +
      'El pais se resuelve contra la tabla de paises; si no existe, se guarda tal cual.',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado',
    schema: {
      example: {
        id: 1,
        email: 'ximena@example.com',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos invalidos (nombre corto, correo mal formado, contrasena corta, pais invalido)',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un usuario con ese correo',
  })
  register(@Body() dto: RegisterDto) {
    return this.service.register(dto);
  }

  /**
   * Inicia sesion con correo y contrasena.
   *
   * @param dto - Credenciales del usuario.
   * @returns Un access token de 15 minutos y un refresh token de 7 dias.
   */
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Entrar: email + password, regresa tokens',
    description:
      'Valida las credenciales y emite un par de tokens. El access token vive ' +
      '15 minutos y se usa en el header `Authorization: Bearer <token>`. El ' +
      'refresh token vive 7 dias y sirve solo para renovar el access.',
  })
  @ApiResponse({
    status: 200,
    description: 'accessToken vive 15 min; refreshToken, 7 dias',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIuLi4ifQ.firma',
        refreshToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIuLi4ifQ.firma',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales invalidas',
  })
  @ApiResponse({
    status: 403,
    description: 'La cuenta esta desactivada. Contacta al administrador',
  })
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  /**
   * Renueva el access token a partir del refresh token.
   *
   * @param dto - El refresh token emitido en el login.
   * @returns Un access token nuevo.
   */
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Access token nuevo a partir del refresh token',
    description:
      'Valida el refresh token y emite un access token nuevo. La cuenta se ' +
      'vuelve a consultar en la base de datos: si fue desactivada o eliminada ' +
      'despues del login, el refresh se rechaza.',
  })
  @ApiResponse({
    status: 200,
    description: 'Access token renovado',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIuLi4ifQ.firma',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token invalido, expirado o de tipo incorrecto',
  })
  refresh(@Body() dto: RefreshDto) {
    return this.service.refresh(dto);
  }

  /**
   * Solicita un codigo de recuperacion de contrasena.
   *
   * @param dto - Correo de la cuenta.
   * @returns Un mensaje generico (exista o no el correo).
   */
  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Solicitar codigo de recuperacion de contrasena',
    description:
      'Genera un codigo de 6 digitos valido por 15 minutos y lo guarda ' +
      'hasheado en la base de datos. En desarrollo, el codigo se imprime ' +
      'en la consola del servidor. En produccion, se enviaria por email. ' +
      'La respuesta es siempre 200, exista o no el correo, para no revelar ' +
      'cuentas registradas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Mensaje generico (exista o no el correo)',
    schema: {
      example: {
        message: 'Si el correo existe, recibiras un codigo de recuperacion',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Correo mal formado',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.service.forgotPassword(dto);
  }

  /**
   * Restablece la contrasena con un codigo valido.
   *
   * @param dto - Correo, codigo y contrasena nueva.
   * @returns Un mensaje de exito.
   */
  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Restablecer contrasena con codigo',
    description:
      'Valida el codigo de recuperacion y actualiza la contrasena. El codigo ' +
      'debe existir, no estar usado y no haber expirado (15 minutos). Es de ' +
      'un solo uso: se marca como usado tras la primera llamada exitosa.',
  })
  @ApiResponse({
    status: 200,
    description: 'Contrasena actualizada',
    schema: {
      example: {
        message: 'Contraseña actualizada correctamente',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Codigo invalido, expirado o ya usado, o contrasena nueva invalida',
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.service.resetPassword(dto);
  }
}