import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * Datos para registrar un administrador.
 *
 * Todos los campos son obligatorios. El correo debe ser unico en el
 * sistema. El codigo de invitacion se valida en el servicio contra la
 * tabla `codigo_invitacion` o contra el codigo de arranque.
 */
export class AdminRegisterDto {
  /** Nombre completo del administrador. */
  @ApiProperty({
    description: 'Nombre completo del administrador',
    example: 'Ximena Camacho',
  })
  @IsString()
  name!: string;

  /** Correo electronico unico en el sistema. */
  @ApiProperty({
    description: 'Correo electronico unico en el sistema',
    example: 'admin@netshield.com',
    format: 'email',
  })
  @IsEmail()
  email!: string;

  /** Contrasena en claro. Se hashea antes de guardarla. */
  @ApiProperty({
    description: 'Contrasena del administrador. Se hashea antes de guardarla',
    example: 'Admin12345',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;

  /** Codigo de invitacion entregado por un administrador. */
  @ApiProperty({
    description: 'Codigo de invitacion entregado por un administrador existente',
    example: 'CodigoSecreto',
  })
  @IsString()
  inviteCode!: string;
}