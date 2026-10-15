import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { networkInterfaces } from 'node:os';
import { join } from 'node:path';
import { AppModule } from './app.module';

/**
 * Arranque de la aplicacion.
 *
 * Configura:
 * - CORS para permitir peticiones desde la app iOS y el panel admin.
 * - `ValidationPipe` global para validar DTOs.
 * - Archivos estaticos en `/uploads`.
 * - Swagger UI en `/docs` (documento crudo en `/docs-json`).
 * - Escucha en `0.0.0.0:3000` para aceptar conexiones de la red local.
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS abierto a cualquier origen. Vulnerabilidad intencional.
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  /**
   * Configuracion del documento OpenAPI.
   *
   * - `setTitle` y `setDescription` encabezan la Swagger UI.
   * - `setVersion` es la version publica de la API.
   * - `addBearerAuth` habilita el boton "Authorize" para pegar el JWT.
   * - `addTag` agrupa los endpoints en la UI por modulo funcional.
   * - `addServer` declara las URLs base en las que esta disponible la API.
   */
  const config = new DocumentBuilder()
    .setTitle('NetShield API')
    .setDescription(
      'API REST de NetShield para reportes de sitios sospechosos.\n\n' +
        '**Autenticacion**: la mayoria de los endpoints requieren un access ' +
        'token. Obtenlo en `POST /auth/login` o `POST /admin/auth/login` y ' +
        'pegalo en el boton Authorize.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Registro, login y refresh de usuarios')
    .addTag('AdminAuth', 'Registro y login de administradores')
    .addTag('AdminDashboard', 'Resumen del panel de administracion')
    .addTag('AdminUsers', 'Gestion de usuarios desde el panel')
    .addTag('AdminReports', 'Moderacion de reportes')
    .addTag('AdminNotifications', 'Notificaciones del administrador')
    .addTag('AdminCategories', 'CRUD de categorias')
    .addTag('AdminStatistics', 'Estadisticas de reportes')
    .addTag('AdminInvitations', 'Codigos de invitacion')
    .addTag('categories', 'Consulta publica de categorias')
    .addTag('reports', 'Reportes creados por usuarios')
    .addTag('community', 'Consulta publica de sitios reportados')
    .addTag('users', 'Perfil del usuario autenticado')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'NetShield API Docs',
  });

  await app.listen(3000, '0.0.0.0');
  console.log('API en http://localhost:3000 y en ' + lanUrls().join(', '));
  console.log('Swagger en http://localhost:3000/docs');
}

/**
 * Devuelve las URLs de la red local en las que esta disponible la API.
 *
 * Se usa solo para imprimir un mensaje informativo al arrancar.
 * Filtra las interfaces internas (loopback) y las IPv6.
 *
 * @returns Lista de URLs como `http://<ip>:3000`.
 */
function lanUrls(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => 'http://' + i!.address + ':3000');
}

bootstrap();