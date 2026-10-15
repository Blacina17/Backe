# NetShield — API

API REST de NetShield, una plataforma para reportar sitios sospechosos y
consultar alertas de la comunidad. Cada usuario se registra, entra con
correo y contrasena, y administra sus reportes con un token JWT. Los
administradores moderan los reportes y gestionan usuarios, categorias y
estadisticas desde un panel separado.

Proyecto del curso **Seguridad informatica** (TC2007B, Ago–Dic 2026).
Se construye por sesiones; cada sesion es una rama `sesion-NN-tema` que
se integra a `main` por pull request.

---

## Requisitos

- Node.js 20 o superior
- MySQL 8 corriendo en `localhost:3306`
- npm o yarn

## Como correr

```bash
# 1. Instalar dependencias
npm install

# 2. Crear la base de datos e importar el schema
mysql -u root -p < db/schema.sql

# 3. Configurar variables de entorno (ver seccion "Configuracion")
cp .env.example .env
# editar .env con los valores reales

# 4. Arrancar en modo desarrollo
npm run start:dev