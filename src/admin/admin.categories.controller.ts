import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminCategoriesService } from './admin.categories.service';
import { AdminGuard } from './admin.guard';
import { CategoryDto } from './dto/category.dto';

/**
 * Endpoints publicos de categorias.
 *
 * No requieren autenticacion: la app iOS los usa para poblar el
 * formulario de creacion de reportes.
 */
@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: AdminCategoriesService) {}

  /**
   * Lista todas las categorias disponibles.
   *
   * @returns Lista de categorias ordenada por nombre.
   */
  @Get()
  @ApiOperation({
    summary: 'Consultar las categorias disponibles',
    description: 'Devuelve todas las categorias ordenadas alfabeticamente. No requiere token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorias ordenada por nombre',
    schema: {
      example: [
        { id: 1, name: 'Bancos' },
        { id: 4, name: 'Compra en linea' },
        { id: 5, name: 'Escuela' },
        { id: 6, name: 'Red social' },
        { id: 2, name: 'Servicios de paqueteria' },
      ],
    },
  })
  list() {
    return this.categories.list();
  }
}

/**
 * Endpoints de gestion de categorias desde el panel de administracion.
 *
 * Los administradores pueden crear, actualizar y eliminar categorias.
 * Todas las rutas requieren token de administrador.
 */
@ApiTags('AdminCategories')
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
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly categories: AdminCategoriesService) {}

  /**
   * Crea una categoria nueva.
   *
   * @param body - Nombre de la categoria.
   * @returns La categoria creada.
   */
  @Post()
  @ApiOperation({
    summary: 'Crear una categoria',
    description: 'Crea una categoria nueva. El nombre debe ser unico en el sistema.',
  })
  @ApiResponse({
    status: 201,
    description: 'Categoria creada',
    schema: {
      example: {
        id: 7,
        name: 'Phishing',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'El nombre esta vacio o supera los 100 caracteres',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una categoria con ese nombre',
  })
  create(@Body() body: CategoryDto) {
    return this.categories.create(body.name);
  }

  /**
   * Actualiza el nombre de una categoria.
   *
   * @param id - Identificador de la categoria.
   * @param body - Nuevo nombre.
   * @returns La categoria actualizada.
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar el nombre de una categoria',
    description:
      'Cambia el nombre de la categoria. Los reportes que la usan siguen ' +
      'apuntando al mismo id, asi que conservan la relacion.',
  })
  @ApiResponse({
    status: 200,
    description: 'Categoria actualizada',
    schema: {
      example: {
        id: 7,
        name: 'Phishing y estafas',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'El nombre esta vacio o supera los 100 caracteres',
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria no encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe otra categoria con ese nombre',
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: CategoryDto) {
    return this.categories.update(id, body.name);
  }

  /**
   * Elimina una categoria.
   *
   * @param id - Identificador de la categoria.
   * @returns La categoria eliminada.
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar una categoria',
    description:
      'Borra la categoria. Si hay reportes asociados, la operacion se rechaza ' +
      'con 409 para no dejar reportes huerfanos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Categoria eliminada',
    schema: {
      example: {
        id: 7,
        deleted: true,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria no encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Hay reportes que usan esta categoria',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categories.remove(id);
  }
}