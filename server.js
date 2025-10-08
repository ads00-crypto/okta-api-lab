const express = require('express');
const path = require('path');
const OktaJwtVerifier = require('@okta/jwt-verifier');
const app = express();
app.get('/', (_req, res) => res.send('AUTHFLOW ONLINE ✅ ' + new Date().toISOString()));
const PORT = process.env.PORT || 3000;

// 🔹 Middleware para parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔹 Datos simulados para la práctica
const simulatedUsers = [
  { id: 1, name: 'Juan Pérez', email: 'juan@email.com', role: 'admin' },
  { id: 2, name: 'María García', email: 'maria@email.com', role: 'user' },
  { id: 3, name: 'Carlos López', email: 'carlos@email.com', role: 'user' }
];

const simulatedProducts = [
  { id: 1, name: 'Laptop Dell', price: 899.99, category: 'electronics' },
  { id: 2, name: 'Smartphone iPhone', price: 1299.99, category: 'electronics' },
  { id: 3, name: 'Silla Gaming', price: 399.99, category: 'furniture' }
];

// 🔹 Configura el verificador de tokens
const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: 'https://fernandosandbox.oktapreview.com/oauth2/ausbxl4gmakGkhLXy0x7',
  // El audience debe coincidir exactamente con el claim `aud` del access token
  audience: 'https://okta-auth0-api-lab.onrender.com/',
});

