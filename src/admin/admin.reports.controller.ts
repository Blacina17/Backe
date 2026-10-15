import { Body, Controller, Get, Param, ParseIntPipe, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from './admin.guard';
import type { AdminRequest } from './admin.guard';
import { AdminReportsService } from './admin.reports.service';
import { ReportStatusDto } from './dto/report.status.dto';

/**
 * Endpoints de moderacion de reportes.
 *
 * Los administradores pueden listar todos los reportes, ver el detalle
 * con evidencias y reportes relacionados, y aprobar o rechazar cada
 * uno. Todas las rutas requieren token de administrador.
 */
@ApiTags('AdminReports')
@ApiBearerAuth()
@ApiResponse({
  status: 401,
  description: 'Falta el token, es invalido o expiro',
})
@ApiResponse({
  status: 403,
  description: 'La cuenta no es administrador o esta desactivada',
})
@UseGuards(AdminGuard)
@Controller('admin/reports')
export class AdminReportsController {
  constructor(private readonly reports: AdminReportsService) {}

  /**
   * Lista todos los reportes del sistema.
   *
   * @returns Lista de reportes ordenada del mas reciente al mas antiguo.
   */
  @Get()
  @ApiOperation({
    summary: 'Listar todos los reportes',
    description: 'Devuelve hasta 1000 reportes ordenados por fecha descendente.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de reportes, del mas reciente al mas antiguo',
    schema: {
      example: [
        {
          id: 42,
          url: 'sitio-sospechoso.com',
          category: 'Bancos',
          user: 'Ana Lopez',
          status: 'pending',
          date: '2026-10-09',
        },
      ],
    },
  })
  list() {
    return this.reports.list();
  }

  /**
   * Devuelve el detalle de un reporte con sus evidencias y reportes relacionados.
   *
   * @param id - Identificador del reporte.
   * @returns El detalle completo del reporte.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Detalle de un reporte con evidencias y reportes del mismo sitio',
    description:
      'Devuelve el reporte, sus evidencias y otros reportes del mismo sitio. ' +
      'Los reportes relacionados ayudan al admin a decidir si aprobar o rechazar.',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle del reporte',
    schema: {
      example: {
        id: 42,
        url: 'sitio-sospechoso.com',
        category: 'Bancos',
        user: 'Ana Lopez',
        status: 'pending',
        description: 'Solicita datos bancarios por correo.',
        observations: '',
        date: '2026-10-09',
        evidence: [
          { id: 1, url: '/uploads/evidence/ab12.jpg' },
        ],
        related: [
          { id: 40, user: 'Flor', status: 'approved', date: '2026-10-08' },
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Reporte no encontrado',
  })
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.reports.detail(id);
  }

  /**
   * Aprueba o rechaza un reporte.
   *
   * @param id - Identificador del reporte.
   * @param body - Nuevo estado y observaciones.
   * @param request - Peticion con el `adminId` inyectado por el guard.
   * @returns El id del reporte y el nuevo estado.
   */
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Aprobar o rechazar un reporte',
    description:
      'Cambia el estado del reporte a `approved` o `rejected`. Al rechazar, ' +
      'el campo `observations` es obligatorio: es la justificacion interna que ' +
      'queda registrada en la base de datos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado',
    schema: {
      example: {
        id: 42,
        status: 'approved',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Falta la observacion al rechazar, o el estado no existe en la base de datos',
  })
  @ApiResponse({
    status: 404,
    description: 'Reporte no encontrado',
  })
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ReportStatusDto,
    @Req() request: AdminRequest,
  ) {
    return this.reports.setStatus(id, request.adminId, body.status, body.observations);
  }
}