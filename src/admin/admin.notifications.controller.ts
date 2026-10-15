import { Controller, Get, Param, ParseIntPipe, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from './admin.guard';
import type { AdminRequest } from './admin.guard';
import { AdminNotificationsService } from './admin.notifications.service';

/**
 * Endpoints de notificaciones del administrador.
 *
 * Cada admin recibe una notificacion por cada reporte creado. El
 * endpoint de listar devuelve solo las notificaciones del admin
 * autenticado, y el de marcar como leida cambia el estado para que
 * deje de aparecer como pendiente.
 */
@ApiTags('AdminNotifications')
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
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly notifications: AdminNotificationsService) {}

  /**
   * Lista las notificaciones del administrador autenticado.
   *
   * @param request - Peticion con el `adminId` inyectado por el guard.
   * @returns Lista de notificaciones ordenadas por fecha descendente.
   */
  @Get()
  @ApiOperation({
    summary: 'Notificaciones del administrador autenticado',
    description:
      'Devuelve hasta 100 notificaciones del admin que hace la peticion, ' +
      'ordenadas de la mas reciente a la mas antigua. Cada notificacion ' +
      'incluye el mensaje, la fecha y si fue leida.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de notificaciones, las mas recientes primero',
    schema: {
      example: [
        {
          id: 1,
          message: 'Nuevo reporte #42 sobre sitio-sospechoso.com',
          date: '2026-10-09',
          read: false,
        },
        {
          id: 2,
          message: 'Nuevo reporte #41 sobre banco-falso.com',
          date: '2026-10-08',
          read: true,
        },
      ],
    },
  })
  list(@Req() request: AdminRequest) {
    return this.notifications.list(request.adminId);
  }

  /**
   * Marca una notificacion como leida.
   *
   * @param id - Identificador de la notificacion.
   * @param request - Peticion con el `adminId` inyectado por el guard.
   * @returns El id de la notificacion y su nuevo estado.
   */
  @Patch(':id/read')
  @ApiOperation({
    summary: 'Marcar una notificacion como leida',
    description:
      'Cambia el estado de la notificacion a "leida". Solo el admin dueno ' +
      'de la notificacion puede marcarla: si el id pertenece a otro admin, ' +
      'la operacion falla con 404.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificacion marcada como leida',
    schema: {
      example: {
        id: 1,
        read: true,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Notificacion no encontrada o no pertenece al admin autenticado',
  })
  markAsRead(@Param('id', ParseIntPipe) id: number, @Req() request: AdminRequest) {
    return this.notifications.markAsRead(id, request.adminId);
  }
}