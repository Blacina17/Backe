import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * Datos para actualizar el perfil del usuario autenticado.
 *
 * Todos los campos son opcionales. Solo se actualizan los que vienen en
 * la peticion; los demas se conservan.
 */
export class UpdateProfileDto {
  /** Nombre completo del usuario. */
  @ApiPropertyOptional({
    description: 'Nombre completo del usuario',
    example: 'Ximena Camacho',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  /** Pais del usuario. */
  @ApiPropertyOptional({
    description: 'Pais del usuario. Letras, espacios, puntos, apostrofes y guiones',
    example: 'Mexico',
    maxLength: 60,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[\p{L} .'-]{2,60}$/u, { message: 'País inválido' })
  country?: string;
}