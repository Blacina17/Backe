import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/**
 * Filtros opcionales para las estadisticas de reportes.
 *
 * Todos los campos son opcionales. Si no se envia ninguno, el servicio
 * devuelve las estadisticas completas. Las fechas se validan con el
 * formato `AAAA-MM-DD`.
 */
export class StatsQueryDto {
  /** Fecha inicial del rango. */
  @ApiPropertyOptional({
    description: 'Fecha inicial del rango (AAAA-MM-DD)',
    example: '2026-01-01',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  /** Fecha final del rango. */
  @ApiPropertyOptional({
    description: 'Fecha final del rango (AAAA-MM-DD)',
    example: '2026-12-31',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;

  /** Filtro por categoria. */
  @ApiPropertyOptional({
    description: 'Filtra los sitios por categoria',
    example: 'Bancos',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  /** Filtro por pais del usuario que reporto. */
  @ApiPropertyOptional({
    description: 'Filtra por pais del usuario que reporto',
    example: 'Mexico',
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;
}