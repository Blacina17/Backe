import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { UserGuard } from '../auth/user.guard';
import type { UserRequest } from '../auth/user.guard';
import { imageUpload } from '../uploads';
import { ChangePasswordDto } from './dto/change.password.dto';
import { UpdateProfileDto } from './dto/update.profile.dto';
import { UsersService } from './users.service';

/**
 * Endpoints del perfil del usuario autenticado.
 *
 * Todas las rutas operan sobre el usuario del token: no se puede
 * consultar ni modificar el perfil de otro usuario. Requieren token de
 * usuario (no admin).
 */
@ApiTags('users')
@ApiBearerAuth()
@ApiResponse({
  status: 401,
  description: 'Falta el token, es invalido o expiro',
})
@ApiResponse({
  status: 403,
  description: 'La cuenta esta desactivada o no es un usuario de la app',
})
@UseGuards(UserGuard, ThrottlerGuard)
@Controller('users/profile')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /**
   * Devuelve el perfil del usuario autenticado.
   *
   * @param req - Peticion con el `userId` inyectado por el guard.
   * @returns Nombre, correo, pais, foto y fecha de registro del usuario.
   */
  @Get()
  @ApiOperation({
    summary: 'Consultar mi perfil',
    description: 'Devuelve los datos del usuario autenticado: nombre, correo, pais y foto de perfil.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario',
    schema: {
      example: {
        name: 'Ximena Camacho',
        email: 'ximena@example.com',
        country: 'Mexico',
        photoUrl: '/uploads/profile/ab12.jpg',
        registeredAt: '2026-10-05',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'El usuario no existe en la base de datos',
  })
  profile(@Req() req: UserRequest) {
    return this.users.profile(req.userId);
  }

  /**
   * Actualiza el nombre o el pais del perfil.
   *
   * @param req - Peticion con el `userId` inyectado por el guard.
   * @param dto - Campos a actualizar (ambos opcionales).
   * @returns El perfil actualizado.
   */
  @Patch()
  @ApiOperation({
    summary: 'Actualizar nombre o pais',
    description:
      'Actualiza solo los campos presentes en la peticion. Si no se envia ' +
      'ninguno, la peticion se rechaza con 400.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado',
    schema: {
      example: {
        name: 'Ximena Camacho',
        email: 'ximena@example.com',
        country: 'Brasil',
        photoUrl: '/uploads/profile/ab12.jpg',
        registeredAt: '2026-10-05',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Los campos enviados no cumplen las reglas de validacion',
  })
  @ApiResponse({
    status: 404,
    description: 'El usuario no existe en la base de datos',
  })
  update(@Req() req: UserRequest, @Body() dto: UpdateProfileDto) {
    return this.users.update(req.userId, dto);
  }

  /**
   * Sube o cambia la foto de perfil.
   *
   * @param req - Peticion con el `userId` inyectado por el guard.
   * @param file - Archivo de imagen (multipart/form-data).
   * @returns El perfil actualizado con la nueva foto.
   */
  @Post('photo')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Subir o cambiar la foto de perfil',
    description:
      'Sube una imagen (JPG, PNG o WEBP, maximo 3 MB) como foto de perfil. ' +
      'Si ya existia una foto previa, se reemplaza. Limite: 10 subidas por ' +
      'minuto por usuario.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen (JPG, PNG o WEBP, maximo 3 MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Foto actualizada',
    schema: {
      example: {
        name: 'Ximena Camacho',
        email: 'ximena@example.com',
        country: 'Mexico',
        photoUrl: '/uploads/profile/cd34.jpg',
        registeredAt: '2026-10-05',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Archivo faltante, formato no permitido o tamano mayor a 3 MB',
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiadas peticiones. Espera un minuto',
  })
  @UseInterceptors(FileInterceptor('file', imageUpload('profile', 3)))
  photo(@Req() req: UserRequest, @UploadedFile() file: Express.Multer.File) {
    return this.users.setPhoto(req.userId, file);
  }

  /**
   * Cambia la contrasena del usuario.
   *
   * @param req - Peticion con el `userId` inyectado por el guard.
   * @param dto - Contrasena actual y nueva.
   * @returns Un mensaje de confirmacion.
   */
  @Patch('password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Cambiar mi contrasena',
    description:
      'Cambia la contrasena del usuario autenticado. Exige la contrasena ' +
      'actual como confirmacion. Limite: 5 intentos por minuto por usuario.',
  })
  @ApiResponse({
    status: 200,
    description: 'Contrasena actualizada',
    schema: {
      example: {
        message: 'Contrasena actualizada correctamente',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'La contrasena nueva es menor a 8 caracteres o mayor a 72',
  })
  @ApiResponse({
    status: 403,
    description: 'La contrasena actual no coincide',
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiados intentos. Espera un minuto',
  })
  password(@Req() req: UserRequest, @Body() dto: ChangePasswordDto) {
    return this.users.changePassword(req.userId, dto.currentPassword, dto.newPassword);
  }
}