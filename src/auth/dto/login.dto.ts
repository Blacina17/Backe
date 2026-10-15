import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

/**
 * Credenciales para iniciar sesion.
 *
 * El servicio responde siempre el mismo mensaje genérico
 * ("Credenciales inválidas") sin distinguir si el correo existe o la
 * contraseña es incorrecta, para evitar enumeración de cuentas.
 */
export class LoginDto {
  /** Correo electronico del usuario. */
  @ApiProperty({
    description: 'Correo electronico con el que se registro',
    example: 'ximena@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string | undefined;

  /** Contrasena en claro. */
  @ApiProperty({
    description: 'Contrasena del usuario',
    example: 'secreto123',
  })
  @IsString()
  password: string | undefined;
}