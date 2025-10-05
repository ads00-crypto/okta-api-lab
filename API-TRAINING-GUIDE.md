# 🎯 Guía de Entrenamiento - API Middleware y Tokens JWT

## 📋 Descripción
Esta es una simulación completa para practicar autenticación y autorización con tokens JWT usando middlewares de Express.js y Okta.

## 🚀 Endpoints Disponibles

### 📖 Públicos (Sin autenticación)
- `GET /api/info` - Información del API
- `GET /api/health` - Estado del servidor
- `GET /` - Página principal
- `GET /login` - Página de login
- `GET /callback` - Página de callback
- `GET /profile` - Página de perfil

### 🔐 Autenticados (Requieren token válido)
- `GET /api/me` - Información del usuario autenticado

### 👥 Usuarios (Requieren scopes específicos)
- `GET /api/users` - Listar usuarios (scope: `user.read`)
- `GET /api/users/:id` - Obtener usuario específico (scope: `user.read`)
- `POST /api/users` - Crear usuario (scope: `user.write`)

### 🛍️ Productos (Requieren scopes específicos)
- `GET /api/products` - Listar productos (scope: `product.read`)
- `POST /api/products` - Crear producto (scope: `product.write`)

### 🔐 Administrativos (Requieren scope admin)
- `GET /api/admin/stats` - Estadísticas del sistema (scope: `admin`)
- `DELETE /api/admin/users/:id` - Eliminar usuario (scope: `admin` + role: `admin`)

## 🛡️ Middlewares Implementados

### 1. `logRequest` - Logging de Requests
```javascript
// Registra todas las peticiones con timestamp y estado de autenticación
[2025-10-05T10:30:15.123Z] GET /api/users - ✅ Con token
```

### 2. `requireAuth` - Autenticación Básica
```javascript
// Verifica que el token JWT sea válido
// Headers requeridos: Authorization: Bearer <token>
```

### 3. `requireScope(scope)` - Autorización por Scopes
```javascript
// Verifica que el token tenga el scope específico
requireScope('user.read')  // Para leer usuarios
requireScope('user.write') // Para escribir usuarios
requireScope('admin')      // Para acceso administrativo
```

### 4. `requireRole(role)` - Autorización por Roles
```javascript
// Verifica que el usuario tenga el rol específico
requireRole('admin')  // Solo administradores
```

## 🧪 Casos de Prueba para Entrenar

### ✅ Caso 1: Acceso Público
```bash
curl -X GET http://localhost:3000/api/info
# Respuesta: 200 OK (sin token requerido)
```

### ✅ Caso 2: Token Válido
```bash
curl -X GET http://localhost:3000/api/me \
  -H "Authorization: Bearer <tu-token-valido>"
# Respuesta: 200 OK con información del usuario
```

### ❌ Caso 3: Sin Token
```bash
curl -X GET http://localhost:3000/api/users
# Respuesta: 401 Unauthorized
```

### ❌ Caso 4: Token Inválido
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer token-invalido"
# Respuesta: 401 Unauthorized
```

### ❌ Caso 5: Scope Insuficiente
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer <token-con-solo-user.read>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Nuevo Usuario"}'
# Respuesta: 403 Forbidden (necesita user.write)
```

### ✅ Caso 6: Scope Correcto
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer <token-con-user.read>"
# Respuesta: 200 OK con lista de usuarios
```

## 🎓 Ejercicios de Entrenamiento

### Ejercicio 1: Middleware de Rate Limiting
Implementa un middleware que limite las peticiones por IP:
```javascript
function rateLimit(maxRequests = 10, windowMs = 60000) {
  // Tu código aquí
}
```

### Ejercicio 2: Middleware de Validación
Crea un middleware para validar datos de entrada:
```javascript
function validateUserData(req, res, next) {
  // Validar que name y email estén presentes
  // Tu código aquí
}
```

### Ejercicio 3: Middleware de Cache
Implementa un sistema de cache simple:
```javascript
function cacheResponse(ttl = 300) {
  // Tu código aquí
}
```

### Ejercicio 4: Middleware de CORS
Configura CORS para permitir solo ciertos orígenes:
```javascript
function customCors(allowedOrigins) {
  // Tu código aquí
}
```

## 🔍 Debugging y Monitoreo

### Logs del Sistema
El servidor muestra logs detallados:
```
[2025-10-05T10:30:15.123Z] GET /api/users - ✅ Con token
❌ Token inválido: jwt expired
```

### Respuestas de Error Informativas
```json
{
  "error": "Insufficient permissions",
  "requiredScope": "user.write",
  "userScopes": ["user.read"],
  "tip": "Tu token necesita el scope: user.write"
}
```

## 🛠️ Comandos Útiles

### Iniciar el servidor
```bash
npm start
# o
node server.js
```

### Probar endpoints con curl
```bash
# Obtener información del API
curl http://localhost:3000/api/info

# Probar con token (reemplaza <TOKEN> por tu token real)
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/api/me
```

## 📚 Conceptos Aprendidos

1. **Autenticación vs Autorización**
   - Autenticación: ¿Quién eres? (token válido)
   - Autorización: ¿Qué puedes hacer? (scopes y roles)

2. **Middlewares en Cadena**
   - Se ejecutan en orden secuencial
   - Cada uno puede modificar req/res o terminar la cadena

3. **JWT Claims**
   - `sub`: Subject (usuario)
   - `scp`: Scopes (permisos)
   - `exp`: Expiration time
   - `iat`: Issued at time

4. **Códigos de Estado HTTP**
   - `200`: OK
   - `201`: Created
   - `401`: Unauthorized (no autenticado)
   - `403`: Forbidden (sin permisos)
   - `404`: Not Found

¡Ahora tienes una simulación completa para practicar! 🎉