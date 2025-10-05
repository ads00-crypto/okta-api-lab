const express = require('express');
const path = require('path');
const OktaJwtVerifier = require('@okta/jwt-verifier');
const app = express();
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
  audience: 'https://okta-auth0-api-lab.onrender.com',
});

// 🔹 Middleware de logging para debugging
function logRequest(req, res, next) {
  const timestamp = new Date().toISOString();
  const authHeader = req.headers.authorization ? '✅ Con token' : '❌ Sin token';
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${authHeader}`);
  next();
}

// 🔹 Middleware de verificación general (mejorado)
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
    const jwt = await oktaJwtVerifier.verifyAccessToken(token);
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

// 🔹 Middleware para exigir un scope específico (mejorado)
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

// 🔹 Middleware para verificar roles de usuario
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
    name: 'Okta API Lab - Simulación de Entrenamiento',
    version: '1.0.0',
    description: 'API para practicar autenticación y autorización con tokens JWT',
    endpoints: {
      public: ['/api/info', '/api/health'],
      authenticated: ['/api/me', '/api/users', '/api/products'],
      scopes: {
        'user.read': 'Leer información de usuarios',
        'user.write': 'Crear/modificar usuarios',
        'product.read': 'Leer información de productos',
        'product.write': 'Crear/modificar productos',
        'admin': 'Acceso administrativo completo'
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

// 🔹 Endpoint administrativo (requiere scope admin)
app.get('/api/admin/stats', requireScope('admin'), (req, res) => {
  res.json({
    message: '🔐 Acceso administrativo autorizado',
    scope: 'admin',
    stats: {
      totalUsers: simulatedUsers.length,
      totalProducts: simulatedProducts.length,
      serverUptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    },
    admin: req.user.sub
  });
});

// 🔹 Ejemplo de endpoint con múltiples middlewares
app.delete('/api/admin/users/:id', 
  requireScope('admin'), 
  requireRole('admin'), 
  (req, res) => {
    const userId = parseInt(req.params.id);
    const userIndex = simulatedUsers.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const deletedUser = simulatedUsers.splice(userIndex, 1)[0];
    
    res.json({
      message: '🗑️ Usuario eliminado exitosamente',
      scope: 'admin',
      role: 'admin',
      data: deletedUser,
      deletedBy: req.user.sub
    });
  }
);

// 🔹 Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method,
    tip: 'Visita /api/info para ver los endpoints disponibles'
  });
});

// 🔹 Inicio del servidor
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
