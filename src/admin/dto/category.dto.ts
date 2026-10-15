import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Datos para crear o actualizar una categoria.
 *
 * El nombre debe ser unico en la tabla `subcategoria`. El servicio
 * rechaza duplicados con 409.
 */
export class CategoryDto {
  /** Nombre de la categoria. */
  @ApiProperty({
    description: 'Nombre de la categoria. Debe ser unico en el sistema',
    example: 'Phishing',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}