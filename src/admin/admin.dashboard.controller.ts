import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminDashboardService } from './admin.dashboard.service';
import { AdminGuard } from './admin.guard';
import type { AdminRequest } from './admin.guard';

/**
 * Endpoints del resumen del panel de administracion.
 *
 * Todas las rutas requieren un access token de administrador. El guard
 * `AdminGuard` verifica el token, el rol y que la cuenta este activa.
 */
@ApiTags('AdminDashboard')
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
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  /**
   * Devuelve el resumen general del panel.
   *
   * Incluye totales de reportes (por estado), cantidad de usuarios,
   * notificaciones sin leer y las ultimas alertas del sistema.
   *
   * @param request - Peticion con el `adminId` inyectado por el guard.
   * @returns El resumen completo del panel.
   */
  @Get()
  @ApiOperation({
    summary: 'Resumen del panel de administracion',
    description:
      'Devuelve totales de reportes por estado, cantidad de usuarios, ' +
      'notificaciones sin leer y las ultimas alertas del sistema.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen general del panel',
    schema: {
      example: {
        admin: {
          name: 'Administrador',
          email: 'admin@netshield.com',
        },
        totals: {
          reports: 42,
          pending: 5,
          approved: 30,
          rejected: 7,
          users: 128,
        },
        unreadNotifications: 3,
        byMonth: [
          { month: '2026-09', total: 15 },
          { month: '2026-10', total: 27 },
        ],
        byCategory: [
          { name: 'Bancos', total: 18 },
          { name: 'Compra en linea', total: 12 },
        ],
        recent: [
          {
            id: '42',
            url: 'sitio-sospechoso.com',
            category: 'Bancos',
            status: 'pending',
            date: '2026-10-09',
          },
        ],
      },
    },
  })
  getDashboard(@Req() request: AdminRequest) {
    return this.dashboard.getDashboard(request.adminId);
  }
}