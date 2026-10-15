import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { UserGuard } from '../auth/user.guard';
import { CommunityService } from './community.service';
import { CommunityQueryDto, SearchSiteDto } from './dto/community.query.dto';
import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { SiteDetailDto } from './dto/site.detail.dto';

/**
 * Endpoints publicos de la comunidad.
 *
 * Permiten buscar una URL para saber si ya fue reportada, consultar las
 * alertas activas y obtener estadisticas agregadas. Todas las rutas
 * requieren token de usuario de la app.
 */
@ApiTags('community')
@ApiBearerAuth()
@ApiResponse({
  status: 401,
  description: 'Falta el token, es invalido o expiro',
})
@ApiResponse({
  status: 403,
  description: 'La cuenta esta desactivada o no es un usuario de la app',
})
@UseGuards(UserGuard, ThrottlerGuard)
@Controller()
export class CommunityController {
  constructor(private readonly community: CommunityService) {}

  /**
   * Busca una URL y comprueba si ya fue reportada.
   *
   * @param query - URL a buscar.
   * @returns El riesgo, numero de reportes y fecha del ultimo reporte.
   */
  @Get('sites/search')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: 'Buscar una URL y comprobar si ya fue reportada',
    description:
      'Normaliza la URL y consulta la base de datos comunitaria. Devuelve el ' +
      'nivel de riesgo estimado, el numero de reportes y la fecha del ultimo. ' +
      'Limite: 30 busquedas por minuto por usuario.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado de la busqueda',
    schema: {
      example: {
        url: 'sitio-sospechoso.com',
        risk: 'high',
        reports: 8,
        approved: 6,
        lastReport: '2026-10-09',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'La URL esta vacia o supera los 2048 caracteres',
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiadas peticiones. Espera un minuto',
  })
  search(@Query() query: SearchSiteDto) {
    return this.community.search(query.url);
  }

  /**
   * Devuelve las alertas activas de la comunidad.
   *
   * @param query - Filtros opcionales (categoria, pais).
   * @returns Lista de sitios reportados, sin los rechazados.
   */
  @Get('alerts')
  @ApiOperation({
    summary: 'Alertas de la comunidad',
    description:
      'Devuelve los sitios reportados por la comunidad, excluyendo los que ' +
      'fueron rechazados por un administrador. Los filtros por categoria y ' +
      'pais son opcionales.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de alertas activas',
    schema: {
      example: [
        {
          id: 1,
          url: 'sitio-sospechoso.com',
          category: 'Bancos',
          risk: 'high',
          verified: true,
          description: 'Solicita datos bancarios por correo.',
          lastReport: '2026-10-09',
        },
      ],
    },
  })
  alerts(@Query() query: CommunityQueryDto) {
    return this.community.alerts(query.category);
  }

  /**
   * Devuelve estadisticas agregadas de reportes aprobados.
   *
   * @param query - Filtros opcionales (categoria, pais).
   * @returns Totales de sitios y reportes, por categoria y por mes.
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Estadisticas de reportes aprobados',
    description:
      'Devuelve estadisticas agregadas de los reportes aprobados, con ' +
      'filtros opcionales por categoria y pais. Es la version publica de ' +
      'las estadisticas, sin datos sensibles.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadisticas agregadas',
    schema: {
      example: {
        summary: {
          sites: 128,
          reportsThisWeek: 15,
        },
        byCategory: [
          { category: 'Bancos', total: 45 },
          { category: 'Compra en linea', total: 32 },
        ],
        byMonth: [
          { month: '2026-09', category: 'Bancos', total: 12 },
          { month: '2026-10', category: 'Bancos', total: 18 },
        ],
        countries: ['Mexico', 'Brasil'],
      },
    },
  })
  statistics(@Query() query: CommunityQueryDto) {
    return this.community.statistics(query.category, query.country);
  }

    /**
   * Devuelve el detalle de un sitio reportado.
   *
   * @param id - Identificador del sitio.
   * @returns El detalle completo con evidencias y reportes.
   */
  @Get('sites/:id')
  @ApiOperation({
    summary: 'Detalle de un sitio reportado',
    description:
      'Devuelve la informacion completa del sitio: categoria, riesgo, ' +
      'evidencias subidas y lista de reportes asociados.',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle del sitio',
    type: SiteDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Sitio no encontrado o sin reportes activos',
  })
  siteDetail(@Param('id', ParseIntPipe) id: number) {
    return this.community.siteDetail(id);
  }
}