// 🔹 Middleware de logging para debugging
function logRequest(req, res, next) {
  const timestamp = new Date().toISOString();
  const authHeader = req.headers.authorization ? '✅ Con token' : '❌ Sin token';
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${authHeader}`);
  next();
}

// 🔹 Middleware de verificación general
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Missing or invalid authorization header', 
        expected: 'Authorization: Bearer <token>' 
      });
    }
    
  const token = authHeader.replace('Bearer ', '');
  // Es importante pasar la audiencia exacta que aparece en el token (incluyendo slash si aplica)
  const jwt = await oktaJwtVerifier.verifyAccessToken(token, 'https://okta-auth0-api-lab.onrender.com/');
    req.user = jwt.claims; // Guarda las claims para uso posterior
    next();
  } catch (err) {
    console.error('❌ Token inválido:', err.message);
    res.status(401).json({ 
      error: 'Invalid token', 
      message: err.message,
      tip: 'Obtén un nuevo token desde /login' 
    });
  }
}

// 🔹 Middleware para exigir un scope específico
function requireScope(requiredScope) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || '';
      if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          error: 'Missing authorization header',
          requiredScope,
          tip: 'Incluye: Authorization: Bearer <token>'
        });
      }

      const token = authHeader.replace('Bearer ', '');
      const { claims } = await oktaJwtVerifier.verifyAccessToken(token, 'https://okta-auth0-api-lab.onrender.com/');
      
      // Verificaciones adicionales
      if (claims.tok_typ && claims.tok_typ !== 'Bearer') {
        return res.status(401).json({ error: 'Wrong token type', expected: 'Bearer' });
      }
      
      if (!claims.scp?.includes(requiredScope)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions', 
          requiredScope,
          userScopes: claims.scp || [],
          tip: `Tu token necesita el scope: ${requiredScope}`
        });
      }
      
      req.user = claims; // Pasa claims a los controladores
      next();
    } catch (e) { 
      return res.status(401).json({ 
        error: 'Token verification failed', 
        message: e.message 
      }); 
    }
  };
}

// 🔹 Middleware para verificar grupos de Okta (SEGURIDAD AVANZADA)
// Normaliza diferentes formatos de claims de grupos en el token
function normalizeGroupsFromClaims(claims) {
  if (!claims) return [];
  // Puede venir en 'groups', 'group', 'roles', 'role', etc.
  const raw = claims.groups || claims.group || claims.roles || claims.role;
  if (!raw) return [];

  let list = [];
  if (Array.isArray(raw)) {
    list = raw.map(item => {
      if (!item) return '';
      if (typeof item === 'string') return item.trim();
      // objetos posibles: { value: 'name' } o { display: 'name' }
      if (typeof item === 'object') return (item.display || item.value || item.name || '').toString().trim();
      return String(item).trim();
    }).filter(Boolean);
  } else if (typeof raw === 'string') {
    // puede ser 'group1 group2' o 'group1,group2'
    list = raw.split(/[,;|\s]+/).map(s => s.trim()).filter(Boolean);
  } else if (typeof raw === 'object') {
    // caso raro: objeto con subvalores
    if (Array.isArray(raw.values)) {
      list = raw.values.map(String).map(s => s.trim()).filter(Boolean);
    } else {
      list = Object.values(raw).map(String).map(s => s.trim()).filter(Boolean);
    }
  }

  // eliminar duplicados, normalizando a minúsculas para comparar
  const seen = new Set();
  return list.filter(s => {
    const key = s.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function requireGroup(requiredGroup) {
  return (req, res, next) => {
    const userClaims = req.user || {};
    const userGroups = normalizeGroupsFromClaims(userClaims);

    if (!Array.isArray(userGroups) || userGroups.length === 0) {
      return res.status(403).json({
        error: 'No groups found in token',
        requiredGroup,
        tip: 'El usuario debe pertenecer a un grupo específico en Okta',
        tokenClaims: Object.keys(userClaims || {}),
        normalizedGroups: userGroups
      });
    }

    const hasRequiredGroup = userGroups.some(g => g.toLowerCase() === String(requiredGroup).toLowerCase());

    if (!hasRequiredGroup) {
      return res.status(403).json({
        error: 'User not in required group',
        requiredGroup,
        userGroups,
        tip: `Usuario debe estar en el grupo: ${requiredGroup}`
      });
    }

    next();
  };
}

// 🔹 Middleware para scope + grupo (MÁXIMA SEGURIDAD)
function requireScopeAndGroup(requiredScope, requiredGroup) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || '';
      if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          error: 'Missing authorization header',
          requiredScope,
          requiredGroup
        });
      }

      const token = authHeader.replace('Bearer ', '');
      const { claims } = await oktaJwtVerifier.verifyAccessToken(token, 'https://okta-auth0-api-lab.onrender.com/');
      
      // 1. Verificar scope
      if (!claims.scp?.includes(requiredScope)) {
        return res.status(403).json({ 
          error: 'Insufficient scope permissions', 
          requiredScope,
          userScopes: claims.scp || []
        });
      }
      
      // 2. Verificar grupo (normalizamos varios formatos posibles)
      const userGroups = normalizeGroupsFromClaims(claims);
      const hasRequiredGroup = userGroups.some(g => g.toLowerCase() === String(requiredGroup).toLowerCase());

      if (!hasRequiredGroup) {
        return res.status(403).json({
          error: 'User not in required group',
          requiredGroup,
          userGroups,
          tip: 'Necesitas scope Y pertenecer al grupo específico'
        });
      }
      
      req.user = claims;
      next();
    } catch (e) { 
      return res.status(401).json({ 
        error: 'Token verification failed', 
        message: e.message 
      }); 
    }
  };
}

// 🔹 Middleware para verificar roles de usuario (LEGACY - mantenido para compatibilidad)
function requireRole(requiredRole) {
  return (req, res, next) => {
    const userRole = req.user?.role || req.user?.groups?.[0]; // Dependiendo de cómo vengan los roles
    
    if (!userRole) {
      return res.status(403).json({ 
        error: 'No role found in token',
        requiredRole,
        tip: 'El token debe incluir información de rol'
      });
    }
    
    if (userRole !== requiredRole) {
      return res.status(403).json({ 
        error: 'Insufficient role permissions',
        requiredRole,
        userRole,
        tip: `Necesitas rol: ${requiredRole}, pero tienes: ${userRole}`
      });
    }
    
    next();
  };
}

// 🔹 Aplicar middleware de logging a todas las rutas
app.use(logRequest);

// 🔹 Páginas públicas (sin autenticación)
app.get('/', (_r, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login', (_r, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/callback', (_r, res) => res.sendFile(path.join(__dirname, 'callback.html')));
app.get('/profile', (_r, res) => res.sendFile(path.join(__dirname, 'profile.html')));
app.get('/api-console', (_r,res)=>res.sendFile(path.join(__dirname,'api-console.html')));

// 🔹 Endpoint público para obtener información del API
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Okta API Lab - Simulación de Entrenamiento Mi Casa',
    version: '1.0.0',
    description: 'API para practicar autenticación y autorización con tokens JWT',
    endpoints: {
      public: ['/api/info', '/api/health'],
      authenticated: ['/api/me', '/api/users', '/api/products'],
      groupBased: ['/api/user/profile', '/api/admin/basic-info', '/api/common/info'],
      adminSecure: ['/api/admin/stats', '/api/admin/users/:id'],
      scopes: {
        'user.read': 'Leer información de usuarios',
        'user.write': 'Crear/modificar usuarios',
        'product.read': 'Leer información de productos',
        'product.write': 'Crear/modificar productos',
        'admin': 'Acceso administrativo completo'
      },
      groups: {
        'Mi casa - Admin': 'Administradores con acceso completo',
        'Mi casa - User': 'Usuarios regulares con acceso limitado'
      },
      security: {
        basic: 'Solo scope requerido',
        intermediate: 'Solo grupo requerido',
        advanced: 'Scope + grupo requerido',
        maximum: 'Scope + grupo + claims personalizados'
      }
    }
  });
});

// 🔹 Endpoint de health check (público)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 🔹 Endpoint para obtener información del usuario autenticado
app.get('/api/me', requireAuth, (req, res) => {
  res.json({
    message: '🎉 ¡Token válido! Aquí está tu información:',
    user: {
      subject: req.user.sub,
      scopes: req.user.scp || [],
      clientId: req.user.cid,
      issuedAt: new Date(req.user.iat * 1000).toISOString(),
      expiresAt: new Date(req.user.exp * 1000).toISOString()
    }
  });
});

// 🔹 Endpoints de usuarios (requieren scopes específicos)
app.get('/api/users', requireScope('user.read'), (req, res) => {
  res.json({
    message: '👀 Acceso autorizado para leer usuarios',
    scope: 'user.read',
    data: simulatedUsers,
    user: req.user.sub
  });
});

app.get('/api/users/:id', requireScope('user.read'), (req, res) => {
  const userId = parseInt(req.params.id);
  const user = simulatedUsers.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  
  res.json({
    message: `📄 Información del usuario ${userId}`,
    scope: 'user.read',
    data: user,
    requestedBy: req.user.sub
  });
});

app.post('/api/users', requireScope('user.write'), (req, res) => {
  const newUser = {
    id: simulatedUsers.length + 1,
    name: req.body.name || 'Usuario Nuevo',
    email: req.body.email || 'nuevo@email.com',
    role: req.body.role || 'user'
  };
  
  simulatedUsers.push(newUser);
  
  res.status(201).json({
    message: '✏️ Usuario creado exitosamente',
    scope: 'user.write',
    data: newUser,
    createdBy: req.user.sub
  });
});

// 🔹 Endpoints de productos (requieren scopes específicos)
app.get('/api/products', requireScope('product.read'), (req, res) => {
  res.json({
    message: '🛍️ Acceso autorizado para leer productos',
    scope: 'product.read',
    data: simulatedProducts,
    user: req.user.sub
  });
});

app.post('/api/products', requireScope('product.write'), (req, res) => {
  const newProduct = {
    id: simulatedProducts.length + 1,
    name: req.body.name || 'Producto Nuevo',
    price: req.body.price || 0,
    category: req.body.category || 'general'
  };
  
  simulatedProducts.push(newProduct);
  
  res.status(201).json({
    message: '🛒 Producto creado exitosamente',
    scope: 'product.write',
    data: newProduct,
    createdBy: req.user.sub
  });
});

// 🔹 Endpoints administrativos con MÁXIMA SEGURIDAD
// Requiere scope 'admin' Y pertenecer al grupo 'Mi casa - Admin'
app.get('/api/admin/stats', requireScopeAndGroup('admin', 'Mi casa - Admin'), (req, res) => {
  res.json({
    message: '🔐 Acceso administrativo autorizado - Scope + Grupo verificados',
    scope: 'admin',
    requiredGroup: 'Mi casa - Admin',
    userGroups: req.user.groups || [],
    stats: {
      totalUsers: simulatedUsers.length,
      totalProducts: simulatedProducts.length,
      serverUptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    },
    admin: req.user.sub
  });
});

// 🔹 Endpoint crítico con triple verificación: Scope + Grupo + Claim personalizado
app.delete('/api/admin/users/:id', 
  requireScopeAndGroup('admin', 'Mi casa - Admin'),
  (req, res, next) => {
    // Verificación adicional: usuario debe tener claim específico
    const canDelete = req.user?.['custom:canDeleteUsers'] === 'true';
    if (!canDelete) {
      return res.status(403).json({
        error: 'Missing delete permission',
        tip: 'Usuario necesita el claim custom:canDeleteUsers = true',
        userClaims: req.user
      });
    }
    next();
  },
  (req, res) => {
    const userId = parseInt(req.params.id);
    const userIndex = simulatedUsers.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const deletedUser = simulatedUsers.splice(userIndex, 1)[0];
    
    res.json({
      message: '🗑️ Usuario eliminado exitosamente - Triple verificación pasada',
      security: {
        scope: 'admin',
        group: 'Mi casa - Admin', 
        customClaim: 'canDeleteUsers'
      },
      data: deletedUser,
      deletedBy: req.user.sub
    });
  }
);

// 🔹 Endpoint alternativo solo con grupo admin (sin scope admin)
app.get('/api/admin/basic-info', requireGroup('Mi casa - Admin'), (req, res) => {
  res.json({
    message: '📊 Información básica - Solo verificación de grupo Admin',
    requiredGroup: 'Mi casa - Admin',
    userGroups: req.user.groups || [],
    basicStats: {
      totalUsers: simulatedUsers.length,
      totalProducts: simulatedProducts.length
    },
    user: req.user.sub
  });
});

// 🔹 Endpoint para usuarios regulares (grupo User)
app.get('/api/user/profile', requireGroup('Mi casa - User'), (req, res) => {
  res.json({
    message: '👤 Perfil de usuario - Solo verificación de grupo User',
    requiredGroup: 'Mi casa - User',
    userGroups: req.user.groups || [],
    profile: {
      subject: req.user.sub,
      scopes: req.user.scp || [],
      groups: req.user.groups || [],
      clientId: req.user.cid
    },
    user: req.user.sub
  });
});

// 🔹 Endpoint que permite ambos grupos
app.get('/api/common/info', (req, res, next) => {
  // Middleware personalizado para verificar si está en cualquiera de los dos grupos
  const userGroups = req.user?.groups || [];
  const hasValidGroup = userGroups.some(group => 
    group === 'Mi casa - Admin' || group === 'Mi casa - User'
  );
  
  if (!hasValidGroup) {
    return res.status(403).json({
      error: 'User not in valid group',
      requiredGroups: ['Mi casa - Admin', 'Mi casa - User'],
      userGroups,
      tip: 'Usuario debe estar en grupo Admin o User'
    });
  }
  
  next();
}, requireAuth, (req, res) => {
  const userGroups = req.user.groups || [];
  const isAdmin = userGroups.includes('Mi casa - Admin');
  
  res.json({
    message: '🏠 Información común - Acceso para usuarios de Mi casa',
    userType: isAdmin ? 'Administrador' : 'Usuario regular',
    validGroups: ['Mi casa - Admin', 'Mi casa - User'],
    userGroups,
    data: {
      totalUsers: simulatedUsers.length,
      totalProducts: simulatedProducts.length,
      // Solo admins ven información sensible
      ...(isAdmin && {
        serverUptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      })
    },
    user: req.user.sub
  });
});

// 🔹 Endpoint legacy mantenido para compatibilidad
app.get('/api/admin/legacy', requireScope('admin'), (req, res) => {
  res.json({
    message: '⚠️ Endpoint legacy - Solo verificación de scope (menos seguro)',
    scope: 'admin',
    warning: 'Considera migrar a endpoints con verificación de grupos',
    stats: {
      totalUsers: simulatedUsers.length,
      totalProducts: simulatedProducts.length
    },
    admin: req.user.sub
  });
});

// 🔹 Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method,
    tip: 'Visita /api/info para ver los endpoints disponibles'
  });
});

// 🔹 Endpoint TEMPORAL de depuración: decodifica el JWT del Authorization header (NO VERIFICA)
// Útil para confirmar aud, scp, groups en el token que el cliente está enviando.
app.get('/debug/decode', (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(400).json({ error: 'Missing Authorization: Bearer <token>' });
    const token = auth.replace('Bearer ', '');
    const parts = token.split('.');
    if (parts.length < 2) return res.status(400).json({ error: 'Invalid JWT format' });
    const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8'));
    return res.json({ decoded: payload });
  } catch (e) {
    return res.status(500).json({ error: 'Decode failed', message: e.message });
  }
});

// 🔹 Inicio del servidor
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
