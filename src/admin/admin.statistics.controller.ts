import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from './admin.guard';
import { AdminStatisticsService } from './admin.statistics.service';
import { StatsQueryDto } from './dto/stats.query.dto';

/**
 * Endpoints de estadisticas de reportes.
 *
 * Los administradores pueden consultar totales por categoria, estado,
 * mes y sitio, con filtros opcionales por fecha, categoria y pais.
 * Todas las rutas requieren token de administrador.
 */
@ApiTags('AdminStatistics')
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
@Controller('admin/statistics')
export class AdminStatisticsController {
  constructor(private readonly statistics: AdminStatisticsService) {}

  /**
   * Devuelve el resumen completo de estadisticas.
   *
   * @param query - Filtros opcionales (fechas, categoria, pais).
   * @returns Totales, categorias, estados, tendencia por mes y sitios top.
   */
  @Get()
  @ApiOperation({
    summary: 'Estadisticas generales',
    description:
      'Devuelve un resumen completo: total de reportes, desglose por categoria, ' +
      'por estado, por mes y los sitios mas reportados. Todos los filtros son ' +
      'opcionales.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen con filtros opcionales',
    schema: {
      example: {
        total: 42,
        byCategory: [
          { name: 'Bancos', total: 18 },
          { name: 'Compra en linea', total: 12 },
        ],
        byStatus: [
          { key: 'pending', name: 'Pendientes', total: 5 },
          { key: 'approved', name: 'Aprobados', total: 30 },
          { key: 'rejected', name: 'Desaprobados', total: 7 },
        ],
        byMonth: [
          { month: '2026-09', total: 15 },
          { month: '2026-10', total: 27 },
        ],
        bySite: [
          {
            url: 'sitio-sospechoso.com',
            total: 8,
            users: 5,
            categories: 'Bancos, Compra en linea',
            lastReport: '2026-10-09',
          },
        ],
        countries: ['Mexico', 'Brasil'],
      },
    },
  })
  overview(@Query() query: StatsQueryDto) {
    return this.statistics.overview(query.from, query.to, query.category, query.country);
  }

  /**
   * Devuelve el total de reportes agrupados por categoria.
   *
   * @param query - Filtros opcionales.
   * @returns Lista de categorias con su total.
   */
  @Get('categories')
  @ApiOperation({
    summary: 'Total de reportes por categoria',
    description: 'Devuelve cada categoria con el numero de reportes asociados.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorias con su total',
    schema: {
      example: [
        { name: 'Bancos', total: 18 },
        { name: 'Compra en linea', total: 12 },
        { name: 'Escuela', total: 5 },
      ],
    },
  })
  categories(@Query() query: StatsQueryDto) {
    return this.statistics.byCategory(query.from, query.to, query.country);
  }

  /**
   * Devuelve el total de reportes agrupados por estado.
   *
   * @param query - Filtros opcionales.
   * @returns Lista con los totales de pendientes, aprobados y desaprobados.
   */
  @Get('statuses')
  @ApiOperation({
    summary: 'Totales por estado',
    description: 'Devuelve el total de reportes en cada estado: pendiente, aprobado y desaprobado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Totales por estado',
    schema: {
      example: [
        { key: 'pending', name: 'Pendientes', total: 5 },
        { key: 'approved', name: 'Aprobados', total: 30 },
        { key: 'rejected', name: 'Desaprobados', total: 7 },
      ],
    },
  })
  statuses(@Query() query: StatsQueryDto) {
    return this.statistics.byStatus(query.from, query.to, query.country);
  }

  /**
   * Devuelve la tendencia de reportes por mes.
   *
   * @param query - Filtros opcionales.
   * @returns Lista de meses con su total de reportes.
   */
  @Get('trends')
  @ApiOperation({
    summary: 'Tendencia por mes',
    description: 'Devuelve el total de reportes agrupados por mes en formato `AAAA-MM`.',
  })
  @ApiResponse({
    status: 200,
    description: 'Totales por mes',
    schema: {
      example: [
        { month: '2026-08', total: 10 },
        { month: '2026-09', total: 15 },
        { month: '2026-10', total: 27 },
      ],
    },
  })
  trends(@Query() query: StatsQueryDto) {
    return this.statistics.trends(query.from, query.to, query.country);
  }

  /**
   * Devuelve los sitios mas reportados.
   *
   * @param query - Filtros opcionales (fechas, categoria, pais).
   * @returns Lista de sitios con su total de reportes y usuarios unicos.
   */
  @Get('sites')
  @ApiOperation({
    summary: 'Sitios mas reportados',
    description:
      'Devuelve los sitios con mas reportes, incluyendo el numero de usuarios ' +
      'unicos y las categorias asociadas. Limite de 50 sitios.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sitios con su numero de reportes y categorias',
    schema: {
      example: [
        {
          url: 'sitio-sospechoso.com',
          total: 8,
          users: 5,
          categories: 'Bancos, Compra en linea',
          lastReport: '2026-10-09',
        },
      ],
    },
  })
  sites(@Query() query: StatsQueryDto) {
    return this.statistics.bySite(query.from, query.to, query.category, query.country);
  }
}