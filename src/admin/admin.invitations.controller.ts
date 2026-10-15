import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from './admin.guard';
import type { AdminRequest } from './admin.guard';
import { AdminInvitationsService } from './admin.invitations.service';
import { CreateInvitationDto } from './dto/create.invitation.dto';

/**
 * Endpoints para gestionar codigos de invitacion de administradores.
 *
 * Un admin autenticado puede generar codigos de un solo uso y listar
 * los existentes con su estado. El codigo en claro solo se muestra al
 * crearlo: en la base de datos se guarda hasheado con SHA-256.
 */
@ApiTags('AdminInvitations')
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
@Controller('admin/invitations')
export class AdminInvitationsController {
  constructor(private readonly invitations: AdminInvitationsService) {}

  /**
   * Genera un codigo de invitacion de un solo uso.
   *
   * @param body - Dias de vigencia del codigo (opcional, por defecto 7).
   * @param request - Peticion con el `adminId` inyectado por el guard.
   * @returns El codigo en claro (solo se muestra esta vez) y su fecha de expiracion.
   */
  @Post()
  @ApiOperation({
    summary: 'Generar un codigo de invitacion de un solo uso',
    description:
      'Crea un codigo aleatorio de 96 bits con formato `AAAAAA-BBBBBB-CCCCCC-DDDDDD`. ' +
      'El codigo en claro solo se devuelve en esta respuesta: en la base de datos ' +
      'se guarda hasheado. El nuevo administrador lo usa en `POST /admin/auth/register`.',
  })
  @ApiResponse({
    status: 201,
    description: 'Devuelve el codigo (solo se muestra esta vez) y su expiracion',
    schema: {
      example: {
        code: 'A3F5B8-C9D1E2-F3A4B5-C6D7E8',
        expiresAt: '2026-10-16',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Los dias de vigencia no estan entre 1 y 30',
  })
  create(@Body() body: CreateInvitationDto, @Req() request: AdminRequest) {
    return this.invitations.create(request.adminId, body.days);
  }

  /**
   * Lista los codigos de invitacion con su estado.
   *
   * @returns Lista de codigos con su estado (activo, usado, expirado).
   */
  @Get()
  @ApiOperation({
    summary: 'Listar codigos de invitacion y su estado',
    description:
      'Devuelve hasta 100 codigos con su estado: `active` (vigente y sin usar), ' +
      '`used` (ya fue consumido) o `expired` (paso su fecha de expiracion). ' +
      'Nunca incluye el codigo en claro.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista sin los codigos en claro',
    schema: {
      example: [
        {
          id: 1,
          status: 'active',
          createdBy: 'Administrador',
          usedBy: null,
          createdAt: '2026-10-09',
          expiresAt: '2026-10-16',
        },
        {
          id: 2,
          status: 'used',
          createdBy: 'Administrador',
          usedBy: 'Itzel',
          createdAt: '2026-10-01',
          expiresAt: '2026-10-08',
        },
        {
          id: 3,
          status: 'expired',
          createdBy: 'Administrador',
          usedBy: null,
          createdAt: '2026-09-20',
          expiresAt: '2026-09-27',
        },
      ],
    },
  })
  list() {
    return this.invitations.list();
  }
}