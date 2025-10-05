const express = require('express');
const path = require('path');
const OktaJwtVerifier = require('@okta/jwt-verifier');
const app = express();
const PORT = process.env.PORT || 3000;

// 🔹 Configura el verificador de tokens
const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: 'https://fernandosandbox.oktapreview.com/oauth2/ausbxl4gmakGkhLXy0x7',
  audience: 'https://okta-auth0-api-lab.onrender.com',
});

// 🔹 Middleware de verificación general
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    await oktaJwtVerifier.verifyAccessToken(token);
    next();
  } catch (err) {
    console.error('❌ Token inválido:', err.message);
    res.status(401).send('Unauthorized');
  }
}

// 🔹 Middleware para exigir un scope específico
function requireScope(scope) {
  return async (req,res,next)=>{
    try {
      const token = (req.headers.authorization||'').replace('Bearer ','');
      const { claims } = await oktaJwtVerifier.verifyAccessToken(token, 'api://default'); // issuer/aud/exp OK
      if (claims.tok_typ && claims.tok_typ !== 'Bearer') return res.status(401).send('Wrong token type');
      if (!claims.scp?.includes(scope)) return res.status(403).send('Forbidden');
      // opcional: if (claims.azp !== EXPECTED_CLIENT_ID) return res.status(403).send('Bad azp');
      req.user = claims; // pasa claims a controladores
      next();
    } catch (e) { return res.status(401).send('Unauthorized'); }
  };
}
app.get('/users',  requireScope('user.read'),  handlerRead);
app.post('/users', requireScope('user.write'), handlerWrite);

// 🔹 Páginas públicas
app.get('/', (_r, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login', (_r, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/callback', (_r, res) => res.sendFile(path.join(__dirname, 'callback.html')));
app.get('/profile', (_r, res) => res.sendFile(path.join(__dirname, 'profile.html')));
app.get('/api-console', (_r,res)=>res.sendFile(path.join(__dirname,'api-console.html')));

// 🔹 Endpoints protegidos
app.get('/users', requireScope('user.read'), (_r, res) =>
  res.send('👀 Puedes leer usuarios (scope: user.read)'));
app.post('/users', requireScope('user.write'), (_r, res) =>
  res.send('✏️ Puedes modificar usuarios (scope: user.write)'));

// 🔹 Inicio del servidor
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
