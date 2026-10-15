import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Datos para editar la descripcion de un reporte.
 *
 * Solo se puede editar mientras el reporte siga en estado `pendiente`
 * o `en_revision`. Una vez aprobado o rechazado, la edicion falla con
 * 403.
 */
export class UpdateReportDto {
  /** Nueva descripcion del reporte. */
  @ApiProperty({
    description: 'Nueva descripcion del reporte',
    example: 'Descripcion corregida',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;
}