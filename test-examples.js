// 🧪 Ejemplos de Pruebas para la Simulación de API

// ========================================
// 📋 POSTMAN COLLECTION EXAMPLES
// ========================================

/*
Para importar en Postman, crea una nueva collection con estos endpoints:

1. GET {{baseUrl}}/api/info
   - No auth required
   
2. GET {{baseUrl}}/api/me
   - Auth: Bearer Token
   - Token: {{accessToken}}
   
3. GET {{baseUrl}}/api/users
   - Auth: Bearer Token
   - Token: {{accessToken}}
   - Requires scope: user.read
   
4. POST {{baseUrl}}/api/users
   - Auth: Bearer Token
   - Token: {{accessToken}}
   - Body (JSON):
   {
     "name": "Test User",
     "email": "test@example.com",
     "role": "user"
   }
   - Requires scope: user.write

Variables:
- baseUrl: http://localhost:3000
- accessToken: [Tu token de Okta]
*/

// ========================================
// 🌐 CURL EXAMPLES
// ========================================

/*
# 1. Información pública del API
curl -X GET "http://localhost:3000/api/info" \
  -H "Accept: application/json"

# 2. Health check
curl -X GET "http://localhost:3000/api/health"

# 3. Información del usuario autenticado
curl -X GET "http://localhost:3000/api/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"

# 4. Listar usuarios (requiere scope user.read)
curl -X GET "http://localhost:3000/api/users" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"

# 5. Obtener usuario específico
curl -X GET "http://localhost:3000/api/users/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"

# 6. Crear nuevo usuario (requiere scope user.write)
curl -X POST "http://localhost:3000/api/users" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Carlos",
    "email": "juan.carlos@email.com",
    "role": "user"
  }'

# 7. Listar productos (requiere scope product.read)
curl -X GET "http://localhost:3000/api/products" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"

# 8. Crear producto (requiere scope product.write)
curl -X POST "http://localhost:3000/api/products" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MacBook Pro",
    "price": 2499.99,
    "category": "electronics"
  }'

# 9. Estadísticas admin (requiere scope admin)
curl -X GET "http://localhost:3000/api/admin/stats" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"

# 10. Eliminar usuario (requiere scope admin + role admin)
curl -X DELETE "http://localhost:3000/api/admin/users/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"
*/

// ========================================
// 🟨 JAVASCRIPT FETCH EXAMPLES
// ========================================

// Configuración base
const BASE_URL = 'http://localhost:3000';
const ACCESS_TOKEN = 'YOUR_TOKEN_HERE'; // Reemplaza con tu token real

