import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from '../auth/dto/login.dto';
import { AdminAuthService } from './admin.auth.service';
import { AdminRegisterDto } from './dto/admin.register.dto';

/**
 * Endpoints de autenticacion del panel de administracion.
 *
 * Todas las rutas son publicas: no requieren token porque son las que
 * lo emiten. El registro exige un codigo de invitacion vigente o, si
 * todavia no existe ningun admin, el codigo de arranque definido en
 * `ADMIN_BOOTSTRAP_CODE`.
 */
@ApiTags('AdminAuth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  /**
   * Registra un administrador con un codigo de invitacion.
   *
   * @param data - Nombre, correo, contrasena y codigo de invitacion.
   * @returns Un mensaje de exito y los datos basicos del admin creado.
   */
  @Post('register')
  @ApiOperation({
    summary: 'Registrar administrador con codigo de invitacion',
    description:
      'Crea una cuenta con rol "admin". El codigo de invitacion se valida contra ' +
      'la tabla `codigo_invitacion` o contra el codigo de arranque del `.env`. ' +
      'El proceso es transaccional: si algo falla, se revierte todo y el codigo ' +
      'queda disponible.',
  })
  @ApiResponse({
    status: 201,
    description: 'Administrador creado',
    schema: {
      example: {
        message: 'Administrador registrado correctamente',
        admin: {
          id: 2,
          name: 'Ximena Camacho',
          email: 'admin@netshield.com',
          role: 'admin',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos invalidos o no existe el rol de administrador en la base de datos',
  })
  @ApiResponse({
    status: 401,
    description: 'Codigo de invitacion invalido, expirado o ya usado',
  })
  @ApiResponse({
    status: 409,
    description: 'El correo ya esta registrado',
  })
  async register(@Body() data: AdminRegisterDto) {
    return this.adminAuthService.registerAdmin(data);
  }

  /**
   * Inicia sesion como administrador.
   *
   * @param data - Correo y contrasena del administrador.
   * @returns Un access token de 15 minutos y un refresh token de 7 dias.
   */
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Iniciar sesion como administrador',
    description:
      'Valida las credenciales y comprueba que el usuario tenga rol "admin". ' +
      'Si el usuario existe pero es de tipo "usuario", la peticion se rechaza ' +
      'con 401 aunque la contrasena sea correcta.',
  })
  @ApiResponse({
    status: 200,
    description: 'Devuelve accessToken y refreshToken',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIuLi4ifQ.firma',
        refreshToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIuLi4ifQ.firma',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales invalidas o la cuenta no tiene rol de administrador',
  })
  @ApiResponse({
    status: 403,
    description: 'La cuenta esta desactivada. Contacta al administrador',
  })
  async login(@Body() data: LoginDto) {
    return this.adminAuthService.loginAdmin(data);
  }
}