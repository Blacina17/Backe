import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Datos para cambiar la contraseña del usuario autenticado.
 *
 * El servicio verifica que `currentPassword` coincida con la contraseña
 * actual antes de aplicar el cambio. Si no coincide, responde con 401.
 */
export class ChangePasswordDto {
  /** Contraseña actual del usuario. */
  @ApiProperty({
    description: 'Contraseña actual del usuario',
    example: 'secreto123',
    maxLength: 72,
  })
  @IsString()
  @MaxLength(72)
  currentPassword!: string;

  /** Contraseña nueva. */
  @ApiProperty({
    description: 'Contraseña nueva. Se hashea antes de guardarla',
    example: 'nuevaClave456',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}