// Headers comunes
const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${ACCESS_TOKEN}`
};

// 1. Obtener información del API (público)
async function getApiInfo() {
  try {
    const response = await fetch(`${BASE_URL}/api/info`);
    const data = await response.json();
    console.log('API Info:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// 2. Obtener información del usuario autenticado
async function getUserInfo() {
  try {
    const response = await fetch(`${BASE_URL}/api/me`, { headers });
    const data = await response.json();
    
    if (response.ok) {
      console.log('User Info:', data);
      return data;
    } else {
      console.error('Auth Error:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// 3. Listar usuarios
async function getUsers() {
  try {
    const response = await fetch(`${BASE_URL}/api/users`, { headers });
    const data = await response.json();
    
    if (response.ok) {
      console.log('Users:', data);
      return data;
    } else {
      console.error('Authorization Error:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// 4. Crear nuevo usuario
async function createUser(userData) {
  try {
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('User Created:', data);
      return data;
    } else {
      console.error('Creation Error:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// 5. Manejar diferentes tipos de errores
async function testErrorHandling() {
  console.log('🧪 Probando manejo de errores...\n');
  
  // Test 1: Sin token
  console.log('1. Probando sin token...');
  try {
    const response = await fetch(`${BASE_URL}/api/users`);
    const data = await response.json();
    console.log('Respuesta:', data);
  } catch (error) {
    console.error('Error:', error);
  }
  
  // Test 2: Token inválido
  console.log('\n2. Probando con token inválido...');
  try {
    const response = await fetch(`${BASE_URL}/api/users`, {
      headers: {
        'Authorization': 'Bearer token-invalido',
        'Accept': 'application/json'
      }
    });
    const data = await response.json();
    console.log('Respuesta:', data);
  } catch (error) {
    console.error('Error:', error);
  }
  
  // Test 3: Scope insuficiente (simular)
  console.log('\n3. Scope insuficiente sería mostrado aquí si el token no tiene user.read');
}

// ========================================
// 🐍 PYTHON REQUESTS EXAMPLES
// ========================================

/*
import requests
import json

# Configuración
BASE_URL = "http://localhost:3000"
ACCESS_TOKEN = "YOUR_TOKEN_HERE"  # Reemplaza con tu token real

headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": f"Bearer {ACCESS_TOKEN}"
}

# 1. Información del API (público)
def get_api_info():
    response = requests.get(f"{BASE_URL}/api/info")
    print("API Info:", response.json())
    return response.json()

# 2. Información del usuario
def get_user_info():
    response = requests.get(f"{BASE_URL}/api/me", headers=headers)
    if response.status_code == 200:
        print("User Info:", response.json())
    else:
        print("Error:", response.json())

# 3. Listar usuarios
def get_users():
    response = requests.get(f"{BASE_URL}/api/users", headers=headers)
    if response.status_code == 200:
        print("Users:", response.json())
    else:
        print("Error:", response.json())

# 4. Crear usuario
def create_user(user_data):
    response = requests.post(
        f"{BASE_URL}/api/users", 
        headers=headers, 
        json=user_data
    )
    if response.status_code == 201:
        print("User Created:", response.json())
    else:
        print("Error:", response.json())

# 5. Probar manejo de errores
def test_error_handling():
    print("🧪 Probando manejo de errores...\n")
    
    # Sin token
    print("1. Sin token:")
    response = requests.get(f"{BASE_URL}/api/users")
    print("Status:", response.status_code)
    print("Response:", response.json())
    
    # Token inválido
    print("\n2. Token inválido:")
    invalid_headers = {"Authorization": "Bearer token-invalido"}
    response = requests.get(f"{BASE_URL}/api/users", headers=invalid_headers)
    print("Status:", response.status_code)
    print("Response:", response.json())

# Ejecutar ejemplos
if __name__ == "__main__":
    get_api_info()
    # get_user_info()  # Descomenta cuando tengas un token válido
    # get_users()      # Descomenta cuando tengas un token válido
*/

// ========================================
// 🧪 AUTOMATIZACIÓN DE PRUEBAS
// ========================================

// Test suite completo para validar todos los middlewares
async function runCompleteTestSuite() {
  console.log('🎯 Iniciando suite completa de pruebas...\n');
  
  const tests = [
    {
      name: 'Endpoint público - /api/info',
      test: () => fetch(`${BASE_URL}/api/info`),
      expectedStatus: 200
    },
    {
      name: 'Endpoint público - /api/health',
      test: () => fetch(`${BASE_URL}/api/health`),
      expectedStatus: 200
    },
    {
      name: 'Sin autenticación - /api/me',
      test: () => fetch(`${BASE_URL}/api/me`),
      expectedStatus: 401
    },
    {
      name: 'Con token válido - /api/me',
      test: () => fetch(`${BASE_URL}/api/me`, { headers }),
      expectedStatus: 200
    },
    {
      name: 'Scope user.read - /api/users',
      test: () => fetch(`${BASE_URL}/api/users`, { headers }),
      expectedStatus: 200 // o 403 si no tienes el scope
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`🔍 ${test.name}`);
      const response = await test.test();
      const status = response.status;
      const data = await response.json();
      
      if (status === test.expectedStatus) {
        console.log(`✅ PASS - Status: ${status}`);
      } else {
        console.log(`❌ FAIL - Expected: ${test.expectedStatus}, Got: ${status}`);
        console.log(`   Response:`, data);
      }
    } catch (error) {
      console.log(`❌ ERROR - ${error.message}`);
    }
    console.log('');
  }
}

// ========================================
// 📊 EJEMPLOS DE USO
// ========================================

// Ejemplo 1: Flujo completo de autenticación
async function completeAuthFlow() {
  console.log('🔐 Flujo completo de autenticación\n');
  
  // 1. Verificar que el API está funcionando
  console.log('1. Verificando estado del API...');
  await getApiInfo();
  
  // 2. Intentar acceder sin token (debe fallar)
  console.log('\n2. Intentando acceder sin token...');
  try {
    const response = await fetch(`${BASE_URL}/api/me`);
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
  
  // 3. Acceder con token (debe funcionar)
  console.log('\n3. Accediendo con token...');
  await getUserInfo();
  
  // 4. Probar diferentes scopes
  console.log('\n4. Probando diferentes scopes...');
  await getUsers();
}

// Ejecutar ejemplos (descomenta para usar)
// getApiInfo();
// completeAuthFlow();
// runCompleteTestSuite();

console.log(`
🎯 GUÍA DE PRUEBAS CARGADA
==========================

Para probar la simulación:

1. Asegúrate de que el servidor esté corriendo:
   node server.js

2. Obtén un token válido desde tu aplicación Okta

3. Reemplaza 'YOUR_TOKEN_HERE' con tu token real

4. Ejecuta las funciones de ejemplo:
   - getApiInfo()       // Información pública
   - getUserInfo()      // Con autenticación
   - getUsers()         // Con scope user.read
   - testErrorHandling() // Casos de error

5. Prueba con curl, Postman, o Python según prefieras

¡Happy testing! 🚀
`);