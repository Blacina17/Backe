import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

/**
 * Solicitud de recuperacion de contrasena.
 *
 * El servicio responde siempre el mismo mensaje genérico, exista o no
 * el correo, para evitar enumeración de cuentas registradas.
 */
export class ForgotPasswordDto {
  /** Correo con el que el usuario se registro en la app. */
  @ApiProperty({
    description: 'Correo electronico con el que el usuario se registro',
    example: 'ximena@example.com',
    format: 'email',
    maxLength: 150,
  })
  @IsEmail()
  @MaxLength(150)
  email!: string;
}