import { ApiProperty } from '@nestjs/swagger';

/**
 * Detalle de un sitio reportado.
 *
 * Incluye la lista completa de evidencias y los reportes asociados.
 */
export class SiteDetailDto {
  @ApiProperty({ example: 3 })
  id!: number;

  @ApiProperty({ example: 'sitio-sospechoso.com' })
  url!: string;

  @ApiProperty({ example: 'Bancos' })
  category!: string;

  @ApiProperty({ enum: ['high', 'medium', 'safe'], example: 'high' })
  risk!: string;

  @ApiProperty({ example: true })
  verified!: boolean;

  @ApiProperty({ example: 'Solicita datos bancarios por correo.' })
  description!: string;

  @ApiProperty({ example: '2026-10-09' })
  lastReport!: string;

  @ApiProperty({
    type: 'array',
    example: [
      { id: 1, url: '/uploads/evidence/ab12.jpg' },
      { id: 2, url: '/uploads/evidence/cd34.jpg' },
    ],
  })
  evidence!: { id: number; url: string }[];

  @ApiProperty({
    type: 'array',
    example: [
      { id: 42, user: 'Ana Lopez', status: 'approved', date: '2026-10-09' },
      { id: 38, user: 'Flor', status: 'approved', date: '2026-10-05' },
    ],
  })
  reports!: { id: number; user: string; status: string; date: string }[];
}