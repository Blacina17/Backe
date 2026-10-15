import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Payload para aprobar o rechazar un reporte.
 *
 * El estado `approved` marca el reporte como resuelto. El estado
 * `rejected` exige el campo `observations`: es la justificacion que
 * queda registrada en la base de datos y nunca se muestra al usuario
 * de la app.
 */
export class ReportStatusDto {
  /** Nuevo estado del reporte. */
  @ApiProperty({
    description: 'Nuevo estado del reporte',
    enum: ['approved', 'rejected'],
    example: 'approved',
  })
  @IsIn(['approved', 'rejected'])
  status!: 'approved' | 'rejected';

  /** Nota interna del administrador. */
  @ApiPropertyOptional({
    description: 'Nota interna del admin. Obligatoria al desaprobar. Nunca se muestra al usuario de la app',
    example: 'Sitio confirmado como fraudulento',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observations?: string;
}