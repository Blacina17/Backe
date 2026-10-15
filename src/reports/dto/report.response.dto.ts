import { ApiProperty } from '@nestjs/swagger';

/**
 * Representacion publica de un reporte.
 *
 * Es lo que el endpoint devuelve al cliente. Incluye la URL del sitio,
 * la categoria, el estado y las URLs publicas de las evidencias.
 */
export class ReportResponseDto {
  /** Identificador del reporte. */
  @ApiProperty({
    description: 'Identificador unico del reporte',
    example: 1,
  })
  id!: number;

  /** URL normalizada del sitio reportado. */
  @ApiProperty({
    description: 'URL normalizada del sitio reportado',
    example: 'sitio-sospechoso.com',
  })
  url!: string;

  /** Categoria del reporte. */
  @ApiProperty({
    description: 'Categoria del reporte',
    example: 'Bancos',
  })
  category!: string;

  /** Estado actual del reporte. */
  @ApiProperty({
    description: 'Estado actual del reporte',
    enum: ['En revision', 'Aprobado', 'Desaprobado'],
    example: 'En revision',
  })
  status!: string;

  /** Descripcion del incidente. */
  @ApiProperty({
    description: 'Descripcion del incidente',
    example: 'El sitio solicita datos bancarios.',
  })
  description!: string;

  /** Fecha de creacion en formato ISO 8601. */
  @ApiProperty({
    description: 'Fecha de creacion en formato ISO 8601',
    example: '2026-10-06T14:30:00.000Z',
  })
  createdAt!: string;

  /** URLs publicas de las evidencias. */
  @ApiProperty({
    description: 'URLs publicas de las evidencias',
    type: [String],
    example: ['/uploads/evidence/ab12.jpg'],
  })
  evidenceUrls!: string[];
}