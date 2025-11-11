// ***********************************************
// Comandos custom para tests E2E
// ***********************************************

// Comando para limpiar usuarios de test antes de empezar
Cypress.Commands.add('cleanupTestUsers', () => {
  const apiBase = Cypress.env('apiUrl') || 'http://localhost:8000/api';
  cy.request({
    method: 'DELETE',
    url: `${apiBase}/test-cleanup/cleanup-test-users`,
    failOnStatusCode: false // No fallar si el endpoint no existe
  }).then((response) => {
    if (response.status === 200) {
      cy.log(`✅ Usuarios de test eliminados: ${response.body.deletedCount}`);
    }
  });
});

// Comando para registrar un nuevo usuario
Cypress.Commands.add('registerUser', (userData) => {
  const apiBase = Cypress.env('apiUrl') || 'http://localhost:8000/api';
  // Usar API directamente para asegurar el registro
  cy.request({
    method: 'POST',
    url: `${apiBase}/auth/register`,
    body: {
      nombre: userData.nombre,
      apellido: userData.apellido,
      email: userData.email,
      password: userData.password
    },
    failOnStatusCode: false // No fallar si hay error
  }).then((response) => {
    if (response.status === 201) {
      cy.log(`✅ Usuario registrado: ${userData.email}`);
    } else if (response.status === 400 && response.body.message?.includes('ya existe')) {
      cy.log(`⚠️ Usuario ya existe: ${userData.email}`);
    } else {
      cy.log(`❌ Error en registro: ${response.status} - ${JSON.stringify(response.body)}`);
    }
  });
});

// Comando para hacer login
Cypress.Commands.add('loginUser', (email, password) => {
  const apiBase = Cypress.env('apiUrl') || 'http://localhost:8000/api';
  cy.visit('/login');
  
  cy.get('input[name="email"]').clear().type(email);
  cy.get('input[name="password"]').clear().type(password);
  cy.get('button[type="submit"]').click();
  
  // Esperar a que se complete el login y redirija a products
  cy.wait(3000); // Aumentado a 3s para Azure
  
  cy.url().then((url) => {
    if (url.includes('/products')) {
      cy.log(`✅ Login exitoso para ${email}`);
    } else {
      cy.log(`❌ Login falló para ${email}, URL actual: ${url}`);
    }
  });
  
  // Verificar que estamos en products (con timeout más largo)
  cy.url({ timeout: 20000 }).should('include', '/products');
});

// Comando para registrar Y hacer login (útil para tests que necesitan usuario autenticado)
Cypress.Commands.add('createAndLoginUser', (userData) => {
  // Registrar
  cy.registerUser(userData);
  
  // Navegar al login (puede que ya estemos ahí o no)
  cy.visit('/login');
  
  // Hacer login
  cy.loginUser(userData.email, userData.password);
  
  // Verificar que estamos en /products
  cy.url({ timeout: 10000 }).should('include', '/products');
});

//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })